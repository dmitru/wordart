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
    // this.fItems = []

    if (!this.paperItems.shape) {
      return
    }

    // if (this.fBgObjs.length === 0) {
    //   return
    // }

    if (!this.shapes) {
      // console.log(this.getSceneBounds(), ctx, this.fBgObjs[0])
      try {
        const raster = this.paperItems.shape?.rasterize(80, false)
        const imgData = raster.getImageData(
          new paper.Rectangle(0, 0, raster.width, raster.height)
        )
        const ctx = createCanvasCtx({ w: raster.width, h: raster.height })
        ctx.putImageData(imgData, 0, 0)
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

    for (const shape of nonTransparentShapes) {
      const s = shape.hBounds.get_js()
      console.log('shape JS: ', s)
      const result = await this.generator.generate({
        shape,
        itemColor: this.store.itemsColor,
        bounds: this.getSceneBounds(),
      })

      const imgUri = result.items[0].ctx.canvas.toDataURL()
      const img = await fetchImage(imgUri)

      const addedItems: paper.Item[] = []
      for (const item of result.items) {
        const itemImg = new paper.Raster(img)
        itemImg.scale(item.transform.a)
        const w = itemImg.bounds.width
        const h = itemImg.bounds.height
        itemImg.position = new paper.Point(
          item.transform.e + w / 2,
          item.transform.f + h / 2
        )

        // itemImg.transform(
        //   new paper.Matrix(
        //     item.transform.a,
        //     item.transform.b,
        //     item.transform.c,
        //     item.transform.d,
        //     item.transform.e,
        //     item.transform.f
        //   )
        // )
        console.log('item = ', itemImg.position.x, itemImg.position.y)
        addedItems.push(itemImg)
        // itemImg.set({
        //   width: item.ctx.canvas.width,
        //   height: item.ctx.canvas.height,
        //   opacity: 1,
        //   selectable: true,
        //   hasControls: true,
        //   hasBorders: true,
        //   scaleX: item.transform.a,
        //   scaleY: item.transform.d,
        //   top: item.transform.f,
        //   left: item.transform.e,
        // })

        // this.fc.add(itemImg)
        // this.fItems.push(itemImg)
      }

      if (this.paperItems.shapeItemsGroup) {
        this.paperItems.shapeItemsGroup.remove()
      }

      this.paperItems.shapeItemsGroup = new paper.Group(addedItems)
      this.paperItems.shapeItemsGroup.insertAbove(this.paperItems.shape)

      // for (const fBgShape of this.fBgObjs) {
      //   fBgShape.sendToBack()
      // }
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
