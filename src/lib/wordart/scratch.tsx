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

    const bgImageCtx = await loadImageUrlToCanvasCtx(BG_SHAPE, 800, 800)
    console.screenshot(bgImageCtx.canvas)

    if (key === 'g') {
      console.log('font = ', font)
      // @ts-ignore
      window['font'] = font

      const viewBox: Rect = { x: 0, y: 0, w: canvas.width, h: canvas.height }
      const t1 = performance.now()
      scene = generateWordArt({ ctx, font, viewBox, bgImageCtx })
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

export const generateWordArt = (args: {
  ctx: CanvasRenderingContext2D
  font: opentype.Font
  viewBox: Rect
  oldScene?: GeneratedScene
  bgImageCtx: CanvasRenderingContext2D
}): GeneratedScene => {
  const { font, viewBox, ctx, oldScene, bgImageCtx } = args

  const scene = new GeneratedScene(font, viewBox)
  scene.setBgShape(bgImageCtx)

  if (oldScene) {
    scene.symbols = oldScene.symbols
    scene.words = oldScene.words
  }

  const words = [
    'word',
    'Cloud',
    'art',
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

  const doesCollideOtherTags = (tag: Tag, padding = 0) =>
    scene.checkCollision(tag, padding)

  // Precompute all hbounds
  let protoTags = [
    ...scene.words.map((word) => new Tag(0, word, 0, 0, 1, 0)),
    ...scene.words.map((word) => new Tag(0, word, 0, 0, 1, -Math.PI / 2)),
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
    const maxIterations = 10
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
          if (!doesCollideOtherTags(tag, padding)) {
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
  const scaleFactor = 0.8

  const configs = [
    {
      scale: 0.65,
      count: 1,
      maxAttempts: 50,
      padding: 30,
      enableSticky: false,
      maxFailsInRow: 5,
    },
    {
      scale: 0.5,
      count: 3,
      maxAttempts: 50,
      padding: 20,
      enableSticky: false,
      maxFailsInRow: 5,
    },
    { scale: 0.3, count: 6, maxAttempts: 50, padding: 20 },
    { scale: 0.23, count: 16, maxAttempts: 50, padding: 30 },
    { scale: 0.1, count: 120, maxFailsInRow: 5, maxAttempts: 30, padding: 20 },
    { scale: 0.07, count: 120, maxFailsInRow: 5, maxAttempts: 20, padding: 5 },
    { scale: 0.06, count: 120, maxFailsInRow: 5, maxAttempts: 20, padding: 5 },
    {
      scale: 0.05,
      count: 220,
      maxFailsInRow: 25,
      maxAttempts: 16,
      padding: 3,
      enableSticky: true,
    },
    {
      scale: 0.038,
      count: 230,
      maxFailsInRow: 30,
      maxAttempts: 16,
      padding: 3,
      enableSticky: true,
    },
    {
      scale: 0.03,
      count: 400,
      maxAttempts: 10,
      maxFailsInRow: 20,
      padding: 3,
      enableSticky: true,
    },
    {
      scale: 0.023,
      count: 400,
      maxAttempts: 50,
      maxFailsInRow: 20,
      padding: 3,
      enableSticky: true,
    },
    {
      scale: 0.016,
      count: 400,
      maxAttempts: 50,
      maxFailsInRow: 10,
      padding: 3,
      enableSticky: true,
    },
    {
      scale: 0.013,
      count: 400,
      maxAttempts: 50,
      maxFailsInRow: 30,
      padding: 3,
      enableSticky: true,
    },
  ]

  for (const [index, config] of configs.entries()) {
    let cnt = 0
    let failsInRow = 0
    const t1 = performance.now()
    for (let i = 0; i < countFactor * config.count; ++i) {
      const isPlaced = addRandomTag({
        scale: scaleFactor * config.scale,
        visualize: false,
        maxAttempts: config.maxAttempts,
        padding: scaleFactor * config.padding,
        enableSticky: config.enableSticky || false,
      })
        ? 1
        : 0

      if (isPlaced) {
        cnt += 1
        failsInRow = 0
      } else {
        failsInRow += 1
      }
      if (failsInRow > earlyExitFactor * (config.maxFailsInRow || 3)) {
        console.log('early exit')
        break
      }
    }
    const t2 = performance.now()
    console.log(
      `${index + 1}: Finished: ${((t2 - t1) / 1000).toFixed(
        1
      )} seconds, cnt: ${cnt}`
    )
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
    ctx.globalAlpha = 0
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
