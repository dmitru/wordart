import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import styled from 'styled-components'
import * as opentype from 'opentype.js'
import 'lib/wordart/console-extensions'
import { Rect } from 'lib/wordart/geometry'
import { loadFont } from 'lib/wordart/fonts'
import { sample } from 'lodash'
import { Tag, SceneGenJs, renderSceneDebug } from 'lib/wordart/scene-gen-js'
import {
  loadImageUrlToCanvasCtx,
  canvasToDataUri,
} from 'lib/wordart/canvas-utils'
import { fabric } from 'fabric'
import { toSVG } from 'transformation-matrix'
import { ShapeConfig, SceneGen } from 'lib/wordart/scene-gen'
import { SceneGenWasm, renderSceneWasmDebug } from 'lib/wordart/scene-gen-wasm'

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

let ENABLE_INTERACTIVITY = false

export class FabricRenderer {
  constructor(sceneGen: SceneGenJs, canvasId: string) {
    type Mode = 'edit' | 'view'
    const mode: Mode = 'view' as Mode

    const c = new fabric.Canvas(canvasId, {
      preserveObjectStacking: true,
      imageSmoothingEnabled: false,
      enableRetinaScaling: false,
    })

    const scaleX = c.getWidth() / sceneGen.params.viewBox.w
    const scaleY = c.getHeight() / sceneGen.params.viewBox.h

    for (let tag of sceneGen.tags) {
      let symbolPaths: fabric.Path[] = []
      let currentOffset = 0

      for (let [index, symbol] of tag.word.symbols.entries()) {
        const symbolPath = new fabric.Path(
          symbol.glyph.getPath(0, 0, symbol.fontSize).toPathData(3)
        )
        symbolPath.left = currentOffset

        symbolPath.fill = tag.fillStyle
        symbolPaths.push(symbolPath)

        currentOffset += tag.word.symbolOffsets[index]
      }

      const wordPaths = new fabric.Group(symbolPaths)

      const bg = new fabric.Rect({
        left: -wordPaths.getBoundingRect().width / 2,
        top: -wordPaths.getBoundingRect().height / 2,
        width: wordPaths.getBoundingRect().width,
        height: wordPaths.getBoundingRect().height,
        fill: '#0000',
      })
      wordPaths.add(bg)
      bg.sendToBack()

      wordPaths.originX = 'left'
      wordPaths.originY = 'bottom'

      wordPaths.left = tag.left * scaleX
      wordPaths.top = tag.top * scaleY

      wordPaths.angle = (180 / Math.PI) * tag.angle
      wordPaths.scale(tag.scale * scaleX)

      wordPaths.onSelect = () => {
        if (mode === 'edit') {
          bg.set({ fill: '#fff5' })
          c.renderAll()
          wordPaths.bringToFront()
          return false
        }
        return true
      }

      wordPaths.onDeselect = () => {
        bg.set({ fill: '#fff0' })
        c.renderAll()
        wordPaths.bringToFront()
        return false
      }

      c.add(wordPaths)
    }

    if (sceneGen.bgShape) {
      fabric.Image.fromURL(
        canvasToDataUri(sceneGen.bgShape.ctx.canvas),
        (img) => {
          img.set({
            width: c.getWidth(),
            height: c.getHeight(),
            left: 0,
            top: 0,
            opacity: 0.2,
            selectable: false,
            hasControls: false,
            evented: false,
          })

          c.add(img)
          img.sendToBack()

          c.renderAll()
        }
      )
    } else {
      c.renderAll()
    }

    c.on('mouse:move', (evt) => {
      console.log('mouse:move', evt)
      // TODO: when hovered, animate
      // when out, remove animation
    })
  }
}

export const scratch = (
  canvas: HTMLCanvasElement,
  canvas2: HTMLCanvasElement
) => {
  // const tagBg = scene.addTag(scene.words[0], 300, 100, 2, Math.PI / 2)
  let sceneGen: SceneGenWasm | null = null
  let tag: Tag | null = null

  const ctx = canvas.getContext('2d')!
  const ctx2 = canvas2.getContext('2d')!

  const onKeyDown = async (e: KeyboardEvent) => {
    const key = e.key

    const BG_IMG_SIZE = 400
    const bgImageCtx = await loadImageUrlToCanvasCtx(
      BG_SHAPE,
      BG_IMG_SIZE,
      BG_IMG_SIZE
    )
    // console.screenshot(bgImageCtx.canvas)

    if (key === 'g') {
      const fonts = await Promise.all(
        FONT_NAMES.map((fontName) => loadFont(`/fonts/${fontName}`))
      )

      const shapeConfig1: ShapeConfig = {
        font: fonts[1],
        scale: 0.7,
        color: '#0003',
        angles: [-15],
        // words: ['good', 'light'].map((text) => ({ text })),
      }
      const shapeConfig2: ShapeConfig = {
        font: fonts[1],
        // color: '#000a',
        scale: 0.4,
        angles: [15],
        // words: ['evil', 'dark'].map((text) => ({ text })),
      }
      const shapeConfig3: ShapeConfig = {
        font: fonts[1],
        scale: 0.5,
        angles: [-60],
      }
      const shapeConfig4: ShapeConfig = {
        font: fonts[1],
        scale: 0.6,
        angles: [60],
      }
      const shapeConfig5: ShapeConfig = {
        font: fonts[1],
        scale: 0.5,
        angles: [-25],
      }
      const shapeConfigs: ShapeConfig[] = [
        shapeConfig1,
        shapeConfig2,
        shapeConfig3,
        shapeConfig4,
        shapeConfig5,
      ]

      // @ts-ignore
      window['fonts'] = fonts

      const viewBox: Rect = { x: 0, y: 0, w: BG_IMG_SIZE, h: BG_IMG_SIZE }
      if (!sceneGen) {
        sceneGen = new SceneGenWasm({ viewBox, bgImgSize: BG_IMG_SIZE })
      } else {
        sceneGen.clearTags()
      }

      let t1 = -1
      t1 = performance.now()
      const { start, cancel } = sceneGen.generate({
        bgImageCtx,
        shapeConfigs,
        // debug: {
        //   ctx,
        //   logWordPlacementImg: false,
        // },
        progressCallback: (percent) => {
          if (t1 < 0) {
            t1 = performance.now()
          }
          console.log('Completion: ', percent.toFixed(2))
        },
        words: WORDS.map((text) => ({ text })),
      })
      const result = await start()
      const t2 = performance.now()
      console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      console.log('Result: ', result)
      // const renderer = new FabricRenderer(sceneGen, canvas.id)
      renderSceneWasmDebug(sceneGen, ctx2)

      // if (ENABLE_INTERACTIVITY) {
      //   tag = new Tag(0, sample(sceneGen.words)!, 0, 0, 1)
      //   let collides = false
      //   canvas.addEventListener('mousemove', (e) => {
      //     const x = e.offsetX
      //     const y = e.offsetY

      //     if (tag && sceneGen?.bgShape) {
      //       tag.left = x
      //       tag.top = y

      //       collides = sceneGen.checkCollision(tag, sceneGen.bgShape.shapes[0])
      //       // console.log('tag = ', tag, collides)

      //       tag.fillStyle = collides ? 'green' : 'black'
      //     }
      //   })
      // }

      // @ts-ignore
      window['scene'] = sceneGen
      console.log('scene', sceneGen)
    }
    if (key === 'w') {
      if (tag) {
        tag.scale = tag._scale + 0.1
      }
    } else if (key === 's') {
      if (tag) {
        tag.scale = tag._scale - 0.1
      }
    } else if (key === 'd') {
      if (tag) {
        tag.angle = tag._angle + 0.03
      }
    } else if (key === 'a') {
      if (tag) {
        tag.angle = tag._angle - 0.03
      }
    }
  }
  document.addEventListener('keydown', onKeyDown)

  if (ENABLE_INTERACTIVITY) {
    let raf = -1

    const render = () => {
      // @ts-ignore
      // @ts-ignore
      if (tag && window['scene']) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        // @ts-ignore
        renderSceneDebug(window['scene'], ctx)
        tag.drawHBounds(ctx)
        tag.draw(ctx)
      }
      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
  }

  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

const HomePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef2 = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && canvasRef2.current) {
      return scratch(canvasRef.current, canvasRef2.current)
    }
  }, [canvasRef.current, canvasRef2.current])

  return (
    <Layout>
      <Canvas width={1200} height={1200} ref={canvasRef} id="scene" />
      <Canvas width={1200} height={1200} ref={canvasRef2} id="scene2" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default HomePage
