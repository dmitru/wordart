import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import styled from 'styled-components'

import 'lib/wordart/console-extensions'
import {
  loadImageUrlToCanvasCtx,
  Dimensions,
  clearCanvas,
  createCanvasCtxCopy,
} from 'lib/wordart/canvas-utils'
import { getWasmModule } from 'lib/wordart/wasm/wasm-module'
import { ImageProcessorWasm } from 'lib/wordart/wasm/image-processor-wasm'
import { drawHBoundsWasm } from 'lib/wordart/wasm/hbounds'

const IMAGES = [
  '/images/cat.png',
  '/images/number_six.png',
  '/images/darth_vader.jpg',
  '/images/beatles.jpg',
]

const scratch = (canvas: HTMLCanvasElement) => {
  const onKeyDown = async (e: KeyboardEvent) => {
    const wasm = await getWasmModule()
    const imageProcessor = new ImageProcessorWasm(wasm)

    const key = e.key
    if (['1', '2', '3', '4'].includes(key) && !e.shiftKey) {
      const imageIndex = parseInt(key) - 1
      const imageUrl = IMAGES[imageIndex]
      const imageSize: Dimensions = {
        w: canvas.width,
        h: canvas.height,
      }

      const bgImageCtx = await loadImageUrlToCanvasCtx(
        imageUrl,
        imageSize.w,
        imageSize.h
      )
      console.screenshot(bgImageCtx.canvas)

      const t1 = performance.now()
      const result = imageProcessor.findShapesByColor({
        canvas: bgImageCtx.canvas,
        debug: false,
        bounds: { x: 0, y: 0, w: canvas.width, h: canvas.height },
      })

      const t2 = performance.now()
      console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      console.log('Result: ', result)

      // Visualize result
      const ctx = canvas.getContext('2d')!
      clearCanvas(ctx)
      ctx.drawImage(bgImageCtx.canvas, 0, 0)

      const shape = result[0]
      drawHBoundsWasm(ctx, shape.hBounds)

      for (const shape of result) {
        const c = createCanvasCtxCopy(ctx)
        drawHBoundsWasm(c, shape.hBounds)
        console.screenshot(c.canvas)
      }
    }
  }
  document.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

const ImageToShapesScratch = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      return scratch(canvasRef.current)
    }
  }, [canvasRef.current])

  return (
    <Layout>
      Hit 1, 2, 3 or 4
      <Canvas width={800} height={800} ref={canvasRef} id="scene" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default ImageToShapesScratch
