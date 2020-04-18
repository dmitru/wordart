import * as opentype from 'opentype.js'
import 'lib/wordart/console-extensions'
import { Rect } from 'lib/wordart/geometry'
import { loadFont } from 'lib/wordart/fonts'
import { sample } from 'lodash'
import { Tag, SceneGenerator, renderSceneDebug } from 'lib/wordart/generator'
import { loadImageUrlToCanvasCtx } from 'lib/wordart/canvas-utils'

const fontName = 'mountains-of-christmas_bold.ttf'
const fontName2 = 'mail-ray-stuff.ttf'
const fontName3 = 'Verona-Xlight.ttf'

// const BG_SHAPE = '/images/cat.png'
// const BG_SHAPE = '/images/number_six.png'
// const BG_SHAPE = '/images/darth_vader.jpg'
const BG_SHAPE = '/images/beatles.jpg'

let font: opentype.Font
if (typeof window !== 'undefined') {
  loadFont(`/fonts/${fontName3}`).then((f) => {
    font = f
  })
}

const ENABLE_INTERACTIVITY = false

export const scratch = (canvas: HTMLCanvasElement) => {
  // const tagBg = scene.addTag(scene.words[0], 300, 100, 2, Math.PI / 2)
  let sceneGen: SceneGenerator | null = null
  let tag: Tag | null = null

  const ctx = canvas.getContext('2d')!

  const onKeyDown = async (e: KeyboardEvent) => {
    const key = e.key

    const bgImageCtx = await loadImageUrlToCanvasCtx(BG_SHAPE, 400, 400)
    // console.screenshot(bgImageCtx.canvas)

    if (key === 'g') {
      console.log('font = ', font)
      // @ts-ignore
      window['font'] = font

      const viewBox: Rect = { x: 0, y: 0, w: 400, h: 400 }
      if (!sceneGen) {
        sceneGen = new SceneGenerator({ font, viewBox })
      } else {
        sceneGen.clearTags()
      }

      const t1 = performance.now()
      const { start, cancel } = sceneGen.generate({
        bgImageCtx,
        // debug: {
        //   ctx,
        //   logWordPlacementImg: false,
        // },
        font,
        viewBox: { x: 0, y: 0, w: 200, h: 200 },
        progressCallback: (percent) => {
          console.log('Completion: ', percent.toFixed(2))
        },
        words: ['art', 'word', 'cloud'].map((text) => ({ text })),
      })
      const result = await start()
      const t2 = performance.now()
      console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      console.log('Result: ', result)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      //
      renderSceneDebug(sceneGen, ctx)

      if (ENABLE_INTERACTIVITY) {
        tag = new Tag(0, sample(sceneGen.words)!, 0, 0, 1)
        let collides = false
        canvas.addEventListener('mousemove', (e) => {
          const x = e.offsetX
          const y = e.offsetY

          if (tag && sceneGen) {
            tag.left = x
            tag.top = y

            collides = sceneGen.checkCollision(tag)
            // console.log('tag = ', tag, collides)

            tag.fillStyle = collides ? 'green' : 'black'
          }
        })
      }

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
