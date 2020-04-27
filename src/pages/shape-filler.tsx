import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import styled from 'styled-components'

import 'lib/wordart/console-extensions'
import {
  loadImageUrlToCanvasCtx,
  Dimensions,
  clearCanvas,
  createCanvasCtxCopy,
  createCanvasCtx,
} from 'lib/wordart/canvas-utils'
import { getWasmModule, WasmModule } from 'lib/wordart/wasm/wasm-module'
import {
  ImageProcessorWasm,
  ShapeWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import {
  drawHBoundsWasm,
  randomPointInsideHboundsSerialized,
} from 'lib/wordart/wasm/hbounds'
import { CollisionDetectorWasm } from 'lib/wordart/wasm/collision-detector-wasm'
import * as tm from 'transformation-matrix'
import { multiply } from 'lib/wordart/geometry'

const IMAGES = [
  '/images/Meiersdorf manor.jpg',
  '/images/basketball.png',
  '/images/number_six.png',
  '/images/darth_vader.jpg',
  '/images/beatles.jpg',
]

let shapes: ShapeWasm[] | null = null

const scratch = (canvas: HTMLCanvasElement) => {
  let bgImageCtx: null | CanvasRenderingContext2D = null

  const onKeyDown = async (e: KeyboardEvent) => {
    const wasm = await getWasmModule()
    const imageProcessor = new ImageProcessorWasm(wasm)

    const ctx = canvas.getContext('2d')!

    const key = e.key
    if (['1', '2', '3', '4', '5'].includes(key) && !e.ctrlKey) {
      const imageIndex = parseInt(key) - 1
      const imageUrl = IMAGES[imageIndex]
      const imageSize: Dimensions = {
        w: canvas.width,
        h: canvas.height,
      }

      bgImageCtx = await loadImageUrlToCanvasCtx(
        imageUrl,
        imageSize.w,
        imageSize.h,
        150
      )
      console.screenshot(bgImageCtx.canvas)

      const t1 = performance.now()
      shapes = imageProcessor.findShapesByColor({
        bounds: {
          x: 0,
          y: 0,
          w: bgImageCtx.canvas.width,
          h: bgImageCtx.canvas.height,
        },
        canvas: bgImageCtx.canvas,
        debug: false,
      })

      const t2 = performance.now()
      console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      console.log('Result: ', shapes)

      // Visualize result
      clearCanvas(ctx)
      ctx.drawImage(bgImageCtx.canvas, 0, 0)

      for (const shape of shapes) {
        const c = createCanvasCtxCopy(ctx)
        drawHBoundsWasm(c, shape.hBounds)
        console.screenshot(c.canvas)
      }
    } else if (['1', '2', '3', '4', '5'].includes(key) && e.ctrlKey) {
      if (!shapes) {
        return
      }

      const shapeIndex = parseInt(key) - 1
      const shape = shapes[shapeIndex]
      if (!shape) {
        return
      }

      fillShapeWithShapes(wasm, bgImageCtx!, ctx, shape)
    }
  }
  document.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

const fillShapeWithShapes = (
  wasm: WasmModule,
  bgImageCtx: CanvasRenderingContext2D,
  ctx: CanvasRenderingContext2D,
  shape: ShapeWasm
) => {
  const circleR = 30
  const { imgData, ctx: imgCtx } = createCircleImgData(circleR, 0)
  const hbounds = wasm.create_hbounds(
    new Uint32Array(imgData.data.buffer),
    imgData.width,
    imgData.height,
    false
  )

  // const { imgData, imgCtx } = {
  //   imgCtx: bgImageCtx,
  //   imgData: bgImageCtx.getImageData(
  //     0,
  //     0,
  //     bgImageCtx.canvas.width,
  //     bgImageCtx.canvas.height
  //   ),
  // }
  // const hbounds = shape.hBounds

  // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const collisionDetector = new CollisionDetectorWasm(
    wasm,
    {
      x: 0,
      y: 0,
      w: ctx.canvas.width,
      h: ctx.canvas.height,
    },
    shape.hBoundsInverted
  )

  let addedHbounds: any[] = []
  let addedImgCtxs: CanvasRenderingContext2D[] = []

  const shapeHBoundsJs = shape.hBounds.get_js()
  console.log(hbounds.get_js())

  const t1 = performance.now()

  let scaleFactor = 1
  const initialScale = 2 * scaleFactor
  // const initialScale = 0.002
  const finalScale = 0.002 * scaleFactor
  // const finalScale = 0.05
  const scaleStepFactor = 0.2
  const maxScaleStep = 0.005
  let timeout = 1500
  let maxTimeout = 3000
  let timeoutStep = 300
  let maxCount = 10 * shape.percentArea

  let failedBatchesCount = 0
  const maxFailedBatchesCount = 3

  let scale = initialScale

  let t0 = performance.now()
  let countScale = 0
  let count = 0

  while (scale > finalScale && count < maxCount) {
    // console.log('scale: ', scale)
    const batchSize = 30
    let success = false

    for (let i = 0; i < batchSize; ++i) {
      const rScaled = Math.max(3, circleR * scale)
      const p = randomPointInsideHboundsSerialized(shapeHBoundsJs)
      if (!p) {
        continue
      }

      const cx = p.x
      const cy = p.y

      // ctx.fillStyle = 'red'
      // ctx.fillRect(cx, cy, 2, 2)

      const x = cx - rScaled
      const y = cy - rScaled

      const transform: tm.Matrix = multiply(tm.translate(x, y), tm.scale(scale))
      const transformWasm = new wasm.Matrix()
      transformWasm.set_mut(
        transform.a,
        transform.b,
        transform.c,
        transform.d,
        transform.e,
        transform.f
      )

      const hasPlaced = collisionDetector.addItem(hbounds, transformWasm)
      if (hasPlaced) {
        success = true
        addedImgCtxs.push(imgCtx)
        addedHbounds.push({
          ...hbounds,
          transform,
        })
        countScale++
        count++
      }
    }

    let t1 = performance.now()

    if (!success) {
      failedBatchesCount++
    }

    if (
      failedBatchesCount >= maxFailedBatchesCount ||
      t1 - t0 > timeout ||
      count > maxCount
    ) {
      scale -= Math.min(maxScaleStep, scaleStepFactor * scale)
      console.log('placed ', scale, countScale)
      countScale = 0
      failedBatchesCount = 0
    }
    timeout = Math.min(maxTimeout, timeout + timeoutStep)

    t0 = performance.now()
  }

  const t2 = performance.now()
  console.log('done', count, ((t2 - t1) / 1000).toFixed(3))

  const render = () => {
    console.log('render)')
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    drawHBoundsWasm(ctx, shape.hBounds)
    ctx.fillStyle = '#000'
    ctx.filter = 'brightness(0.8)'
    ctx.save()
    for (let [index, item] of addedHbounds.entries()) {
      ctx.resetTransform()
      ctx.setTransform(item.transform)
      // ctx.globalCompositeOperation = 'destination-out'
      const imageCtx = addedImgCtxs[index]
      ctx.drawImage(imageCtx.canvas, 0, 0)
      // drawHBoundsWasm(ctx, hbounds)
      // ctx.fill()
    }
    ctx.restore()
  }

  render()

  const ENABLE_INTERACTIVITY = true

  if (ENABLE_INTERACTIVITY) {
    let collides = false
    let scale = 1
    // console.log('FISH: ', hbounds.get_js())

    ctx.canvas.addEventListener('mousemove', (e) => {
      const x = e.offsetX
      const y = e.offsetY

      const transform: tm.Matrix = multiply(tm.translate(x, y), tm.scale(scale))
      const transformWasm = new wasm.Matrix()
      transformWasm.set_mut(
        transform.a,
        transform.b,
        transform.c,
        transform.d,
        transform.e,
        transform.f
      )

      collides = shape.hBoundsInverted.collides_transformed(
        hbounds,
        transformWasm
      )

      render()

      ctx.save()
      ctx.setTransform(transform)
      ctx.globalAlpha = collides ? 1 : 0.5
      ctx.drawImage(imgCtx.canvas, 0, 0)
      drawHBoundsWasm(ctx, hbounds)
      ctx.restore()
    })
  }

  return { collisionDetector, render }
}

const createTextImgData = (r = 10, pad = 0, angle = 0) => {
  const w = r * 2 + 2 * pad
  const h = r * 2 + 2 * pad
  const ctx = createCanvasCtx({ w, h })
  // ctx.fillStyle = 'white'
  // ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#0003'
  ctx.strokeStyle = '#0003'
  ctx.beginPath()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const lineWidth = r / 3
  // ctx.fillRect(0, 0, w, h)
  ctx.font = `bold ${h / 2}px sans-serif`
  ctx.fillText('CAT', 0, h, w)
  ctx.fill()
  // ctx.lineWidth = lineWidth
  // ctx.stroke()

  // console.screenshot(ctx.canvas)
  return { imgData: ctx.getImageData(0, 0, w, h), ctx }
}

const createCircleImgData = (r = 10, pad = 0, angle = 0) => {
  const w = r * 2 + 2 * pad
  const h = r * 2 + 2 * pad
  const ctx = createCanvasCtx({ w, h })
  // ctx.fillStyle = 'white'
  // ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#0003'
  ctx.strokeStyle = '#0003'
  ctx.beginPath()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const lineWidth = r / 3
  // ctx.fillRect(0, 0, w, h)
  ctx.arc(r + pad, r + pad, r - lineWidth, 0, 2 * Math.PI)
  // ctx.fill()
  ctx.lineWidth = lineWidth
  ctx.stroke()

  // console.screenshot(ctx.canvas)
  return { imgData: ctx.getImageData(0, 0, w, h), ctx }
}

const createLineImgData = (r = 10, pad = 0, angle = 0) => {
  const w = r * 2 + 2 * pad
  const h = r * 2 + 2 * pad
  const ctx = createCanvasCtx({ w, h })
  // ctx.fillStyle = 'white'
  // ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#000'
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 15

  const p = r / 1.5
  ctx.beginPath()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.moveTo(w / 2, p)
  ctx.lineTo(w / 2, h - p)
  ctx.closePath()

  ctx.stroke()
  // console.screenshot(ctx.canvas)
  return { imgData: ctx.getImageData(0, 0, w, h), ctx }
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
      <Canvas width={600} height={600} ref={canvasRef} id="scene" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default ImageToShapesScratch
