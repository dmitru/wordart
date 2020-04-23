import { sortBy } from 'lodash'
import chroma from 'chroma-js'
import { rotate, scale, translate } from 'transformation-matrix'
import { aabbForRect, Rect, multiply } from 'lib/wordart/geometry'
import {
  HBounds,
  computeHBounds,
  drawHBounds,
  drawHBoundsWasm,
  computeHBoundsForCanvasWasm,
} from 'lib/wordart/hbounds'
import {
  clearCanvas,
  createCanvasCtx,
  createCanvasCtxCopy,
} from 'lib/wordart/canvas-utils'
import * as WasmModule from 'lib/wordart/wasm-gen-types'

let wasm: any | null = null
import('lib/wordart/wasm-gen/pkg/wasm_gen').then((_wasm) => {
  console.log('wasm: ', wasm)
  wasm = _wasm
})

export const getColorsFromImageData = (
  imgData: ImageData
): { color: number; count: number }[] => {
  const d = imgData.data
  const counts = new Map<number, number>()

  for (let y = 0; y < imgData.height; ++y) {
    for (let x = 0; x < imgData.width; ++x) {
      const index = 4 * (x + y * imgData.width)
      const r = d[index]
      const g = d[index + 1]
      const b = d[index + 2]
      const color = (r << 16) + (g << 8) + b
      counts.set(color, (counts.get(color) || 0) + 1)
    }
  }

  const result: { color: number; count: number }[] = []
  for (let [color, count] of counts) {
    result.push({ color, count })
  }

  return sortBy(result, (r) => -r.count)
}

export const colorIntToRgb = (
  color: number
): { r: number; g: number; b: number } => {
  const r = (color & 0xff0000) >> 16
  const g = (color & 0xff00) >> 8
  const b = color & 0xff
  return { r, g, b }
}

export const colorIntToHex = (color: number): string => {
  const { r, g, b } = colorIntToRgb(color)
  return chroma(r, g, b).hex()
}

export type Shape = {
  hBounds: HBounds
  hBoundsInverted: HBounds
  color: string
  percentFilled: number
}

export type ShapeWasm = {
  hBounds: WasmModule.HBoundsWasm
  hBoundsInverted: WasmModule.HBoundsWasm
  color: string
  percentFilled: number
}

export const computeShapesWasm = (params: {
  originalSize: number
  srcCanvas: HTMLCanvasElement
  invert?: boolean
  imgSize?: number
  angle?: number
  maxLevel?: number
  minSize?: number
  visualize?: boolean
}): ShapeWasm[] => {
  const {
    originalSize = 800,
    srcCanvas,
    imgSize = 800,
    angle = 0,
    visualize = false,
    minSize = 1,
    maxLevel = 12,
  } = params
  console.log('computeShapesWasm: ', params)

  if (!wasm) {
    throw new Error('wasm is not loaded')
  }

  const srcBounds = {
    x: 0,
    y: 0,
    w: srcCanvas.width,
    h: srcCanvas.height,
  }

  const srcAaabUnscaled = aabbForRect(rotate(angle), srcBounds)
  const scaleFactor = imgSize / Math.max(srcAaabUnscaled.w, srcAaabUnscaled.h)

  const aabbScaled = aabbForRect(
    multiply(rotate(angle), scale(scaleFactor)),
    srcBounds
  )

  const transform = multiply(
    translate(-aabbScaled.x, -aabbScaled.y),
    rotate(angle)
  )

  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = aabbScaled.w
  canvas.height = aabbScaled.h
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.save()
  ctx.setTransform(transform)
  ctx.drawImage(
    srcCanvas,
    0,
    0,
    srcCanvas.width,
    srcCanvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  )
  ctx.restore()

  const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

  const colorsFiltered = wasm.fill_shapes_by_color(
    new Uint32Array(imgData.data.buffer),
    imgData.width,
    imgData.height,
    0.03
  )

  const totalPixelCount = imgData.width * imgData.height

  const shapes: ShapeWasm[] = []

  clearCanvas(ctx)
  ctx.putImageData(imgData, 0, 0)
  // console.log(colorsFiltered)
  // console.screenshot(ctx.canvas, 0.3)
  // console.log(ctx.canvas.height, ctx.canvas.width)

  for (const { r, g, b, count: colorPixelCount } of colorsFiltered) {
    const hBounds = computeHBoundsForCanvasWasm({
      srcCanvas: canvas,
      imgSize,
      color: { r, g, b },
      minSize,
      maxLevel,
      visualize,
    })
    const hBoundsInverted = computeHBoundsForCanvasWasm({
      srcCanvas: canvas,
      imgSize,
      color: { r, g, b },
      invert: true,
      minSize,
      maxLevel,
      visualize,
    })

    console.log('scaleFactor', scaleFactor, originalSize, imgSize)
    const transform = multiply(
      scale(1),
      multiply(
        scale(originalSize / imgSize),
        translate(aabbScaled.x, aabbScaled.y)
      )
    )
    hBounds.set_transform(
      transform.a,
      transform.b,
      transform.c,
      transform.d,
      transform.e,
      transform.f
    )
    hBoundsInverted.set_transform(
      transform.a,
      transform.b,
      transform.c,
      transform.d,
      transform.e,
      transform.f
    )

    const shape: ShapeWasm = {
      color: chroma(r, g, b).hex(),
      hBounds,
      hBoundsInverted,
      percentFilled: colorPixelCount / totalPixelCount,
    }

    shapes.push(shape)
  }

  return shapes
}
