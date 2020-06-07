import { noop } from 'lodash'
import { Rect } from 'lib/wordart/geometry'
// @ts-ignore
import jsfeat from 'jsfeat'
import chroma from 'chroma-js'
import { RasterProcessingConf } from 'components/Editor/shape-config'

export type Dimensions = { w: number; h: number }

export type CanvasCtx = CanvasRenderingContext2D

export const clearCanvas = (ctx: CanvasRenderingContext2D, rect?: Rect) => {
  if (rect) {
    ctx.clearRect(rect.x, rect.y, rect.w, rect.h)
  } else {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }
}

export const createCanvas = (
  size: Dimensions,
  elemId?: string
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas') as HTMLCanvasElement

  if (elemId != null) {
    canvas.setAttribute('id', `${elemId}`)
  }
  canvas.width = size.w
  canvas.height = size.h

  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = `${size.w}px`
  canvas.style.height = `${size.h}px`

  return canvas
}

export const createCanvasCtxCopy = (ctx: CanvasCtx): CanvasCtx =>
  createCanvasCtx({ w: ctx.canvas.width, h: ctx.canvas.height })

export const createCanvasCtx = (
  size: Dimensions,
  elemId?: string
): CanvasCtx => {
  const canvas = createCanvas(size, elemId)
  const ctx = canvas.getContext('2d') as CanvasCtx
  return ctx
}

export const createOffscreenCanvas = (
  size: Dimensions
): HTMLCanvasElement | OffscreenCanvas => {
  let canvas
  // @ts-ignore
  if (
    typeof window === 'undefined' ||
    typeof window.OffscreenCanvas !== 'undefined'
  ) {
    // @ts-ignore
    canvas = new OffscreenCanvas(size.w, size.h)
  } else {
    canvas = document.createElement('canvas')
    canvas.style.display = 'none'
  }

  canvas.width = size.w
  canvas.height = size.h

  return canvas
}

export const createOffscreenCanvasCtx = (size: Dimensions): CanvasCtx => {
  const offscreenCanvas = createOffscreenCanvas(size)
  const ctx = offscreenCanvas.getContext(
    '2d'
  ) as OffscreenCanvasRenderingContext2D
  // @ts-ignore
  return ctx
}

export const canvasToImgElement = (
  canvas: HTMLCanvasElement
): HTMLImageElement => {
  const dataUri = canvasToDataUri(canvas, { format: 'image/png', quality: 1 })
  const img = document.createElement('img')
  img.src = dataUri
  img.width = canvas.width
  img.height = canvas.height
  return img
}

export const canvasToDataUri = (
  canvas: HTMLCanvasElement,
  { format = 'image/jpeg', quality = 0.8 } = {}
): string => canvas.toDataURL(format, quality)

export type ProgressCallback = (
  percentage: number,
  loaded?: number,
  total?: number
) => void

export const fetchImage = async (
  url: string,
  onProgress: ProgressCallback = noop
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const xmlHTTP = new XMLHttpRequest()
    xmlHTTP.open('GET', url, true)
    xmlHTTP.responseType = 'arraybuffer'
    img.onload = () => {
      resolve(img)
    }
    xmlHTTP.onload = () => {
      const blob = new Blob([xmlHTTP.response])
      img.src = window.URL.createObjectURL(blob)
    }
    xmlHTTP.onprogress = (e) => {
      const { loaded = 0, total = 0 } = e
      const percentage = total > 0 ? loaded / total : 0
      onProgress(percentage, loaded, total)
    }
    xmlHTTP.onloadstart = () => {
      onProgress(0)
    }
    xmlHTTP.onerror = () => reject()
    xmlHTTP.onabort = () => reject()
    xmlHTTP.send()
  })
}

export const imageDataToCanvasCtx = (
  imgData: ImageData
): CanvasRenderingContext2D => {
  const ctx = createCanvasCtx({ w: imgData.width, h: imgData.height })
  ctx.putImageData(imgData, 0, 0)
  return ctx
}

/** Turns each non fully transparent pixel into a fully opaque pixel */
export const clampPixelOpacityUp = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let r = 0; r < imgData.height; ++r) {
    for (let c = 0; c < imgData.width; ++c) {
      if (imgData.data[(r * imgData.width + c) * 4 + 3] > 0) {
        imgData.data[(r * imgData.width + c) * 4 + 3] = 255
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

export const removeLightPixels = (
  canvas: HTMLCanvasElement,
  threshold = 0.95
) => {
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let row = 0; row < imgData.height; ++row) {
    for (let col = 0; col < imgData.width; ++col) {
      const imgDataIndex = (row * imgData.width + col) * 4
      const r = imgData.data[imgDataIndex + 0]
      const g = imgData.data[imgDataIndex + 1]
      const b = imgData.data[imgDataIndex + 2]
      const value = (r + r + g + g + g + b) / 6
      // If the pixel isn't dark enough...
      if (value >= 255 * threshold) {
        // Make that pixel transparent
        imgData.data[imgDataIndex + 0] = 255
        imgData.data[imgDataIndex + 1] = 255
        imgData.data[imgDataIndex + 2] = 255
        imgData.data[imgDataIndex + 3] = 0
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

export const clampPixelOpacityDown = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let r = 0; r < imgData.height; ++r) {
    for (let c = 0; c < imgData.width; ++c) {
      if (imgData.data[(r * imgData.width + c) * 4 + 3] < 255) {
        imgData.data[(r * imgData.width + c) * 4 + 3] = 0
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

/** Turns each fully transparent pixel into a fully opaque pixel of the given color.
 * Turns each non-transparent pixel into a fully transparent one.
 */
export const invertImageMask = (canvas: HTMLCanvasElement, color = 'black') => {
  const [red, green, blue] = chroma(color).rgb()
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let r = 0; r < imgData.height; ++r) {
    for (let c = 0; c < imgData.width; ++c) {
      // Fully transparent pixel
      const imgDataIndex = (r * imgData.width + c) * 4
      const isTransparentAtLeastABit = imgData.data[imgDataIndex + 3] < 255
      if (isTransparentAtLeastABit) {
        imgData.data[imgDataIndex + 3] = 255
        imgData.data[imgDataIndex] = red
        imgData.data[imgDataIndex + 1] = green
        imgData.data[imgDataIndex + 2] = blue
      } else {
        imgData.data[imgDataIndex + 3] = 0
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

export const shrinkShape = (canvas: HTMLCanvasElement, radius = 10) => {
  const ctx = canvas.getContext('2d')!

  const scratchCtx = createCanvasCtxCopy(ctx)
  copyCanvas(ctx, scratchCtx)

  invertImageMask(scratchCtx.canvas)

  ctx.save()
  ctx.shadowBlur = radius
  ctx.shadowColor = 'black'
  copyCanvas(scratchCtx, ctx, undefined, undefined, 'destination-out')
  ctx.restore()

  clampPixelOpacityDown(ctx.canvas)
}

export const loadImageUrlToCanvasCtx = async (
  url: string,
  params: {
    width?: number
    height?: number
    padding?: number
    getSize?: (imgSize: Dimensions) => Dimensions
    onProgress?: ProgressCallback
  }
): Promise<CanvasRenderingContext2D> => {
  const { width, height, padding = 0, getSize, onProgress = noop } = params
  const img = await fetchImage(url, onProgress)
  const imgSize: Dimensions = { w: img.width, h: img.height }
  let size = getSize ? getSize(imgSize) : imgSize
  if (width) {
    size.w = width
  }
  if (height) {
    size.h = height
  }
  const ctx = createCanvasCtx(size)
  ctx.drawImage(
    img,
    padding,
    padding,
    ctx.canvas.width - 2 * padding,
    ctx.canvas.height - 2 * padding
  )
  return ctx
}

export const processRasterImg = (
  canvas: HTMLCanvasElement,
  processing: RasterProcessingConf
) => {
  console.log('processImg', canvas.width, canvas.height)
  if (!processing.removeLightBackground && !processing.invert) {
    return
  }

  const ctx = canvas.getContext('2d')!
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const [red, green, blue] = processing.invert?.color
    ? chroma(processing.invert.color).rgb()
    : [0, 0, 0]
  const threshold = processing.removeLightBackground?.threshold || 0

  for (let row = 0; row < imgData.height; ++row) {
    for (let col = 0; col < imgData.width; ++col) {
      const imgDataIndex = (row * imgData.width + col) * 4
      if (processing.removeLightBackground) {
        // removeLightPixels
        const r = imgData.data[imgDataIndex + 0]
        const g = imgData.data[imgDataIndex + 1]
        const b = imgData.data[imgDataIndex + 2]
        const value = (r + r + g + g + g + b) / 6

        // If the pixel isn't dark enough...
        if (value >= 255 * threshold) {
          // Make that pixel transparent
          imgData.data[imgDataIndex + 0] = 255
          imgData.data[imgDataIndex + 1] = 255
          imgData.data[imgDataIndex + 2] = 255
          imgData.data[imgDataIndex + 3] = 0
        }
      }

      if (processing.invert) {
        // Fully transparent pixel

        const isTransparentAtLeastABit = imgData.data[imgDataIndex + 3] < 255
        if (isTransparentAtLeastABit) {
          imgData.data[imgDataIndex + 3] = 255
          imgData.data[imgDataIndex] = red
          imgData.data[imgDataIndex + 1] = green
          imgData.data[imgDataIndex + 2] = blue
        } else {
          imgData.data[imgDataIndex + 3] = 0
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
}

export const loadImageUrlToCanvasCtxWithMaxSize = async (
  url: string,
  maxSize = 300
): Promise<CanvasRenderingContext2D> => {
  return loadImageUrlToCanvasCtx(url, {
    getSize: (imgSize) => {
      const aspect = imgSize.w / imgSize.h
      const maxImgDim = Math.max(imgSize.w, imgSize.h)
      const maxDim = Math.min(maxSize, maxImgDim)
      if (aspect >= 1) {
        return { w: maxDim, h: maxDim / aspect }
      } else {
        return { w: maxDim * aspect, h: maxDim }
      }
    },
  })
}

export const cloneCanvas = (src: HTMLCanvasElement): HTMLCanvasElement => {
  const dest = createCanvasCtx({ w: src.width, h: src.height })
  copyCanvas(src.getContext('2d')!, dest)
  return dest.canvas
}

export const copyCanvas = (
  srcCanvas: CanvasRenderingContext2D,
  destCanvas: CanvasRenderingContext2D,
  srcRect?: Rect,
  destRect?: Rect,
  globalCompositeOperation = 'source-over'
) => {
  destCanvas.save()
  if (destCanvas.globalCompositeOperation !== globalCompositeOperation) {
    destCanvas.globalCompositeOperation = globalCompositeOperation
  }
  if (srcRect) {
    // These offsets fix a Safari's bug with drawImage() not working for negative source coordinates
    // See https://stackoverflow.com/a/35503829
    const destRectOrDefault = destRect || srcRect

    const xOffset = srcRect.x >= 0 ? 0 : -srcRect.x
    const yOffset = srcRect.y >= 0 ? 0 : -srcRect.y
    const xOffset2 =
      destRectOrDefault.x + destRectOrDefault.w > destCanvas.canvas.width
        ? destRectOrDefault.x + destRectOrDefault.w - destCanvas.canvas.width
        : 0
    const yOffset2 =
      destRectOrDefault.y + destRectOrDefault.h > destCanvas.canvas.height
        ? destRectOrDefault.y + destRectOrDefault.h - destCanvas.canvas.height
        : 0

    // Protect against zero src width/height or negative x, y coords:
    // https://stackoverflow.com/questions/19338032/canvas-indexsizeerror-index-or-size-is-negative-or-greater-than-the-allowed-a
    const srcWidth = Math.max(1, srcRect.w - xOffset - xOffset2)
    const srcHeight = Math.max(1, srcRect.h - yOffset - yOffset2)

    const destWidth = Math.max(1, destRectOrDefault.w - xOffset - xOffset2)
    const destHeight = Math.max(1, destRectOrDefault.h - yOffset - yOffset2)

    destCanvas.drawImage(
      srcCanvas.canvas,
      Math.max(0, srcRect.x + xOffset),
      Math.max(0, srcRect.y + yOffset),
      srcWidth,
      srcHeight,
      destRectOrDefault.x + xOffset,
      destRectOrDefault.y + yOffset,
      destWidth,
      destHeight
    )
  } else {
    destCanvas.drawImage(srcCanvas.canvas, 0, 0)
  }
  destCanvas.restore()
}

export const detectEdges = (
  canvas: HTMLCanvasElement,
  blurRadius = 0,
  thresholdLow: number = 20,
  thresholdUp: number = 100
): HTMLCanvasElement => {
  const w = canvas.width
  const h = canvas.height
  const t1 = performance.now()

  const ctx = canvas.getContext('2d')!

  const imgData = ctx.getImageData(0, 0, w, h)
  const dataU32 = new Uint32Array(imgData.data.buffer)

  console.screenshot(ctx.canvas)

  const jsfeatMatrix = new jsfeat.matrix_t(w, h, jsfeat.U8C1_t)
  jsfeat.imgproc.grayscale(imgData.data, w, h, jsfeatMatrix)
  jsfeat.imgproc.gaussian_blur(jsfeatMatrix, jsfeatMatrix, blurRadius << 1, 0)
  jsfeat.imgproc.canny(jsfeatMatrix, jsfeatMatrix, thresholdLow, thresholdUp)

  let i = w * h
  while (--i >= 0) {
    const pixel = jsfeatMatrix.data[i]
    if (pixel) {
      dataU32[i] = 0xff000000
    } else {
      dataU32[i] = 0
    }
  }

  const result = createCanvasCtxCopy(ctx)
  result.putImageData(imgData, 0, 0)
  console.screenshot(result.canvas)

  const t2 = performance.now()
  console.log(`removeEdges: ${(t2 - t1).toFixed(0)}ms`)

  return result.canvas
}
