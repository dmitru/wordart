import { EditorPageStore } from 'components/pages/EditorPage/editor-page-store'
import {
  loadImageUrlToCanvasCtx,
  clearCanvas,
  createCanvasCtx,
} from 'lib/wordart/canvas-utils'
import { fabric } from 'fabric'
import { CollisionDetectorWasm } from 'lib/wordart/wasm/collision-detector-wasm'
import { consoleLoggers } from 'utils/console-logger'
import { getWasmModule, HBoundsWasm } from 'lib/wordart/wasm/wasm-module'
import { Rect, multiply } from 'lib/wordart/geometry'
import {
  ImageProcessorWasm,
  ShapeWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import {
  randomPointInsideHboundsSerialized,
  drawHBoundsWasm,
} from 'lib/wordart/wasm/hbounds'
import * as tm from 'transformation-matrix'
import { sleep } from 'utils/async'

export class Generator {
  logger = consoleLoggers.generator

  constructor() {}

  items: Item[] = []

  clear = () => {
    this.items = []
  }

  generate = async (task: GenerateTask): Promise<GenerateResult> => {
    this.logger.debug('Generator: generate', task)
    const tStarted = performance.now()

    const wasm = await getWasmModule()
    const shape = task.shape
    const collisionDetector = new CollisionDetectorWasm(
      wasm,
      task.bounds,
      shape.hBoundsInverted
    )

    const circleR = 15

    const { imgData, ctx: imgCtx } = createCircleImgData(
      circleR,
      task.itemColor
    )
    const hbounds = wasm.create_hbounds(
      new Uint32Array(imgData.data.buffer),
      imgData.width,
      imgData.height,
      false
    )

    let currentItemId = 1
    let addedItems: Item[] = []
    let addedHbounds: any[] = []
    let addedImgCtxs: CanvasRenderingContext2D[] = []

    const shapeHBoundsJs = shape.hBounds.get_js()

    const ctx = createCanvasCtx({
      w: shapeHBoundsJs.bounds.w * (shapeHBoundsJs.transform?.a || 1),
      h: shapeHBoundsJs.bounds.h * (shapeHBoundsJs.transform?.d || 1),
    })

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
    let maxCount = 800 * shape.percentArea

    let failedBatchesCount = 0
    const maxFailedBatchesCount = 2

    let scale = initialScale

    const tPrepEnd = performance.now()
    this.logger.debug(`Generator: ${(tPrepEnd - tStarted).toFixed(3)}ms`)
    let countScale = 0
    let count = 0

    let tBatchStart = performance.now()
    while (scale > finalScale && count < maxCount) {
      // console.log('scale: ', scale)
      const batchSize = 15
      let success = false

      for (let i = 0; i < batchSize; ++i) {
        const rScaled = Math.max(3, circleR * scale)
        const p = randomPointInsideHboundsSerialized(shapeHBoundsJs)
        if (!p) {
          continue
        }

        const cx = p.x
        const cy = p.y

        ctx.fillStyle = 'red'
        ctx.fillRect(cx, cy, 2, 2)

        const x = cx - rScaled
        const y = cy - rScaled

        const transform: tm.Matrix = multiply(
          tm.translate(x, y),
          tm.scale(scale)
        )
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

          addedItems.push({
            id: currentItemId++,
            ctx: imgCtx,
            transform,
          })

          countScale++
          count++
        }
      }

      const tBatchEnd = performance.now()

      if (!success) {
        failedBatchesCount++
      }

      if (
        failedBatchesCount >= maxFailedBatchesCount ||
        tBatchEnd - tBatchStart > timeout ||
        count > maxCount
      ) {
        scale -= Math.min(maxScaleStep, scaleStepFactor * scale)
        // this.logger.debug('placed ', scale, countScale)
        countScale = 0
        failedBatchesCount = 0
      }
      timeout = Math.min(maxTimeout, timeout + timeoutStep)

      tBatchStart = performance.now()
    }

    console.screenshot(ctx.canvas)

    const tEnded = performance.now()
    this.logger.debug(
      `Generator: placed ${count} in ${(tEnded - tStarted).toFixed(3)}ms`
    )

    return {
      items: addedItems,
    }
  }
}

export type GenerateTask = {
  bounds: Rect
  shape: ShapeWasm
  itemColor: string
}

export type GenerateResult = {
  items: Item[]
}

export type Item = {
  id: ItemId
  ctx: CanvasRenderingContext2D
  transform: tm.Matrix
}

export type ItemId = number

const createCircleImgData = (r = 10, color = '#0005') => {
  const pad = 0
  const w = r * 2 + 2 * pad
  const h = r * 2 + 2 * pad
  const ctx = createCanvasCtx({ w, h })
  // ctx.fillStyle = 'white'
  // ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = color
  ctx.strokeStyle = color
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
