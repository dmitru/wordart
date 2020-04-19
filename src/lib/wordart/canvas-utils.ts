import { noop } from 'lodash'
import { Rect } from 'lib/wordart/geometry'

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

export const loadImageUrlToCanvasCtx = async (
  url: string,
  width?: number,
  height?: number,
  padding = 0,
  onProgress: ProgressCallback = noop
): Promise<CanvasRenderingContext2D> => {
  const img = await fetchImage(url, onProgress)
  const ctx = createCanvasCtx({
    w: width || img.width,
    h: height || img.height,
  })
  ctx.drawImage(
    img,
    padding,
    padding,
    ctx.canvas.width - padding,
    ctx.canvas.height - padding
  )
  return ctx
}
