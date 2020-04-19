import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import styled from 'styled-components'

import 'lib/wordart/console-extensions'
import { Rect } from 'lib/wordart/geometry'
import { loadImageUrlToCanvasCtx } from 'lib/wordart/canvas-utils'
import {
  renderSceneDebug,
  SceneGenerator,
  ShapeConfig,
} from 'lib/wordart/generator'
import { loadFont } from 'lib/wordart/fonts'

const BG_SHAPE = '/images/cat.png'
// const BG_SHAPE = '/images/number_six.png'
// const BG_SHAPE = '/images/darth_vader.jpg'
// const BG_SHAPE = '/images/beatles.jpg'

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

const scratch = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')!
  let sceneGen: SceneGenerator

  const onKeyDown = async (e: KeyboardEvent) => {
    const key = e.key

    if (key === 'g') {
      const fonts = await Promise.all(
        FONT_NAMES.map((fontName) => loadFont(`/fonts/${fontName}`))
      )

      const bgImageCtx = await loadImageUrlToCanvasCtx(BG_SHAPE, 800, 800)
      console.screenshot(bgImageCtx.canvas)

      const viewBoxSize = 300
      const viewBox: Rect = { x: 0, y: 0, w: viewBoxSize, h: viewBoxSize }
      if (!sceneGen) {
        sceneGen = new SceneGenerator({ viewBox, bgImgSize: viewBoxSize })
      } else {
        sceneGen.clearTags()
      }

      const shapeConfig1: ShapeConfig = {
        font: fonts[1],
        scale: 0.7,
        color: '#0003',
        angles: [-15],
        words: ['good', 'light'].map((text) => ({ text })),
      }
      const shapeConfig2: ShapeConfig = {
        font: fonts[1],
        // color: '#000a',
        scale: 0.4,
        angles: [15],
        words: ['evil', 'dark'].map((text) => ({ text })),
      }
      const shapeConfig3: ShapeConfig = {
        font: fonts[1],
        scale: 0.5,
        angles: [-60],
        words: ['good', 'light'].map((text) => ({ text })),
      }
      const shapeConfig4: ShapeConfig = {
        font: fonts[1],
        scale: 0.6,
        angles: [60],
        words: ['good', 'light'].map((text) => ({ text })),
      }
      const shapeConfig5: ShapeConfig = {
        font: fonts[1],
        scale: 0.5,
        angles: [-25],
        words: ['good', 'light'].map((text) => ({ text })),
      }

      const shapeConfigs: ShapeConfig[] = [
        shapeConfig1,
        shapeConfig2,
        shapeConfig3,
        shapeConfig4,
        shapeConfig5,
      ]

      let t1 = -1
      const { start } = sceneGen.generate({
        bgImageCtx,
        debug: {
          ctx,
          logWordPlacementImg: false,
        },
        shapeConfigs,
        progressCallback: (percent) => {
          if (t1 < 0) {
            t1 = performance.now()
          }
          console.log('Completion: ', percent.toFixed(2))
        },
        words: WORDS.map((text) => ({ text })),
      })

      const result = await start()

      console.log(sceneGen)

      const t2 = performance.now()
      console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      console.log('Result: ', result)
      // const renderer = new FabricRenderer(sceneGen, canvas.id)
      renderSceneDebug(sceneGen, ctx)
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
      <Canvas width={1200} height={1200} ref={canvasRef} id="scene" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default ImageToShapesScratch
