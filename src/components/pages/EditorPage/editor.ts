import { EditorPageStore } from 'components/pages/EditorPage/editor-page-store'
import { fetchImage, createCanvasCtx } from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import {
  getWasmModule,
  HBoundsWasmSerialized,
} from 'lib/wordart/wasm/wasm-module'
import { Rect, padRect } from 'lib/wordart/geometry'
import {
  ImageProcessorWasm,
  ShapeWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import { Generator } from 'components/pages/EditorPage/generator'
import chroma from 'chroma-js'
import paper from 'paper'
import { loadFont } from 'lib/wordart/fonts'
import { Matrix } from 'lib/wordart/wasm/wasm-gen-types'
import * as tm from 'transformation-matrix'
import { hBoundsWasmSerializedToPaperGroup } from 'components/pages/EditorPage/paper-utils'

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
    shape?: paper.Item
    shapeHbounds?: paper.Group
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
    bgRect.fillColor = new paper.Color(this.store.bgColor)
    this.paperItems = {
      bgRect,
    }
  }

  setBackgroundColor = (color: string) => {
    this.paperItems.bgRect.fillColor = new paper.Color(color)
  }

  setBgShapeColor = (color: string) => {
    if (this.paperItems.shape) {
      this.paperItems.shape.fillColor = new paper.Color(color)
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
      shapeItemGroup.fillColor = new paper.Color(this.store.bgShapeColor)
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
    this.shapes = undefined
  }

  getSceneBounds = (): Rect => ({
    x: 0,
    y: 0,
    w: paper.view.bounds.width,
    h: paper.view.bounds.height,
  })

  generateItems = async () => {
    this.logger.debug('Editor: generate')

    if (!this.paperItems.shape) {
      return
    }

    if (!this.shapes) {
      try {
        const raster = this.paperItems.shape?.rasterize(80, false)
        const imgData = raster.getImageData(
          new paper.Rectangle(0, 0, raster.width, raster.height)
        )
        const ctx = createCanvasCtx({
          w: raster.width + 4,
          h: raster.height + 4,
        })
        ctx.putImageData(imgData, 2, 2)
        console.log('raster', raster)
        console.screenshot(ctx.canvas)

        const wasm = await getWasmModule()

        const imageProcessor = new ImageProcessorWasm(wasm)
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
        return color.alpha() > 0.01 && color.luminance() < 0.95
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
      // this.paperItems.shape?.insertAbove(this.paperItems.bgRect)

      const result = await this.generator.generate({
        shape,
        bounds: this.getSceneBounds(),
        words: this.store.getWords().map((wc) => ({
          wordConfigId: wc.id,
          angles: [0],
          fillColors: ['red'],
          fonts: [fonts[0]],
          text: wc.text,
        })),
      })

      const addedItems: paper.Item[] = []
      let img: HTMLImageElement | null = null

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
          // console.log('item = ', itemImg.position.x, itemImg.position.y)
          addedItems.push(itemImg)
        } else if (item.kind === 'word') {
          const pathItem = new paper.Path(item.word.symbols[0].getPathData())
          pathItem.fillColor = new paper.Color('blue')
          // console.log(
          //   'pathItem.bounds',
          //   pathItem.bounds.width,
          //   pathItem.bounds.height
          // )
          pathItem.scale(item.transform.a)
          const w = pathItem.bounds.width
          const h = pathItem.bounds.height
          // console.log('w, h', w, h, item.transform.a)
          pathItem.position = new paper.Point(
            item.transform.e,
            item.transform.f
          )
          addedItems.push(pathItem)
        }
      }

      if (this.paperItems.shapeItemsGroup) {
        this.paperItems.shapeItemsGroup.remove()
      }

      this.paperItems.shapeItemsGroup = new paper.Group(addedItems)
      this.paperItems.shapeItemsGroup.insertAbove(this.paperItems.shape)
    }
  }

  clear = async (render = true) => {
    this.logger.debug('Editor: clear')
    this.paperItems.shape?.remove()
    this.paperItems.shapeHbounds?.remove()
    this.paperItems.shapeItemsGroup?.remove()
  }

  destroy = () => {}
}
