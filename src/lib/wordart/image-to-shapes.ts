import { sortBy } from 'lodash'
import chroma from 'chroma-js'
import { rotate, scale, translate, Point } from 'transformation-matrix'
import { aabbForRect, Rect, multiply } from 'lib/wordart/geometry'
import {
  HBounds,
  computeHBounds,
  drawHBounds,
  randomPointInsideHbounds,
} from 'lib/wordart/hbounds'
import { clearCanvas, createCanvasCtx } from 'lib/wordart/canvas-utils'

declare class Wasm {
  fill_shapes_by_color(
    img_data: Uint32Array,
    w: number,
    h: number,
    threshold_part: number
  ): { count: number; r: number; g: number; b: number }[]
}

let wasm: Wasm | null = null
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

export const computeShapes = ({
  originalSize = 800,
  srcCanvas,
  imgSize = 400,
  angle = 0,
  visualize = true,
  minSize = 1,
  maxLevel = 12,
}: {
  originalSize: number
  srcCanvas: HTMLCanvasElement
  invert?: boolean
  imgSize?: number
  angle?: number
  maxLevel?: number
  minSize?: number
  visualize?: boolean
}): Shape[] => {
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
    16
  )
  // throw new Error('r')
  // const colors = getColorsFromImageData(imgData)

  const totalPixelCount = imgData.width * imgData.height
  // const thresholdCount = totalPixelCount / 16
  // const colorsFiltered = colors.filter((c) => c.count >= thresholdCount)

  // console.log('Colors: ', colors, colorsFiltered)
  // const colorsSet = new Set(colorsFiltered.map((c) => c.color))

  // for (let x = 0; x < imgData.width; ++x) {
  //   for (let y = 0; y < imgData.height; ++y) {
  //     const index = 4 * (x + y * imgData.width)
  //     const r = imgData.data[index]
  //     const g = imgData.data[index + 1]
  //     const b = imgData.data[index + 2]
  //     const color = (r << 16) + (g << 8) + b
  //     if (!colorsSet.has(color)) {
  //       const colorHex = colorIntToHex(color)
  //       const closestColors = sortBy(colorsFiltered, (c) =>
  //         chroma.deltaE(colorHex, colorIntToHex(c.color))
  //       )
  //       const closestColor = closestColors[0]
  //       const closestColorRgb = colorIntToRgb(closestColor.color)
  //       imgData.data[index] = closestColorRgb.r
  //       imgData.data[index + 1] = closestColorRgb.g
  //       imgData.data[index + 2] = closestColorRgb.b
  //     }
  //   }
  // }

  // const ctx2 = createCanvasCtx({ w: imgData.width, h: imgData.height })
  // ctx2.putImageData(imgData, 0, 0)

  const shapes: Shape[] = []

  for (const { r, g, b, count: colorPixelCount } of colorsFiltered) {
    clearCanvas(ctx)

    console.log('Shape colors: ', { r, g, b })

    const isPointIntersectingShape = (x: number, y: number): boolean => {
      const index = 4 * (y * imgData.width + x)
      return (
        imgData.data[index] === r &&
        imgData.data[index + 1] === g &&
        imgData.data[index + 2] === b
      )
    }

    const dx = 1

    const isRectIntersecting = (bounds: Rect): 'full' | 'partial' | 'none' => {
      const maxX = bounds.x + bounds.w
      const maxY = bounds.y + bounds.h

      let checked = 0
      let overlapping = 0

      for (let x = Math.ceil(bounds.x); x < Math.floor(maxX); x += dx) {
        for (let y = Math.ceil(bounds.y); y < Math.floor(maxY); y += dx) {
          const intersecting = isPointIntersectingShape(x, y)
          if (intersecting) {
            overlapping += 1
          }
          checked += 1
        }
      }

      if (overlapping === 0 || checked === 0) {
        return 'none'
      }

      return checked === overlapping ? 'full' : 'partial'
    }

    const isRectIntersectingInverted = (
      bounds: Rect
    ): 'full' | 'partial' | 'none' => {
      const result = isRectIntersecting(bounds)
      if (result === 'full') {
        return 'none'
      }
      if (result === 'none') {
        return 'full'
      }
      return 'partial'
    }

    // Visualize sample points
    // if (visualize) {
    //   for (let x = 0; x < imgData.width; x += dx) {
    //     for (let y = 0; y < imgData.height; y += dx) {
    //       const intersecting = isPointIntersectingShape(x, y)
    //       if (intersecting) {
    //         ctx.fillStyle = 'yellow'
    //         ctx.fillRect(x, y, 2, 2)
    //       }
    //     }
    //   }
    // }

    const hBounds = computeHBounds(
      {
        x: 0,
        y: 0,
        h: canvas.height,
        w: canvas.width,
      },
      isRectIntersecting,
      minSize,
      maxLevel
    )
    const hBoundsInverted = computeHBounds(
      {
        x: 0,
        y: 0,
        h: canvas.height,
        w: canvas.width,
      },
      isRectIntersectingInverted,
      minSize,
      maxLevel
    )

    if (visualize) {
      drawHBounds(ctx, hBounds)
      console.screenshot(ctx.canvas)
    }

    console.log('scaleFactor', scaleFactor, originalSize, imgSize)
    hBounds.transform = multiply(
      scale(1),
      multiply(
        scale(originalSize / imgSize),
        translate(aabbScaled.x, aabbScaled.y)
      )
    )

    const shape: Shape = {
      color: chroma(r, g, b).hex(),
      hBounds,
      hBoundsInverted,
      percentFilled: colorPixelCount / totalPixelCount,
    }

    shapes.push(shape)
  }

  return shapes
}
