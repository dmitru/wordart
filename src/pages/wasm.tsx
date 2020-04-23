import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import styled from 'styled-components'

import 'lib/wordart/console-extensions'
import { Rect } from 'lib/wordart/geometry'
import {
  loadImageUrlToCanvasCtx,
  createCanvasCtx,
} from 'lib/wordart/canvas-utils'
import {
  renderSceneDebug,
  SceneGenerator,
  ShapeConfig,
} from 'lib/wordart/generator'
import { loadFont } from 'lib/wordart/fonts'
import { computeShapes } from 'lib/wordart/image-to-shapes'
import { computeHBoundsForCanvas } from 'lib/wordart/hbounds'
import { LayoutGenJs, Matrix } from 'lib/wordart/wasm-gen/pkg/wasm_gen'

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
  fill_shapes_by_color_js(
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
  let sceneGen: SceneGenerator

  let layoutGen: LayoutGenJs | null = null
  let wasm: any = null
  import('lib/wordart/wasm-gen/pkg/wasm_gen').then((_wasm) => {
    console.log('wasm: ', _wasm)
    wasm = _wasm
    // @ts-ignore
    window['wasm'] = _wasm
    layoutGen = new _wasm.LayoutGenJs(400, 400)
    // @ts-ignore
    window['layoutGen'] = layoutGen
  })

  let addedHbounds: any[] = []

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
      const r = 30

      const createImgData = (r = 10, pad = 0) => {
        const w = r * 2 + 2 * pad
        const h = r * 2 + 2 * pad
        const ctx = createCanvasCtx({ w, h })
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = 'black'
        ctx.beginPath()
        ctx.arc(r + pad, r + pad, r, 0, 2 * Math.PI)
        ctx.fill()
        // console.screenshot(ctx.canvas)
        return ctx.getImageData(0, 0, w, h)
      }

      const createHBounds = (imageData: ImageData) =>
        wasm.create_hbounds(
          new Uint32Array(imageData.data.buffer),
          imageData.width,
          imageData.height
        )

      const imgData = createImgData(r)

      let count = 0

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#0007'
        ctx.save()
        for (let item of addedHbounds) {
          ctx.resetTransform()
          ctx.setTransform(item.transform)
          ctx.beginPath()
          ctx.arc(r, r, r, 0, 2 * Math.PI)
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

      const hbounds = createHBounds(imgData)
      const hboundsValue = hbounds.get_js()

      const t1 = performance.now()
      for (let j = 0; j < 1; ++j) {
        for (let i = 0; i < 10; ++i) {
          // console.log(imgData.width, imgData.height, imgData.data)

          const m: Matrix = new wasm.Matrix()
          const scale = rand(0.1, 0.5)
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

          const res = layoutGen.add_item(hbounds, m)
          if (res != null) {
            addedHbounds.push({
              ...hboundsValue,
              transform,
            })
            count++
          }
        }
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
      <Canvas width={300} height={300} ref={canvasRef} id="scene" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default ImageToShapesScratch
