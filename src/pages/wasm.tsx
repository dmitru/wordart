import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import styled from 'styled-components'

import 'lib/wordart/console-extensions'
import { Rect } from 'lib/wordart/geometry'
import {
  loadImageUrlToCanvasCtx,
  createCanvasCtx,
} from 'lib/wordart/canvas-utils'
import { renderSceneDebug, SceneGenJs } from 'lib/wordart/scene-gen-js'
import { loadFont } from 'lib/wordart/fonts'
import { computeShapesWasm } from 'lib/wordart/image-to-shapes'
import { computeHBoundsForCanvas } from 'lib/wordart/hbounds'
import { LayoutGenWasm, Matrix } from 'lib/wordart/wasm/wasm-gen/pkg/wasm_gen'
import { sample } from 'lodash'

// const BG_SHAPE = '/images/cat.png'
// const BG_SHAPE = '/images/number_six.png'
// const BG_SHAPE = '/images/darth_vader.jpg'
const BG_SHAPE = '/images/beatles.jpg'

const WORDS = [
  'art',
  'music',
  'song',
  'passion',
  'emotion',
  'joy',
  'creative',
  'moody',
]
const FONT_NAMES = [
  'mountains-of-christmas_bold.ttf',
  'mail-ray-stuff.ttf',
  'Verona-Xlight.ttf',
]

// You need to add the functions and properties manually since we want to use wasm as a module.
// The function definitions are generated into the `pkg` folder when you run `wasm-pack-build`
declare class Wasm {
  // get_hbounds_by_ptr(ptr: number): any
  fill_shapes_by_color(
    img_data: Uint32Array,
    w: number,
    h: number,
    threshold_part: number
  ): any[]
  create_hbounds(img_data: Uint32Array, w: number, h: number): any
}

const rand = (from: number, to: number): number => {
  const range = to - from
  return from + Math.random() * range
}

const scratch = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')!
  let sceneGen: SceneGenJs

  let layoutGen: LayoutGenWasm | null = null
  let wasm: any = null
  import('lib/wordart/wasm/wasm-gen/pkg/wasm_gen').then((_wasm) => {
    console.log('wasm: ', _wasm)
    wasm = _wasm
    // @ts-ignore
    window['wasm'] = _wasm
    layoutGen = new _wasm.LayoutGenWasm(400, 400)
    // @ts-ignore
    window['layoutGen'] = layoutGen
  })

  let addedHbounds: any[] = []
  let addedImgCtxs: CanvasRenderingContext2D[] = []

  const onKeyDown = async (e: KeyboardEvent) => {
    const key = e.key
    if (!wasm || !layoutGen) {
      return
    }

    if (key === 'g') {
      // const fonts = await Promise.all(
      //   FONT_NAMES.map((fontName) => loadFont(`/fonts/${fontName}`))
      // )
      const size = canvas.height
      const r = 250

      const createImgData1 = (r = 10, pad = 0, angle = 0) => {
        const w = r * 2 + 2 * pad
        const h = r * 2 + 2 * pad
        const ctx = createCanvasCtx({ w, h })
        // ctx.fillStyle = 'white'
        // ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#000'
        ctx.strokeStyle = '#000'
        ctx.beginPath()
        const p = 25
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(p, p)
        ctx.lineTo(w - p, p)
        ctx.lineTo(w / 2, h - p)
        ctx.closePath()
        // ctx.arc(r + pad, r + pad, r - 25, 0, 2 * Math.PI)
        ctx.lineWidth = 30

        ctx.stroke()
        // console.screenshot(ctx.canvas)
        return { imgData: ctx.getImageData(0, 0, w, h), ctx }
      }

      const createImgData2 = (r = 10, pad = 0, angle = 0) => {
        const w = r * 2 + 2 * pad
        const h = r * 2 + 2 * pad
        const ctx = createCanvasCtx({ w, h })
        // ctx.fillStyle = 'white'
        // ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#000'
        ctx.strokeStyle = '#000'
        ctx.beginPath()
        const p = 25
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.arc(r + pad, r + pad, r - 25, 0, 2 * Math.PI)
        ctx.lineWidth = 30

        ctx.stroke()
        // console.screenshot(ctx.canvas)
        return { imgData: ctx.getImageData(0, 0, w, h), ctx }
      }

      const { imgData: imgData1, ctx: imgCtx } = createImgData1(r)
      const { imgData: imgData2, ctx: imgCtx2 } = createImgData2(r)

      const createHBounds = (imageData: ImageData) =>
        wasm.create_hbounds(
          new Uint32Array(imageData.data.buffer),
          imageData.width,
          imageData.height
        )

      let count = 0

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#000'
        ctx.save()
        for (let [index, item] of addedHbounds.entries()) {
          ctx.resetTransform()
          ctx.setTransform(item.transform)
          const imageCtx = addedImgCtxs[index]
          ctx.drawImage(imageCtx.canvas, 0, 0)
          // ctx.beginPath()
          // ctx.arc(r, r, r, 0, 2 * Math.PI)
          ctx.fill()
        }
        ctx.restore()
      }

      type HboundsJS = {
        bounds: Rect
        children: HboundsJS[]
        transform?: Matrix
      }

      const renderHbounds = (hb: HboundsJS) => {
        const renderHboundsImpl = (hb: HboundsJS) => {
          if (hb.transform) {
            ctx.transform(
              hb.transform.a,
              hb.transform.b,
              hb.transform.c,
              hb.transform.d,
              hb.transform.e,
              hb.transform.f
            )
          }
          ctx.strokeStyle = 'blue'
          ctx.strokeRect(hb.bounds.x, hb.bounds.y, hb.bounds.w, hb.bounds.h)
          for (let child of hb.children) {
            renderHboundsImpl(child)
          }
        }

        ctx.save()
        ctx.resetTransform()
        renderHboundsImpl(hb)
        ctx.restore()
      }

      const hbounds1 = createHBounds(imgData1)
      const hbounds2 = createHBounds(imgData2)
      const hboundsValue1 = hbounds1.get_js()
      const hboundsValue2 = hbounds2.get_js()

      const t1 = performance.now()

      let scaleFactor = 3
      const initialScale = 0.2 * scaleFactor
      // const initialScale = 0.002
      const finalScale = 0.002 * scaleFactor
      // const finalScale = 0.05
      const scaleStepFactor = 0.01
      const maxScaleStep = 0.005
      let timeout = 1500
      let maxTimeout = 3000
      let timeoutStep = 300
      let maxCount = 1000

      let scale = initialScale

      let t0 = performance.now()
      let countScale = 0

      while (scale > finalScale && count < maxCount) {
        const batchSize = 30
        let success = false

        // console.log('scale = ', scale, r * scale)

        for (let i = 0; i < batchSize; ++i) {
          // console.log(imgData.width, imgData.height, imgData.data)

          const m: Matrix = new wasm.Matrix()
          const rScaled = r * scale
          const pad = 5
          const cx = rand(rScaled + pad, size - rScaled - pad)
          const cy = rand(rScaled + pad, size - rScaled - pad)

          const x = cx - rScaled
          const y = cy - rScaled

          m.translate_mut(x, y)
          m.scale_mut(scale, scale)
          const transform = {
            a: m.a,
            b: m.b,
            c: m.c,
            d: m.d,
            e: m.e,
            f: m.f,
          }

          const { ctx: imaggeCtx, hbounds, hboundsValue } = sample([
            { ctx: imgCtx, hbounds: hbounds1, hboundsValue: hboundsValue1 },
            { ctx: imgCtx2, hbounds: hbounds2, hboundsValue: hboundsValue2 },
          ])!
          const res = layoutGen.add_item(hbounds, m)
          if (res != null) {
            success = true
            addedImgCtxs.push(imaggeCtx)
            addedHbounds.push({
              ...hboundsValue,
              transform,
            })
            countScale++
            count++
          }
        }

        let t1 = performance.now()

        if (!success || t1 - t0 > timeout || count > maxCount) {
          scale -= Math.min(maxScaleStep, scaleStepFactor * scale)
          // console.log('placed ', countScale)
          countScale = 0
        }
        timeout = Math.min(maxTimeout, timeout + timeoutStep)

        t0 = performance.now()
      }

      const t2 = performance.now()
      console.log('done', count, ((t2 - t1) / 1000).toFixed(3))
      render()
      // for (let hb of addedHbounds) {
      //   renderHbounds(hb)
      // }

      const bgImageCtx = await loadImageUrlToCanvasCtx(BG_SHAPE, size, size)
      // console.screenshot(bgImageCtx.canvas)
      const imageData = bgImageCtx.getImageData(0, 0, size, size)

      // const t1 = performance.now()
      // const result = wasm.create_hbounds(
      //   new Uint32Array(imageData.data.buffer),
      //   imageData.width,
      //   imageData.height
      // )
      // console.log(result)
      // const result1 = result.get_js()
      // const t2 = performance.now()
      // console.log(`${t2 - t1}ms`)
      // console.log('result = ', result, result1)

      // const t1js = performance.now()
      // const result2 = computeHBoundsForCanvas({
      //   srcCanvas: bgImageCtx.canvas,
      //   imgSize: size,
      //   targetSize: { x: 0, y: 0, w: size, h: size },
      // })
      // const t2js = performance.now()
      // console.log(`${t2js - t1js}ms`)
      // console.log('result = ', result)

      // const result = wasm.fill_shapes_by_color_js(
      //   new Uint32Array(imageData.data.buffer),
      //   imageData.width,
      //   imageData.height,
      //   0.05
      // )
      // bgImageCtx.putImageData(imageData, 0, 0)
      // console.screenshot(bgImageCtx.canvas)
      // console.log(
      //   'result',
      //   result.map((res) => ({
      //     r: res.r,
      //     g: res.g,
      //     b: res.b,
      //     count: res.count,
      //   }))
      // )

      // const viewBoxSize = 400
      // const viewBox: Rect = { x: 0, y: 0, w: viewBoxSize, h: viewBoxSize }
      // if (!sceneGen) {
      //   sceneGen = new SceneGenerator({ viewBox, bgImgSize: viewBoxSize })
      // } else {
      //   sceneGen.clearTags()
      // }
      // const shapeConfig1: ShapeConfig = {
      //   font: fonts[1],
      //   scale: 0.7,
      //   color: '#0003',
      //   angles: [-15],
      //   words: ['good', 'light'].map((text) => ({ text })),
      // }
      // const shapeConfig2: ShapeConfig = {
      //   font: fonts[1],
      //   color: '#000a',
      //   scale: 0.4,
      //   angles: [15],
      //   words: ['evil', 'dark'].map((text) => ({ text })),
      // }
      // const shapeConfig3: ShapeConfig = {
      //   font: fonts[1],
      //   scale: 0.5,
      //   angles: [-60],
      // }
      // const shapeConfig4: ShapeConfig = {
      //   font: fonts[1],
      //   scale: 0.6,
      //   angles: [60],
      // }
      // const shapeConfig5: ShapeConfig = {
      //   font: fonts[1],
      //   scale: 0.5,
      //   angles: [-25],
      // }
      // const shapeConfigs: ShapeConfig[] = [
      //   shapeConfig1,
      //   shapeConfig2,
      //   shapeConfig3,
      //   shapeConfig4,
      //   shapeConfig5,
      // ]
      // let t1 = -1
      // const { start } = sceneGen.generate({
      //   bgImageCtx,
      //   debug: {
      //     ctx,
      //     logWordPlacementImg: false,
      //   },
      //   shapeConfigs,
      //   progressCallback: (percent) => {
      //     if (t1 < 0) {
      //       t1 = performance.now()
      //     }
      //     console.log('Completion: ', percent.toFixed(2))
      //   },
      //   words: WORDS.map((text) => ({ text })),
      // })
      // const result = await start()
      // console.log(sceneGen)
      // const t2 = performance.now()
      // console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      // console.log('Result: ', result)
      // // const renderer = new FabricRenderer(sceneGen, canvas.id)
      // renderSceneDebug(sceneGen, ctx)
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
      <Canvas width={1800} height={1800} ref={canvasRef} id="scene" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default ImageToShapesScratch
