import chroma from 'chroma-js'
import * as tm from 'transformation-matrix'
import { Rect } from 'lib/wordart/geometry'
import { clearCanvas, createCanvasCtx } from 'lib/wordart/canvas-utils'
import { WasmModule, HBoundsWasm } from 'lib/wordart/wasm/wasm-module'
import { computeHBoundsForCanvasWasm } from 'lib/wordart/wasm/hbounds'

export class ImageProcessorWasm {
  wasm: WasmModule

  constructor(wasm: WasmModule) {
    this.wasm = wasm
  }

  /** Processes an image, determine shapesbased on colors, return shape information for each shape, including its hbounds */
  findShapesByColor = (params: ComputeShapesParams) =>
    findShapesByColorWasm(this.wasm, params)

  findLargestRect = (imgData: ImageData, bounds: Rect, aspect: number): Rect =>
    findLargestRectWasm(this.wasm, imgData, bounds, aspect)
}

export type ShapeWasm = {
  hBounds: HBoundsWasm
  hBoundsInverted: HBoundsWasm
  color: string
  pixelsCount: number
  percentArea: number
}

export type ComputeShapesParams = {
  bounds: Rect
  canvas: HTMLCanvasElement
  percentAreaThreshold?: number
  debug?: boolean
  invert?: boolean
  maxLevel?: number
  minSize?: number
}

const findLargestRectWasm = (
  wasm: WasmModule,
  imgData: ImageData,
  bounds: Rect,
  aspect: number
): Rect => {
  const rect = wasm.largest_rect(
    new Uint8Array(imgData.data.buffer),
    imgData.width,
    imgData.height,
    bounds.x,
    bounds.y,
    bounds.w,
    bounds.h,
    aspect
  ) as Rect
  return rect
}

const findShapesByColorWasm = (
  wasm: WasmModule,
  params: ComputeShapesParams
): ShapeWasm[] => {
  const {
    bounds,
    canvas: srcCanvas,
    debug = false,
    minSize = 1,
    maxLevel = 12,
    percentAreaThreshold = 0.05,
  } = params
  console.log('findShapesByColorWasm: ', params)

  if (!wasm) {
    throw new Error('wasm is not loaded')
  }

  const canvasBounds: Rect = {
    x: 0,
    y: 0,
    w: srcCanvas.width,
    h: srcCanvas.height,
  }

  const scaleFactorX = bounds.w / canvasBounds.w
  const scaleFactorY = bounds.h / canvasBounds.h

  console.log('scaleFactorX', 'scaleFactory', scaleFactorX, scaleFactorY)

  const ctx = createCanvasCtx(canvasBounds)
  ctx.save()
  ctx.drawImage(
    srcCanvas,
    0,
    0,
    srcCanvas.width,
    srcCanvas.height,
    0,
    0,
    srcCanvas.width,
    srcCanvas.height
  )
  ctx.restore()

  const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

  const colorsFiltered = wasm.fill_shapes_by_color(
    new Uint32Array(imgData.data.buffer),
    imgData.width,
    imgData.height,
    percentAreaThreshold
  )

  const totalPixelCount = imgData.width * imgData.height
  const shapes: ShapeWasm[] = []

  if (debug) {
    clearCanvas(ctx)
    ctx.putImageData(imgData, 0, 0)
    console.screenshot(ctx.canvas, 1)
  }

  for (const { r, g, b, a, count: colorPixelCount } of colorsFiltered) {
    const hBounds = computeHBoundsForCanvasWasm(wasm, {
      srcCanvas: ctx.canvas,
      scratchCanvasMaxSize: Math.max(canvasBounds.w, canvasBounds.h),
      color: { r, g, b, a },
      minSize,
      maxLevel,
      visualize: true,
    })
    const hBoundsInverted = computeHBoundsForCanvasWasm(wasm, {
      srcCanvas: ctx.canvas,
      scratchCanvasMaxSize: Math.max(canvasBounds.w, canvasBounds.h),
      color: { r, g, b, a },
      invert: true,
      minSize,
      maxLevel,
      visualize: true,
    })

    const hboundsTransform = tm.compose(
      tm.translate(bounds.x, bounds.y),
      tm.scale(scaleFactorX, scaleFactorY)
    )

    hBounds.set_transform(
      hboundsTransform.a,
      hboundsTransform.b,
      hboundsTransform.c,
      hboundsTransform.d,
      hboundsTransform.e,
      hboundsTransform.f
    )
    hBoundsInverted.set_transform(
      hboundsTransform.a,
      hboundsTransform.b,
      hboundsTransform.c,
      hboundsTransform.d,
      hboundsTransform.e,
      hboundsTransform.f
    )

    const shape: ShapeWasm = {
      // @ts-ignore
      color: chroma({ r, g, b, a: a / 255 }).hex(),
      hBounds,
      hBoundsInverted,
      pixelsCount: colorPixelCount,
      percentArea: colorPixelCount / totalPixelCount,
    }

    shapes.push(shape)
  }

  return shapes
}
