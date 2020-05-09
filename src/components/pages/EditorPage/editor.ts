import {
  EditorPageStore,
  ItemsColorGradient,
  ItemsColoring,
} from 'components/pages/EditorPage/editor-page-store'
import {
  fetchImage,
  createCanvasCtx,
  imageDataToCanvasCtx,
} from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import { getWasmModule } from 'lib/wordart/wasm/wasm-module'
import { Rect, padRect } from 'lib/wordart/geometry'
import {
  ImageProcessorWasm,
  ShapeWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import { Generator, ItemId, Item } from 'components/pages/EditorPage/generator'
import chroma from 'chroma-js'
import paper from 'paper'
import { loadFont } from 'lib/wordart/fonts'
import * as tm from 'transformation-matrix'
import { matrixToPaperTransform } from 'components/pages/EditorPage/paper-utils'
import { Path } from 'opentype.js'
import { sample, max, min } from 'lodash'
import seedrandom from 'seedrandom'

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
  itemsShape: Item[] = []
  itemIdToPaperItem: Map<number, paper.Item> = new Map()

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

  setShapeFillColor = (color: string) => {
    if (this.paperItems.shape) {
      this.paperItems.shape.fillColor = new paper.Color(color)
    }
  }

  setShapeFillOpacity = (opacity: number) => {
    if (this.paperItems.shape) {
      this.paperItems.shape.opacity = opacity
    }
  }

  setItemsColor = (type: 'shape' | 'background', coloring: ItemsColoring) => {
    let colors: string[] = []
    if (coloring.kind === 'single-color') {
      colors = [coloring.color]
    } else {
      const scale = chroma.scale([coloring.colorFrom, coloring.colorTo])
      colors = scale.colors(10)
    }
    const paperColors = colors.map((color) => new paper.Color(color))

    const itemAreas = this.itemsShape.map((item) => {
      if (item.kind === 'word') {
        const wordPathBb = item.wordPathBounds
        const scaling = item.transform.scaling
        const wordH = (wordPathBb.y2 - wordPathBb.y1) * scaling.y
        const wordW = (wordPathBb.x2 - wordPathBb.x1) * scaling.x
        const wordArea = Math.sqrt(wordH * wordW)
        return wordArea
      }

      if (item.kind === 'symbol') {
        const bounds = item.symbolDef.item.bounds
        const w = bounds.width * item.transform.scaling.x
        const h = bounds.height * item.transform.scaling.y
        return Math.sqrt(w * h)
      }

      return 0
    })
    const maxArea = max(itemAreas)!
    const minArea = min(itemAreas)!

    const rng = seedrandom('fill color')

    const dimSmallerFactor = coloring.dimSmallerItems / 100
    for (let i = 0; i < this.itemsShape.length; ++i) {
      const item = this.itemsShape[i]
      const area = itemAreas[i]
      const path = this.itemIdToPaperItem.get(item.id)
      if (!path) {
        continue
      }
      if (item.kind !== 'word' && item.kind !== 'symbol') {
        continue
      }

      const index = Math.floor(rng() * paperColors.length)
      path.fillColor = paperColors[index]
      path.opacity =
        (dimSmallerFactor * (area - minArea)) / (maxArea - minArea) +
        (1 - dimSmallerFactor)
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
    const sceneBounds = this.getSceneBounds(padding)
    if (Math.max(w, h) !== Math.max(sceneBounds.width, sceneBounds.height)) {
      const scale = Math.min(sceneBounds.width / w, sceneBounds.height / h)
      shapeItem.scale(scale)
    }

    shapeItem.position = sceneBounds.center

    shapeItem.opacity = this.store.shapeStyle.bgOpacity
    shapeItem.insertAbove(this.paperItems.bgRect)
    this.paperItems.shape = shapeItem

    this.paperItems.shapeItemsGroup?.remove()
    this.paperItems.shapeItemsGroup = undefined
    this.paperItems.bgItemsGroup?.remove()
    this.paperItems.bgItemsGroup = undefined

    this.shapes = undefined
  }

  getSceneBounds = (pad = 20): paper.Rectangle =>
    new paper.Rectangle({
      x: pad,
      y: pad,
      width: paper.view.bounds.width - pad * 2,
      height: paper.view.bounds.height - pad * 2,
    })

  generateItems = async (type: 'shape' | 'background') => {
    this.store.isVisualizing = true

    const isBackground = type === 'background'
    const style = isBackground
      ? this.store.backgroundStyle
      : this.store.shapeStyle

    this.logger.debug('Editor: generate')

    if (!this.paperItems.shape) {
      console.log('checkpoint1')
      return
    }
    console.log('checkpoint2')
    await this.generator.init()
    console.log('checkpoint3')

    const fonts = await Promise.all(
      FONT_NAMES.map((fontName) => loadFont(`/fonts/${fontName}`))
    )
    // @ts-ignore
    window['fonts'] = fonts

    if (!this.paperItems.shape) {
      return
    }

    this.paperItems.shape?.insertAbove(this.paperItems.bgRect)

    const shapeItem = this.paperItems.shape.children
      ? this.paperItems.shape.children[1]
      : this.paperItems.shape

    const color = shapeItem.fillColor
    shapeItem.fillColor = new paper.Color('black')
    const shapeRaster = shapeItem.rasterize(
      this.paperItems.shape.view.resolution,
      false
    )
    shapeItem.fillColor = color

    const shapeCanvas = shapeRaster.getSubCanvas(
      new paper.Rectangle(0, 0, shapeRaster.width, shapeRaster.height)
    )
    shapeRaster.remove()

    const result = await this.generator.fillShape({
      shape: {
        canvas: shapeCanvas,
        bounds: shapeRaster.bounds,
      },
      shapePadding: style.shapePadding,
      itemPadding: Math.max(1, 100 - style.itemDensity),
      wordsMaxSize: style.wordsMaxSize,
      iconsMaxSize: style.iconsMaxSize,
      words: style.words.map((wc) => ({
        wordConfigId: wc.id,
        text: wc.text,
        angles: style.angles,
        fillColors: ['red'],
        // fonts: [fonts[0], fonts[1], fonts[2]],
        fonts: isBackground ? [fonts[1]] : fonts,
      })),
      icons: style.icons.map((shape) => ({
        shape: this.store.getShapeById(shape.shapeId)!,
      })),
      iconProbability: style.iconsProportion / 100,
    })

    this.itemsShape = result.placedItems

    const addedItems: paper.Item[] = []
    let img: HTMLImageElement | null = null

    let wordIdToSymbolDef = new Map<string, paper.SymbolDefinition>()
    let itemIdToPaperItem = new Map<ItemId, paper.Item>()

    const coloring = this.store.getItemColoring(type)

    for (const item of result.placedItems) {
      if (item.kind === 'symbol') {
        const itemInstance = item.symbolDef.item.clone()
        // itemInstance.fillColor = new paper.Color('red')
        itemInstance.transform(item.transform)
        addedItems.push(itemInstance)
        itemIdToPaperItem.set(item.id, itemInstance)
      } else if (item.kind === 'img') {
        if (!img) {
          const imgUri = item.ctx.canvas.toDataURL()
          img = await fetchImage(imgUri)
        }
        const itemImg = new paper.Raster(img)
        itemImg.scale(item.transform.a)
        const w = itemImg.bounds.width
        const h = itemImg.bounds.height
        itemImg.position = new paper.Point(
          item.transform.tx + w / 2,
          item.transform.ty + h / 2
        )
        addedItems.push(itemImg)
        itemIdToPaperItem.set(item.id, itemImg)
      } else if (item.kind === 'word') {
        const wordId = item.word.id

        if (!wordIdToSymbolDef.has(wordId)) {
          const paths = item.word.font.getPaths(
            item.word.text,
            0,
            0,
            item.word.fontSize
          )

          const pathItems = paths.map((path: Path) => {
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

        const wordItem = symbolDef.item.clone()

        wordItem.rotate(
          (item.word.angle / Math.PI) * 180,
          new paper.Point(0, 0)
        )
        wordItem.transform(item.transform)
        addedItems.push(wordItem)

        itemIdToPaperItem.set(item.id, wordItem)
      }
    }

    this.paperItems.shapeItemsGroup?.remove()
    const shapeItemsGroup = new paper.Group([
      // this.paperItems.shape.clone(),
      ...addedItems,
    ])

    // shapeItemsGroup.clipped = true
    this.paperItems.shapeItemsGroup = shapeItemsGroup
    this.paperItems.shapeItemsGroup.insertAbove(this.paperItems.shape)
    this.paperItems.shapeWordIdToSymbolDef = wordIdToSymbolDef

    this.itemIdToPaperItem = itemIdToPaperItem
    this.setItemsColor(type, coloring)

    this.store.isVisualizing = false
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
