import React, { useEffect, useRef, useState } from 'react'
import { Layout } from 'components/layout'
import styled from '@emotion/styled'

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
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import * as tm from 'transformation-matrix'

const IMAGES = [
  '/images/cat.png',
  '/images/number_six.png',
  '/images/darth_vader.jpg',
  '/images/beatles.jpg',
]

const state = observable({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
})

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

      // Apply transform
      const shape = result[0]
      const t = tm.compose(
        tm.translate(state.offsetX * imageSize.w, state.offsetY * imageSize.h),
        tm.scale(state.scale)
      )
      shape.hBounds.set_transform(t.a, t.b, t.c, t.d, t.e, t.f)

      // Visualize result
      const ctx = canvas.getContext('2d')!
      clearCanvas(ctx)
      ctx.drawImage(bgImageCtx.canvas, 0, 0)

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

const ImageToShapesScratch = observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      return scratch(canvasRef.current)
    }
  }, [canvasRef.current])

  return (
    <Layout>
      Hit 1, 2, 3 or 4
      <div>
        <input
          type="range"
          style={{ marginRight: '10px' }}
          min={0.2}
          max={2}
          step={0.001}
          value={state.scale}
          onChange={(e) => {
            state.scale = parseFloat(e.target.value)
          }}
        />
        <input
          type="range"
          style={{ marginRight: '10px' }}
          min={-1}
          max={1}
          step={0.001}
          value={state.offsetX}
          onChange={(e) => {
            state.offsetX = parseFloat(e.target.value)
          }}
        />
        <input
          type="range"
          style={{ marginRight: '10px' }}
          min={-1}
          max={1}
          step={0.001}
          value={state.offsetY}
          onChange={(e) => {
            state.offsetY = parseFloat(e.target.value)
          }}
        />
      </div>
      <Canvas width={800} height={800} ref={canvasRef} id="scene" />
    </Layout>
  )
})

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default ImageToShapesScratch
