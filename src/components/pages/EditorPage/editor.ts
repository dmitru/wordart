import { EditorPageStore } from 'components/pages/EditorPage/editor-page-store'
import { fetchImage } from 'lib/wordart/canvas-utils'
import { fabric } from 'fabric'
import { consoleLoggers } from 'utils/console-logger'
import { getWasmModule } from 'lib/wordart/wasm/wasm-module'
import { Rect } from 'lib/wordart/geometry'
import {
  ImageProcessorWasm,
  ShapeWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import { Generator } from 'components/pages/EditorPage/generator'
import chroma from 'chroma-js'

export type EditorInitParams = {
  canvas: HTMLCanvasElement
  store: EditorPageStore
}

export class Editor {
  logger = consoleLoggers.editor

  ctx: CanvasRenderingContext2D
  params: EditorInitParams
  store: EditorPageStore
  fc: fabric.Canvas
  generator: Generator
  shapes?: ShapeWasm[]

  fBgObjs: fabric.Object[] = []
  fItems: fabric.Object[] = []

  constructor(params: EditorInitParams) {
    this.params = params
    this.store = params.store

    this.generator = new Generator()

    // Init Fabric canvas
    this.fc = new fabric.Canvas(params.canvas.id, {
      preserveObjectStacking: true,
      imageSmoothingEnabled: true,
      enableRetinaScaling: true,
      renderOnAddRemove: false,
    })

    this.logger.debug(
      `Editor: init, ${this.fc.getWidth()} x ${this.fc.getHeight()}`
    )

    // @ts-ignore
    window['fc'] = this.fc
    this.fc.backgroundColor = 'white'
    this.ctx = this.fc.getContext()

    this.generateAndRenderAll()
  }

  getSceneBounds = (): Rect => ({
    x: 0,
    y: 0,
    w: this.fc.getWidth(),
    h: this.fc.getHeight(),
  })

  getBgShapeBounds = (): Rect => {
    const bounds = this.fBgObjs[0].getBoundingRect()
    return {
      x: bounds.left,
      y: bounds.top,
      w: bounds.width,
      h: bounds.height,
    }
  }

  generateItems = async () => {
    this.logger.debug('Editor: generate')
    this.fItems = []

    if (!this.shapes) {
      const imgCanvas = (this.fBgObjs[0].toCanvasElement() as any) as HTMLCanvasElement

      const wasm = await getWasmModule()

      const imageProcessor = new ImageProcessorWasm(wasm)
      const shapes = imageProcessor.findShapesByColor({
        canvas: imgCanvas,
        debug: false,
      })
      this.shapes = shapes
    }

    const nonTransparentShapes = this.shapes
      .filter((shape) => {
        const color = chroma(shape.color)
        return color.alpha() > 0.01 && color.luminance() < 0.95
      })
      .slice(0, 1)
    this.logger.debug(
      'Generator.generate: nonTransparentShapes: ',
      nonTransparentShapes
    )

    for (const shape of nonTransparentShapes) {
      const s = shape.hBounds.get_js()
      const result = await this.generator.generate({
        shape,
        bounds: {
          x: s.bounds.x,
          y: s.bounds.y,
          w: s.bounds.w,
          h: s.bounds.h,
        },
      })

      const imgUri = result.items[0].ctx.canvas.toDataURL()
      const img = await fetchImage(imgUri)

      for (const item of result.items) {
        const itemImg = new fabric.Image(img)
        itemImg.set({
          width: item.ctx.canvas.width,
          height: item.ctx.canvas.height,
          opacity: 1,
          selectable: true,
          hasControls: true,
          hasBorders: true,
          scaleX: item.transform.a,
          scaleY: item.transform.d,
          top: item.transform.f,
          left: item.transform.e,
        })

        this.fc.add(itemImg)
        this.fItems.push(itemImg)
      }

      for (const fBgShape of this.fBgObjs) {
        fBgShape.sendToBack()
      }
    }
  }

  clear = async (render = true) => {
    this.logger.debug('Editor: clear')
    this.fc.remove(...this.fc.getObjects())
    if (render) {
      this.fc.renderAll()
    }
    this.fBgObjs = []
    this.fItems = []
  }

  private prepareBgImg = async () => {
    const shape = this.store.getSelectedShape()

    let fShapeObj: fabric.Object

    if (shape.kind === 'svg') {
      const svgObjects = await new Promise<fabric.Object[]>((resolve) =>
        fabric.loadSVGFromURL(shape.url, resolve)
      )
      this.logger.debug('Editor: loading BG from SVG:', svgObjects)
      fShapeObj = svgObjects[0]
      if (shape.fill) {
        fShapeObj.fill = shape.fill
      }
    } else {
      fShapeObj = await new Promise<fabric.Image>((resolve) =>
        fabric.Image.fromURL(shape.url, resolve)
      )
      this.logger.debug('Editor: loading BG from raster image', fShapeObj)
    }

    this.fBgObjs = [fShapeObj]

    fShapeObj.set({
      left: 0,
      top: 0,
      opacity: 0.3,
      selectable: false,
      hasControls: false,
      evented: false,
    })

    if (
      fShapeObj.width &&
      fShapeObj.height &&
      fShapeObj.width > fShapeObj.height
    ) {
      fShapeObj.scaleToWidth(0.9 * this.fc.getWidth(), true)
      fShapeObj.setCoords()
      console.log(
        'this.fc.getWidth()',
        this.fc.getWidth(),
        fShapeObj.getBoundingRect()
      )
    } else {
      fShapeObj.scaleToHeight(0.9 * this.fc.getHeight(), true)
    }

    this.fc.add(fShapeObj)
  }

  clearAndRenderBgShape = async () => {
    this.clear(false)
    await this.prepareBgImg()
    this.fc.renderAll()
  }

  generateAndRenderAll = async () => {
    this.clear(false)
    await this.prepareBgImg()
    await this.generateItems()
    this.fc.renderAll()
  }

  destroy = () => {}
}
