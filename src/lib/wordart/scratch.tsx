import * as opentype from 'opentype.js'
import { archimedeanSpiral } from './spirals'
import 'lib/wordart/console-extensions'
import {
  Rect,
  Point,
  randomPointInsideHbounds,
  drawHBounds,
} from 'lib/wordart/geometry'
import { loadFont } from 'lib/wordart/fonts'
import { sample } from 'lodash'
import { Tag, GeneratedScene } from 'lib/wordart/generator'
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

export const scratch = (canvas: HTMLCanvasElement) => {
  // const tagBg = scene.addTag(scene.words[0], 300, 100, 2, Math.PI / 2)
  let scene: GeneratedScene | null = null
  let tag: Tag | null = null

  const ctx = canvas.getContext('2d')!

  const onKeyDown = async (e: KeyboardEvent) => {
    const key = e.key

    const bgImageCtx = await loadImageUrlToCanvasCtx(BG_SHAPE, 400, 400)
    console.screenshot(bgImageCtx.canvas)

    if (key === 'g') {
      console.log('font = ', font)
      // @ts-ignore
      window['font'] = font

      const viewBox: Rect = { x: 0, y: 0, w: canvas.width, h: canvas.height }
      const t1 = performance.now()
      scene = await generateWordArt({ ctx, font, viewBox, bgImageCtx })
      const t2 = performance.now()
      console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      renderScene(scene, ctx)

      tag = new Tag(0, sample(scene.words)!, 0, 0, 1)

      let collides = false
      // canvas.addEventListener('mousemove', (e) => {
      //   const x = e.offsetX
      //   const y = e.offsetY

      //   if (tag && scene) {
      //     tag.left = x
      //     tag.top = y

      //     collides = scene.checkCollision(tag)
      //     // console.log('tag = ', tag, collides)

      //     tag.fillStyle = collides ? 'green' : 'black'
      //   }
      // })

      // @ts-ignore
      window['scene'] = scene
      console.log('scene', scene)
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

  // let raf = -1

  // const render = () => {
  //   // @ts-ignore
  //   // @ts-ignore
  //   if (tag && window['scene']) {
  //     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  //     // @ts-ignore
  //     renderScene(window['scene'], ctx)
  //     tag.drawHBounds(ctx)
  //     tag.draw(ctx)
  //   }
  //   raf = requestAnimationFrame(render)
  // }

  // raf = requestAnimationFrame(render)

  // return () => {
  //   document.removeEventListener('keydown', onKeyDown)
  // }
}

export const generateWordArt = async (args: {
  ctx: CanvasRenderingContext2D
  font: opentype.Font
  viewBox: Rect
  oldScene?: GeneratedScene
  bgImageCtx: CanvasRenderingContext2D
}): Promise<GeneratedScene> => {
  const { font, viewBox, ctx, oldScene, bgImageCtx } = args

  const scene = new GeneratedScene(font, viewBox)
  // scene.setBgShape(bgImageCtx)

  if (oldScene) {
    scene.symbols = oldScene.symbols
    scene.words = oldScene.words
  }

  const words = [
    'word',
    'Cloud',
    'art',
    'beatles',
    'submarine',
    // 'lucy',
    // 'paul',
    'yellow',
    'music',
    // 'ringo',
    // 'universe',
    // 'love',
    // 'wind',
    // 'earth',
    // 'water',
    // 'fire',
    // 'words',
    // 'many',
    // 'emotion',
    // 'bliss',
    // 'lots',
    // 'fun',
  ]
  // const words = ['II']
  for (let word of words) {
    scene.addWord(word)
  }

  // Precompute all hbounds
  let protoTags = [
    ...scene.words.map((word) => new Tag(0, word, 0, 0, 1, 0)),
    // ...scene.words.map((word) => new Tag(0, word, 0, 0, 1, -Math.PI / 2)),
  ]

  protoTags.forEach((tag) => console.log(tag.bounds))

  // const colors = chroma
  //   .scale(['#fafa6e', '#2A4858'])
  //   .mode('lch')
  //   .colors(10)
  //   .slice(3)
  const colors = ['#000']

  let lastSucceeded: Point | null = null

  const addRandomTag = ({
    scale,
    visualize = false,
    maxAttempts = 50,
    padding = 0,
    enableSticky = false,
  }: {
    scale: number
    visualize?: boolean
    maxAttempts?: number
    padding?: number
    enableSticky?: boolean
  }) => {
    const tag = sample(protoTags)!
    const maxIterations = 1
    const dtMin = 0.0002
    const dtMax = 0.0005

    const getDt = (nIter: number) =>
      5.5 * (dtMax - (nIter / maxIterations) * (dtMax - dtMin))
    const getSpiralPoint = archimedeanSpiral(30)

    const scenePad = 0
    const x1 = scenePad
    const x2 = viewBox.w - scenePad
    const y1 = scenePad
    const y2 = viewBox.h - scenePad

    tag.scale = scale * (1 + 0.4 * 2 * (Math.random() - 0.5))

    let placed = false

    for (let attempt = 0; attempt < maxAttempts; ++attempt) {
      let cx0 = -1
      let cy0 = -1

      if (scene.bgShape) {
        const p0 = randomPointInsideHbounds(scene.bgShape.hBounds)
        if (p0) {
          cx0 = p0.x
          cy0 = p0.y
        }
      }

      if (cx0 < 0 || cy0 < 0) {
        cx0 =
          x1 +
          (x2 - x1 - tag.bounds.w) / 2 +
          (Math.random() - 0.5) * 2 * (x2 - x1 - tag.bounds.w) * 0.5
        cy0 =
          y1 +
          (y2 - y1 + tag.bounds.h) / 2 +
          (Math.random() - 0.5) * 2 * (y2 - y1 + tag.bounds.h) * 0.5
      }

      if (enableSticky && lastSucceeded) {
        cx0 = lastSucceeded.x + (Math.random() - 0.5) * 2 * tag.bounds.w
        cy0 = lastSucceeded.y + (Math.random() - 0.5) * 2 * tag.bounds.h
      }

      let cx = cx0
      let cy = cy0

      if (visualize) {
        ctx.clearRect(0, 0, viewBox.w, viewBox.h)
        ctx.fillStyle = '#f001'
        ctx.fillRect(0, 0, viewBox.w, viewBox.h)
        renderScene(scene, ctx)
        ctx.fillStyle = 'green'
        ctx.fillRect(cx0, cy0, 10, 10)
        tag.left = cx0
        tag.top = cy0
        tag.draw(ctx)
      }

      let t = 0
      let iteration = 0

      while (iteration < maxIterations) {
        tag.left = cx
        tag.top = cy

        const bounds = tag.bounds

        if (
          !(
            bounds.x < x1 ||
            bounds.x + bounds.w > x2 ||
            bounds.y < y1 ||
            bounds.y + bounds.h > y2
          )
        ) {
          if (!scene.checkCollision(tag, padding)) {
            tag.fillStyle = sample(colors)!
            scene.addTag(tag)

            if (visualize) {
              tag.draw(ctx)
              console.screenshot(ctx.canvas, 0.4)
            }

            // console.log('attempt: ', attempt, 'iteration: ', iteration)
            placed = true
            break
          }
        }

        const spiralPoint = getSpiralPoint(t)
        t += getDt(iteration)

        cx =
          cx0 + (((spiralPoint.x * viewBox.w) / 2) * (2 - 1 * (1 - scale))) / 2
        cy =
          cy0 + (((spiralPoint.y * viewBox.h) / 2) * (2 - 1 * (1 - scale))) / 2

        if (visualize) {
          ctx.fillStyle = 'red'
          ctx.fillRect(cx, cy, 5, 5)
        }

        iteration += 1
      }

      if (visualize) {
        console.screenshot(ctx.canvas, 0.3)
      }

      if (placed) {
        lastSucceeded = { x: cx, y: cy }
        break
      } else {
        lastSucceeded = null
      }

      // scale = Math.max(0.1, scale / 1.2)
    }

    return placed
  }

  const earlyExitFactor = 1
  const countFactor = 1
  const scaleFactor = 0.5

  const initialScale = 0.15
  const finalScale = 0.01
  const scaleStep = 0.15
  let timeout = 1500
  let maxTimeout = 3000
  let timeoutStep = 300
  const maxTagsCount = 1300

  let currentScale = initialScale

  let t0 = performance.now()

  let placedCountTotal = 0
  let placedCountAtCurrentScale = 0
  let scaleCount = 0

  while (currentScale > finalScale) {
    const batchSize = 10
    // Attempt to place a batch of words

    let successCount = 0
    for (let i = 0; i < batchSize; ++i) {
      const isPlaced = addRandomTag({
        scale: scaleFactor * currentScale,
        maxAttempts: 20,
        padding: 40 * scaleFactor * currentScale,
        enableSticky: false,
        visualize: false,
      })

      if (isPlaced) {
        placedCountAtCurrentScale += 1
        placedCountTotal += 1
        successCount += 1
      }

      let t1 = performance.now()
      if (t1 - t0 > timeout) {
        break
      }
    }

    if (placedCountTotal > maxTagsCount) {
      break
    }

    let t1 = performance.now()

    if (successCount === 0 || t1 - t0 > timeout) {
      currentScale -= scaleStep * currentScale
      scaleCount += 1
      timeout += Math.min(maxTimeout, timeout + timeoutStep)
      console.log(
        `Scale: ${currentScale.toFixed(
          3
        )}, ${placedCountAtCurrentScale} words in ${((t1 - t0) / 1000).toFixed(
          2
        )} seconds`
      )
      placedCountAtCurrentScale = 0
      t0 = performance.now()

      await new Promise((resolve) => setTimeout(() => resolve(), 100))

      // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      // renderScene(scene, ctx)
    }
  }

  // @ts-ignore
  scene.addRandomTag = (scale: number, visualize = false, maxAttempts = 50) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    renderScene(scene, ctx)
    addRandomTag({ scale, visualize, maxAttempts })
  }

  return scene
}

const renderScene = (scene: GeneratedScene, ctx: CanvasRenderingContext2D) => {
  // @ts-ignore
  window['ctx'] = ctx
  ctx.save()

  if (scene.bgShape) {
    ctx.globalAlpha = 0.1
    ctx.drawImage(
      scene.bgShape.ctx.canvas,
      0,
      0,
      ctx.canvas.width - 0,
      ctx.canvas.height - 0
    )
    ctx.globalAlpha = 1
  }

  // if (scene.bgShape) {
  //   drawHBounds(ctx, scene.bgShape.hBoundsNagative)
  // }

  for (let tag of scene.tags) {
    // ctx.fillStyle = '#f002'
    // ctx.fillRect(tag.bounds.x, tag.bounds.y, tag.bounds.w, tag.bounds.h)

    tag.draw(ctx)

    // drawHBounds(ctx, tag.hBounds)
  }
  ctx.restore()
}
// ---------------------
