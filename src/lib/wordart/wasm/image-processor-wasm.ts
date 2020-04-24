import chroma from 'chroma-js'
import * as tm from 'transformation-matrix'
import { Rect, scaleRect } from 'lib/wordart/geometry'
import { computeHBoundsForCanvasWasm } from 'lib/wordart/hbounds'
import {
  clearCanvas,
  createCanvasCtx,
  Dimensions,
} from 'lib/wordart/canvas-utils'
import { WasmModule, HBoundsWasm } from 'lib/wordart/wasm/wasm-module'

export class ImageProcessorWasm {
  wasm: WasmModule

  constructor(wasm: WasmModule) {
    this.wasm = wasm
  }

  findShapesByColor = (params: ComputeShapesParams) =>
    findShapesByColorWasm(this.wasm, params)
}

export type ShapeWasm = {
  hBounds: HBoundsWasm
  hBoundsInverted: HBoundsWasm
  color: string
  pixelsCount: number
  percentArea: number
}

export type ComputeShapesParams = {
  canvas: HTMLCanvasElement
  percentAreaThreshold?: number
  debug?: boolean
  invert?: boolean
  maxLevel?: number
  minSize?: number
}

/** Processes */
const findShapesByColorWasm = (
  wasm: WasmModule,
  params: ComputeShapesParams
): ShapeWasm[] => {
  const {
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

  const bounds: Rect = {
    x: 0,
    y: 0,
    w: srcCanvas.width,
    h: srcCanvas.height,
  }

  const scaleFactorX = 1
  const scaleFactorY = 1

  const boundsScaled = scaleRect(bounds, scaleFactorX, scaleFactorY)

  const ctx = createCanvasCtx(bounds)
  ctx.save()
  ctx.drawImage(
    srcCanvas,
    0,
    0,
    srcCanvas.width,
    srcCanvas.height,
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height
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
    console.log('A = ', { r, g, b, a })
    const hBounds = computeHBoundsForCanvasWasm({
      srcCanvas: ctx.canvas,
      imgSize: bounds.w,
      color: { r, g, b, a },
      minSize,
      maxLevel,
      visualize: false,
    })
    const hBoundsInverted = computeHBoundsForCanvasWasm({
      srcCanvas: ctx.canvas,
      imgSize: bounds.w,
      color: { r, g, b, a },
      invert: true,
      minSize,
      maxLevel,
      visualize: false,
    })

    const hboundsTransform = tm.scale(scaleFactorX, scaleFactorY)

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
