import {
  aabbForRect,
  multiply,
  Point,
  randomPointInRect,
  transformRectNoSkew,
} from 'lib/wordart/geometry'
import {
  rotate,
  scale,
  translate,
  Matrix,
  identity,
} from 'transformation-matrix'
import { createCanvasCtxCopy } from 'lib/wordart/canvas-utils'
import {
  HBoundsWasmSerialized,
  WasmModule,
  HBoundsWasm,
} from 'lib/wordart/wasm/wasm-module'
import { Rgba } from 'lib/wordart/wasm/wasm-gen-types'
import { weightedSample } from 'lib/wordart/random-utils'

export const computeHBoundsForCanvasWasm = (
  wasm: WasmModule,
  {
    srcCanvas,
    color = { r: 0, g: 0, b: 0, a: 1 },
    invert = false,
    scratchCanvasMaxSize = 800,
    angle = 0,
    visualize = false,
    minSize = 4,
    maxLevel = 9,
  }: {
    srcCanvas: HTMLCanvasElement
    color?: Rgba
    invert?: boolean
    scratchCanvasMaxSize?: number
    angle?: number
    maxLevel?: number
    minSize?: number
    visualize?: boolean
  }
): HBoundsWasm => {
  // console.log('computeHBoundsForCanvasWasm', srcCanvas.width, srcCanvas.height)
  const pathBboxRect = {
    x: 0,
    y: 0,
    w: srcCanvas.width,
    h: srcCanvas.height,
  }

  const aaabUnscaled = aabbForRect(rotate(angle), pathBboxRect)
  const aaabScaleFactor =
    scratchCanvasMaxSize / Math.max(aaabUnscaled.w, aaabUnscaled.h)

  const pathAaab = aabbForRect(multiply(rotate(angle), scale(1)), pathBboxRect)

  const scaleFactor = aaabScaleFactor

  const pathAaabTransform = multiply(
    multiply(translate(-pathAaab.x, -pathAaab.y), rotate(angle)),
    scale(scaleFactor)
  )

  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = pathAaab.w
  canvas.height = pathAaab.h
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.save()
  ctx.setTransform(pathAaabTransform)
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

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

  const hboundsWasm = wasm!.create_hbounds_by_color(
    new Uint32Array(imageData.data.buffer),
    imageData.width,
    imageData.height,
    color.r,
    color.g,
    color.b,
    color.a,
    invert
  )

  if (visualize) {
    const ctx2 = createCanvasCtxCopy(ctx)
    drawHBoundsWasm(ctx2, hboundsWasm)
    console.screenshot(ctx2.canvas)
  }

  const transform = multiply(
    scale(1 / aaabScaleFactor),
    translate(pathAaab.x, pathAaab.y)
  )
  hboundsWasm.set_transform(
    transform.a,
    transform.b,
    transform.c,
    transform.d,
    transform.e,
    transform.f
  )

  return hboundsWasm
}

export const randomPointInsideHboundsSerialized = (
  hBounds: HBoundsWasmSerialized
): Point | null => {
  const impl = (
    hBoundsCur: HBoundsWasmSerialized,
    transform: Matrix,
    level = 0
  ): Point | null => {
    if (!hBoundsCur.overlaps_shape) {
      return null
    }
    if (
      hBoundsCur.children.length === 0 ||
      hBoundsCur.bounds.w < 2 ||
      hBoundsCur.bounds.h < 2
    ) {
      return randomPointInRect(
        transformRectNoSkew(transform, hBoundsCur.bounds)
      )
    }

    const candidates = hBoundsCur.children.filter((c) => c.overlapping_area > 0)
    if (candidates.length === 0) {
      return null
    }
    const childIndex = weightedSample(candidates.map((c) => c.overlapping_area))
    const child = candidates[childIndex]
    return impl(
      child,
      multiply(transform, child.transform || identity()),
      level + 1
    )
  }

  return impl(hBounds, hBounds.transform || identity())
}

export const drawHBoundsWasm = (
  ctx: CanvasRenderingContext2D,
  hBounds: HBoundsWasm
) => {
  const hBoundsSerialized = hBounds.get_js() as HBoundsWasmSerialized

  const drawHBoundsImpl = (hBounds: HBoundsWasmSerialized, level = 0) => {
    if (level > 9) {
      return
    }
    ctx.save()
    ctx.lineWidth = 0.5

    ctx.strokeStyle = hBounds.overlaps_shape ? '#f003' : '#00f3'

    if (hBounds.transform) {
      ctx.transform(
        hBounds.transform.a,
        hBounds.transform.b,
        hBounds.transform.c,
        hBounds.transform.d,
        hBounds.transform.e,
        hBounds.transform.f
      )
    }

    // if (hBounds.overlapsShape) {
    // if (!hBounds.children) {
    ctx.strokeRect(
      hBounds.bounds.x,
      hBounds.bounds.y,
      hBounds.bounds.w,
      hBounds.bounds.h
    )
    // }
    // }
    // }

    if (hBounds.children) {
      hBounds.children.forEach((child) => drawHBoundsImpl(child, level + 1))
    }

    ctx.restore()
  }

  drawHBoundsImpl(hBoundsSerialized)
}
