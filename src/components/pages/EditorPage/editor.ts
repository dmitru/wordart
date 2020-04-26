import { EditorPageStore } from 'components/pages/EditorPage/editor-page-store'
import { fetchImage, createCanvasCtx } from 'lib/wordart/canvas-utils'
import { fabric } from 'fabric'
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
import { Point } from 'fabric/fabric-impl'

export type EditorInitParams = {
  canvas: HTMLCanvasElement
  store: EditorPageStore
}

export class Editor {
  logger = consoleLoggers.editor

  // ctx: CanvasRenderingContext2D
  params: EditorInitParams
  store: EditorPageStore
  // fc: fabric.Canvas
  generator: Generator
  shapes?: ShapeWasm[]

  paperItems: {
    bgRect: paper.Path
    shape?: paper.Item
  }

  fBgObjs: fabric.Object[] = []
  fItems: fabric.Object[] = []

  constructor(params: EditorInitParams) {
    this.params = params
    this.store = params.store

    this.generator = new Generator()

    paper.setup(params.canvas)
    // Init Fabric canvas
    // this.fc = new fabric.Canvas(params.canvas.id, {
    //   preserveObjectStacking: true,
    //   imageSmoothingEnabled: true,
    //   enableRetinaScaling: false,
    //   renderOnAddRemove: false,
    // })

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
    if (this.paperItems.shape) {
      this.paperItems.shape.remove()
    }

    let newItem: paper.Item | null = null

    if (shapeConfig.kind === 'svg') {
      const shapeItemGroup: paper.Group = await new Promise<paper.Group>(
        (resolve) =>
          new paper.Item().importSVG(shapeConfig.url, (item: paper.Item) =>
            resolve(item as paper.Group)
          )
      )
      shapeItemGroup.fillColor = new paper.Color(this.store.bgShapeColor)
      newItem = shapeItemGroup
    } else {
      const shapeItemRaster: paper.Raster = await new Promise<paper.Raster>(
        (resolve) => {
          const raster = new paper.Raster(shapeConfig.url)
          raster.onLoad = () => {
            resolve(raster)
          }
        }
      )
      newItem = shapeItemRaster
    }

    const w = newItem.bounds.width
    const h = newItem.bounds.height

    const padding = 20
    const sceneBounds = padRect(this.getSceneBounds(), -padding)
    if (Math.max(w, h) !== Math.max(sceneBounds.w, sceneBounds.h)) {
      newItem.scale(Math.max(sceneBounds.w, sceneBounds.h) / Math.max(w, h))
    }

    const w2 = newItem.bounds.width
    const h2 = newItem.bounds.height

    newItem.position = new paper.Point(
      (sceneBounds.w - w2) / 2 + w2 / 2 + padding,
      (sceneBounds.h - h2) / 2 + h2 / 2 + padding
    )

    newItem.insertAbove(this.paperItems.bgRect)
    this.paperItems.shape = newItem
  }

  getSceneBounds = (): Rect => ({
    x: 0,
    y: 0,
    w: paper.view.bounds.width,
    h: paper.view.bounds.height,
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

    if (this.fBgObjs.length === 0) {
      return
    }

    if (!this.shapes) {
      const ctx = createCanvasCtx(this.getSceneBounds())
      console.log(this.getSceneBounds(), ctx, this.fBgObjs[0])
      try {
        this.fBgObjs[0].render(ctx)
        console.screenshot(ctx.canvas)
      } catch (error) {
        console.error(error)
        debugger
      }

      const wasm = await getWasmModule()

      const imageProcessor = new ImageProcessorWasm(wasm)
      const shapes = imageProcessor.findShapesByColor({
        canvas: ctx.canvas,
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
      this.shapes,
      nonTransparentShapes
    )

    for (const shape of nonTransparentShapes) {
      const s = shape.hBounds.get_js()
      const result = await this.generator.generate({
        shape,
        itemColor: this.store.itemsColor,
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

        // this.fc.add(itemImg)
        this.fItems.push(itemImg)
      }

      for (const fBgShape of this.fBgObjs) {
        fBgShape.sendToBack()
      }
    }
  }

  clear = async (render = true) => {
    // this.logger.debug('Editor: clear')
    // this.fc.remove(...this.fc.getObjects())
    // if (render) {
    //   this.fc.renderAll()
    // }
    // this.fBgObjs = []
    // this.fItems = []
  }

  private prepareBgImg = async () => {
    //   const shape = this.store.getSelectedShape()
    //   let fShapeObj: fabric.Object
    //   if (shape.kind === 'svg') {
    //     const svgObjects = await new Promise<fabric.Object[]>((resolve) =>
    //       fabric.loadSVGFromURL(shape.url, resolve)
    //     )
    //     this.logger.debug('Editor: loading BG from SVG:', svgObjects)
    //     fShapeObj = svgObjects[0]
    //     fShapeObj.fill = this.store.bgShapeColor
    //   } else {
    //     fShapeObj = await new Promise<fabric.Image>((resolve) =>
    //       fabric.Image.fromURL(shape.url, resolve)
    //     )
    //     this.logger.debug('Editor: loading BG from raster image', fShapeObj)
    //   }
    //   this.fBgObjs = [fShapeObj]
    //   fShapeObj.set({
    //     left: 0,
    //     top: 0,
    //     opacity: 1,
    //     selectable: false,
    //     hasControls: false,
    //     evented: false,
    //   })
    //   if (
    //     fShapeObj.width &&
    //     fShapeObj.height &&
    //     fShapeObj.width > fShapeObj.height
    //   ) {
    //     fShapeObj.scaleToWidth(0.9 * this.fc.getWidth(), true)
    //     fShapeObj.setCoords()
    //   } else {
    //     fShapeObj.scaleToHeight(0.9 * this.fc.getHeight(), true)
    //   }
    //   fShapeObj.left = (this.fc.getWidth() - fShapeObj.getScaledWidth()) / 2
    //   fShapeObj.top = (this.fc.getHeight() - fShapeObj.getScaledHeight()) / 2
    //   this.fc.add(fShapeObj)
  }

  clearAndRenderBgShape = async () => {
    // this.logger.debug('Editor: clearAndRenderBgShape')
    // this.clear(false)
    // await this.prepareBgImg()
    // this.fc.renderAll()
  }

  generateAndRenderAll = async () => {
    // this.logger.debug('Editor: generateAndRenderAll')
    // this.clear(false)
    // await this.prepareBgImg()
    // await this.generateItems()
    // this.fc.renderAll()
  }

  destroy = () => {}
}
