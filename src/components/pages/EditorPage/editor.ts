import {
  EditorPageStore,
  ItemsColorGradient,
  ItemsColoring,
} from 'components/pages/EditorPage/editor-page-store'
import { fetchImage, createCanvasCtx } from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import { getWasmModule } from 'lib/wordart/wasm/wasm-module'
import { Rect, padRect } from 'lib/wordart/geometry'
import {
  ImageProcessorWasm,
  ShapeWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import { Generator } from 'components/pages/EditorPage/generator'
import chroma from 'chroma-js'
import paper from 'paper'
import { loadFont } from 'lib/wordart/fonts'
import * as tm from 'transformation-matrix'
import { matrixToPaperTransform } from 'components/pages/EditorPage/paper-utils'

const FONT_NAMES = [
  'mountains-of-christmas_bold.ttf',
  'mail-ray-stuff.ttf',
  'Verona-Xlight.ttf',
]

export type EditorInitParams = {
  canvas: HTMLCanvasElement
  store: EditorPageStore
}

export class Editor {
  logger = consoleLoggers.editor

  params: EditorInitParams
  store: EditorPageStore
  generator: Generator
  shapes?: ShapeWasm[]

  paperItems: {
    bgRect: paper.Path
    bgItemsGroup?: paper.Group
    bgWordIdToSymbolDef: Map<string, paper.SymbolDefinition>
    shape?: paper.Item
    shapeHbounds?: paper.Group
    shapeWordIdToSymbolDef: Map<string, paper.SymbolDefinition>
    shapeItemsGroup?: paper.Group
  }

  constructor(params: EditorInitParams) {
    this.params = params
    this.store = params.store

    this.generator = new Generator()

    paper.setup(params.canvas)

    this.logger.debug(
      `Editor: init, ${params.canvas.width} x ${params.canvas.height}`
    )

    // @ts-ignore
    window['paper'] = paper
    const bgRect = new paper.Path.Rectangle(
      new paper.Point(0, 0),
      new paper.Point(params.canvas.width, params.canvas.height)
    )
    bgRect.fillColor = new paper.Color(this.store.backgroundStyle.bgColor)
    this.paperItems = {
      bgRect,
      bgWordIdToSymbolDef: new Map(),
      shapeWordIdToSymbolDef: new Map(),
    }

    // params.canvas.add
  }

  setBackgroundColor = (color: string) => {
    this.paperItems.bgRect.fillColor = new paper.Color(color)
  }

  setBgShapeColor = (color: string) => {
    if (this.paperItems.shape) {
      this.paperItems.shape.fillColor = new paper.Color(color)
    }
  }

  updateItemsColor = (
    type: 'shape' | 'background',
    coloring: ItemsColoring
  ) => {
    const itemsGroup =
      type === 'shape'
        ? this.paperItems.shapeItemsGroup
        : this.paperItems.bgItemsGroup
    if (!itemsGroup) {
      return
    }
    let colors: string[] = []
    if (coloring.kind === 'single-color') {
      colors = [coloring.color]
    } else {
      const scale = chroma.scale([coloring.colorFrom, coloring.colorTo])
      colors = scale.colors(this.paperItems.shapeWordIdToSymbolDef.size)
    }

    let index = 0
    for (const path of itemsGroup.children) {
      path.fillColor = new paper.Color(colors[index % colors.length])
      index++
    }
  }

  updateBgShape = async () => {
    const shapeConfig = this.store.getSelectedShape()
    this.paperItems.shape?.remove()
    this.paperItems.shapeHbounds?.remove()

    let shapeItem: paper.Item | null = null

    if (shapeConfig.kind === 'svg') {
      const shapeItemGroup: paper.Group = await new Promise<paper.Group>(
        (resolve) =>
          new paper.Item().importSVG(shapeConfig.url, (item: paper.Item) =>
            resolve(item as paper.Group)
          )
      )
      shapeItemGroup.fillColor = new paper.Color(this.store.shapeStyle.bgColor)
      shapeItem = shapeItemGroup
    } else {
      const shapeItemRaster: paper.Raster = await new Promise<paper.Raster>(
        (resolve) => {
          const raster = new paper.Raster(shapeConfig.url)
          raster.onLoad = () => {
            resolve(raster)
          }
        }
      )
      shapeItem = shapeItemRaster
    }

    const w = shapeItem.bounds.width
    const h = shapeItem.bounds.height

    const padding = 20
    const sceneBounds = padRect(this.getSceneBounds(), -padding)
    if (Math.max(w, h) !== Math.max(sceneBounds.w, sceneBounds.h)) {
      shapeItem.scale(Math.max(sceneBounds.w, sceneBounds.h) / Math.max(w, h))
    }

    const w2 = shapeItem.bounds.width
    const h2 = shapeItem.bounds.height

    shapeItem.position = new paper.Point(
      (sceneBounds.w - w2) / 2 + w2 / 2 + padding,
      (sceneBounds.h - h2) / 2 + h2 / 2 + padding
    )

    shapeItem.insertAbove(this.paperItems.bgRect)
    this.paperItems.shape = shapeItem

    this.paperItems.shapeItemsGroup?.remove()
    this.paperItems.shapeItemsGroup = undefined
    this.paperItems.bgItemsGroup?.remove()
    this.paperItems.bgItemsGroup = undefined
    this.shapes = undefined
  }

  getSceneBounds = (pad = 20): Rect => ({
    x: pad,
    y: pad,
    w: paper.view.bounds.width - pad * 2,
    h: paper.view.bounds.height - pad * 2,
  })

  generateItems = async (type: 'shape' | 'background') => {
    const isBackground = type === 'background'
    const style = isBackground
      ? this.store.backgroundStyle
      : this.store.shapeStyle

    this.logger.debug('Editor: generate')

    if (!this.paperItems.shape) {
      return
    }

    if (!this.shapes) {
      try {
        const raster = this.paperItems.shape?.rasterize(40, false)
        const imgData = raster.getImageData(
          new paper.Rectangle(0, 0, raster.width, raster.height)
        )
        const ctx = createCanvasCtx({
          w: raster.width + 4,
          h: raster.height + 2,
        })
        ctx.putImageData(imgData, 2, 2)

        const wasm = await getWasmModule()

        const imageProcessor = new ImageProcessorWasm(wasm)
        console.log(
          'this.paperItems.shape.bounds = ',
          this.paperItems.shape.bounds
        )

        const padding = 20
        const view = this.paperItems.shape.parent.view
        const generateBounds: Rect = {
          x: padding,
          y: padding,
          w: view.bounds.width - 2 * padding,
          h: view.bounds.height - 2 * padding,
        }

        const shapes = imageProcessor.findShapesByColor({
          bounds: {
            x: this.paperItems.shape.bounds.x,
            y: this.paperItems.shape.bounds.y,
            w: this.paperItems.shape.bounds.width,
            h: this.paperItems.shape.bounds.height,
          },
          canvas: ctx.canvas,
          debug: true,
        })
        this.shapes = shapes
      } catch (error) {
        console.error(error)
        debugger
      }
    }

    if (!this.shapes) {
      return
    }

    await this.generator.init()

    this.logger.debug(
      'Shapes: ',
      this.shapes.map((s) => s.hBounds.get_js())
    )

    const nonTransparentShapes = this.shapes
      .filter((shape) => {
        const color = chroma(shape.color)
        const isEmpty = color.alpha() > 0.01 && color.luminance() < 0.95
        return isBackground ? !isEmpty : isEmpty
      })
      .slice(0, 1)
    this.logger.debug(
      'Generator.generate: nonTransparentShapes: ',
      this.shapes,
      nonTransparentShapes
    )

    const fonts = await Promise.all(
      FONT_NAMES.map((fontName) => loadFont(`/fonts/${fontName}`))
    )
    // @ts-ignore
    window['fonts'] = fonts

    for (const shape of nonTransparentShapes) {
      const s = shape.hBounds.get_js()

      // this.paperItems.shapeHbounds = hBoundsWasmSerializedToPaperGroup(s)
      this.paperItems.shape?.insertAbove(this.paperItems.bgRect)

      const result = await this.generator.generate({
        shape,
        placementAlgorithm: 'random',
        fitWithinShape: style.fitWithinShape,
        bounds: this.getSceneBounds(),
        itemScaleMin: style.itemScaleMin,
        itemScaleMax: style.itemScaleMax,
        shapePadding: style.shapePadding,
        itemPadding: style.itemPadding,
        words: style.words.map((wc) => ({
          wordConfigId: wc.id,
          // angles: [0, -(90 * Math.PI) / 180, -(30 * Math.PI) / 180],
          angles: style.angles.map((aDeg) => (aDeg * Math.PI) / 180),
          fillColors: ['red'],
          // fonts: [fonts[0], fonts[1], fonts[2]],
          fonts: isBackground ? [fonts[1]] : [fonts[2]],
          text: wc.text,
        })),
      })

      const addedItems: paper.Item[] = []
      let img: HTMLImageElement | null = null

      let wordIdToSymbolDef = new Map<string, paper.SymbolDefinition>()

      for (const item of result.items) {
        // TODO: convert result items into paper paths
        if (item.kind === 'img') {
          if (!img) {
            const imgUri = item.ctx.canvas.toDataURL()
            img = await fetchImage(imgUri)
          }
          const itemImg = new paper.Raster(img)
          itemImg.scale(item.transform.a)
          const w = itemImg.bounds.width
          const h = itemImg.bounds.height
          itemImg.position = new paper.Point(
            item.transform.e + w / 2,
            item.transform.f + h / 2
          )
          addedItems.push(itemImg)
        } else if (item.kind === 'word') {
          const wordId = item.word.id

          if (!wordIdToSymbolDef.has(wordId)) {
            const paths = item.word.font.getPaths(
              item.word.text,
              0,
              0,
              item.word.fontSize
            )

            const pathItems = paths.map((path) => {
              let pathData = path.toPathData(3)
              const item = paper.Path.create(pathData)
              item.fillColor = new paper.Color(style.itemsColor)
              item.fillRule = 'evenodd'
              return item
            })
            const pathItemsGroup = new paper.Group(pathItems)
            const symbolDef = new paper.SymbolDefinition(pathItemsGroup, true)
            wordIdToSymbolDef.set(wordId, symbolDef)
          }

          const symbolDef = wordIdToSymbolDef.get(wordId)!

          // const wordItem = symbolDef.place(new paper.Point(0, 0))
          const wordItem = symbolDef.item.clone()

          wordItem.rotate(
            (item.word.angle / Math.PI) * 180,
            new paper.Point(0, 0)
          )
          wordItem.transform(matrixToPaperTransform(tm.compose(item.transform)))
          addedItems.push(wordItem)
        }
      }

      if (isBackground) {
        this.paperItems.bgItemsGroup?.remove()
        this.paperItems.bgItemsGroup = new paper.Group(addedItems)
        this.paperItems.bgItemsGroup.insertAbove(this.paperItems.shape)
        this.paperItems.bgWordIdToSymbolDef = wordIdToSymbolDef
      } else {
        this.paperItems.shapeItemsGroup?.remove()
        const shapeItemsGroup =
          this.paperItems.shape.children &&
          this.paperItems.shape.children.length > 1
            ? new paper.Group([
                this.paperItems.shape.children[1].clone(),
                ...addedItems,
              ])
            : new paper.Group(addedItems)
        shapeItemsGroup.clipped = true
        this.paperItems.shapeItemsGroup = shapeItemsGroup
        this.paperItems.shapeItemsGroup.insertAbove(this.paperItems.shape)
        this.paperItems.shapeWordIdToSymbolDef = wordIdToSymbolDef
      }

      this.updateItemsColor(type, this.store.getItemColoring(type))
    }
  }

  clear = async (render = true) => {
    this.logger.debug('Editor: clear')
    this.paperItems.shape?.remove()
    this.paperItems.shapeHbounds?.remove()
    this.paperItems.shapeItemsGroup?.remove()
    this.paperItems.bgItemsGroup?.remove()
  }

  destroy = () => {}
}
