import * as opentype from 'opentype.js'
import {
  Matrix,
  identity,
  translate,
  compose,
  scale,
  rotate,
} from 'transformation-matrix'
import { archimedeanSpiral } from './spirals'
import Quadtree from 'quadtree-lib'
import chroma from 'chroma-js'
import * as tm from 'transformation-matrix'
import * as fermat from '@mathigon/fermat'
import 'lib/wordart/console-extensions'
import {
  Rect,
  renderHBounds,
  Transform,
  HBounds,
  mkTransform,
  mergeHBounds,
  computeHBoundsForPath,
  transformRect,
  collideHBounds,
  multiply,
  Point,
} from 'lib/wordart/geometry'
import { loadFont } from 'lib/wordart/fonts'
import { sample } from 'lodash'
import Bounds from 'superquad/lib/bounds/Bounds'

let font: Font
if (typeof window !== 'undefined') {
  loadFont('/fonts/mail-ray-stuff.ttf').then((f) => {
    font = f
  })
}

export const scratch = (canvas: HTMLCanvasElement) => {
  // const tagBg = scene.addTag(scene.words[0], 300, 100, 2, Math.PI / 2)
  // const tag = scene.addTag(scene.words[0], 0, 0, 1, 0)

  // let collides = false
  // canvas.addEventListener('mousemove', (e) => {
  //   const x = e.offsetX
  //   const y = e.offsetY
  //   tag.left = x
  //   tag.top = y

  //   collides = collideHBounds(tag.hBounds, tagBg.hBounds).collides

  //   tag.fillStyle = collides ? 'green' : 'black'
  // })

  const onKeyDown = (e: KeyboardEvent) => {
    const key = e.key
    if (key === 'g') {
      console.log('font = ', font)
      // @ts-ignore
      window['font'] = font

      const ctx = canvas.getContext('2d')!

      const viewBox: Rect = { x: 0, y: 0, w: canvas.width, h: canvas.height }
      const t1 = performance.now()
      let scene = generateWordArt({ ctx, font, viewBox })
      const t2 = performance.now()
      console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      renderScene(scene, ctx)

      // @ts-ignore
      window['scene'] = scene
      console.log('scene', scene)
    }
    // if (key === 'w') {
    //   tag.scale = tag._scale + 0.1
    // } else if (key === 's') {
    //   tag.scale = tag._scale - 0.1
    // } else if (key === 'd') {
    //   tag.angle = tag._angle + 0.03
    // } else if (key === 'a') {
    //   tag.angle = tag._angle - 0.03
    // }
  }
  document.addEventListener('keydown', onKeyDown)

  // let raf = -1

  // const render = () => {
  //   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  //   renderScene(scene, ctx)
  //   raf = requestAnimationFrame(render)
  // }

  // raf = requestAnimationFrame(render)

  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

export const generateWordArt = (args: {
  ctx: CanvasRenderingContext2D
  font: opentype.Font
  viewBox: Rect
}): GeneratedScene => {
  const { font, viewBox, ctx } = args

  const scene = new GeneratedScene(font, viewBox)
  const words = [
    'universe',
    'love',
    'wind',
    'earth',
    'water',
    'fire',
    'words',
    'many',
    'happiness',
    'emotion',
    'bliss',
    'serenity',
    'lots',
    'fun',
    'cheerful',
  ]
  // const words = ['II']
  for (let word of words) {
    scene.addWord(word)
  }

  const doesCollideOtherTags = (tag: Tag) => scene.checkCollision(tag)

  // Precompute all hbounds
  let protoTags = [
    ...scene.words.map((word) => new Tag(0, word, 0, 0, 1, 0)),
    ...scene.words.map((word) => new Tag(0, word, 0, 0, 1, -Math.PI / 2)),
  ]

  protoTags.forEach((tag) => console.log(tag.bounds))

  const colors = chroma
    .scale(['#fafa6e', '#2A4858'])
    .mode('lch')
    .colors(10)
    .slice(3)

  let lastSucceeded: Point | null = null

  const addRandomTag = (
    scale: number,
    visualize = false,
    dt = 0.5,
    maxAttempts = 10,
    maxIterations = 30,
    spiralDivider = 15
  ) => {
    const tag = sample(protoTags)!
    const spiral = archimedeanSpiral(1, 1)

    const x1 = 10
    const x2 = viewBox.w - 10
    const y1 = 10
    const y2 = viewBox.h - 10

    tag.scale = scale * (1 + 0.3 * Math.random())
    // tag.angle = sample([0, Math.PI / 2])!

    let placed = false

    for (let attempt = 0; attempt < maxAttempts; ++attempt) {
      let cx0 = lastSucceeded
        ? lastSucceeded.x
        : x1 + Math.random() * (x2 - x1 - tag.bounds.w)
      let cy0 = lastSucceeded
        ? lastSucceeded.y
        : y1 +
          (y2 - y1) / 2 -
          tag.bounds.h / 2 +
          (Math.random() - 0.5) * (y2 - y1 - tag.bounds.h)

      let cx = cx0
      let cy = cy0

      if (visualize) {
        ctx.fillStyle = 'green'
        ctx.fillRect(cx0, cy0, 10, 10)
      }

      let t = 0
      let iteration = 0

      // ctx.clearRect(0, 0, viewBox.w, viewBox.h)
      // renderScene(scene, ctx)

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
          if (!doesCollideOtherTags(tag)) {
            tag.fillStyle = sample(colors)!
            scene.addTag(tag)
            // tag.draw(ctx)

            // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
            // renderScene(scene, ctx)
            // console.screenshot(ctx.canvas, 0.4)

            console.log('attempt: ', attempt, 'iteration: ', iteration)
            placed = true
            break
          }
        }

        const spiralPoint = spiral(t)
        t += dt

        cx = cx0 + (spiralPoint.x * viewBox.w) / spiralDivider
        cy = cy0 + (spiralPoint.y * viewBox.h) / spiralDivider

        if (visualize) {
          ctx.fillStyle = 'red'
          ctx.fillRect(cx, cy, 5, 5)
        }

        // cx = cx0 + Math.cos(angle) * radius
        // cy = cx0 + Math.sin(angle) * radius

        // radius += (0.1 * viewBox.h) / 10
        // angle += (2 * Math.PI) / 10

        iteration += 1
      }

      // if (iteration > 10) {
      //   console.screenshot(ctx.canvas, 0.3)
      // }

      // console.log('placed', placed, i, nWords)

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

  const factor = 1
  let cnt = 0
  const t1 = performance.now()
  for (let i = 0; i < 1; ++i) {
    cnt += addRandomTag(2, false, 1, 20, 100) ? 1 : 0
  }
  const t2 = performance.now()
  console.log(
    `t2: Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds, cnt: ${cnt}`
  )
  // for (let i = 0; i < 3; ++i) {
  //   addRandomTag(0.8, false, 0.4, 20, 100)
  // }
  // for (let i = 0; i < 6; ++i) {
  //   addRandomTag(0.65, false, 0.2, 20, 100)
  // }
  cnt = 0
  for (let i = 0; i < 2 * factor; ++i) {
    cnt += addRandomTag(1.5, false, 0.2, 10, 100, 20) ? 1 : 0
  }
  const t3 = performance.now()
  console.log(
    `t3: Finished: ${((t3 - t2) / 1000).toFixed(1)} seconds, cnt: ${cnt}`
  )
  cnt = 0
  for (let i = 0; i < 8 * factor; ++i) {
    cnt += addRandomTag(0.4, false, 0.5, 10, 100, 20) ? 1 : 0
  }
  const t4 = performance.now()
  console.log(
    `t4: Finished: ${((t4 - t3) / 1000).toFixed(1)} seconds, cnt: ${cnt}`
  )
  cnt = 0
  for (let i = 0; i < 20 * factor; ++i) {
    cnt += addRandomTag(0.3, false, 0.3, 10, 100, 20) ? 1 : 0
  }
  const t5 = performance.now()
  console.log(
    `t5: Finished: ${((t5 - t4) / 1000).toFixed(1)} seconds, cnt: ${cnt}`
  )
  cnt = 0
  for (let i = 0; i < 60 * factor; ++i) {
    cnt += addRandomTag(0.2, false, 0.25, 30, 60, 30) ? 1 : 0
  }
  const t6 = performance.now()
  console.log(
    `t6: Finished: ${((t6 - t5) / 1000).toFixed(1)} seconds, cnt: ${cnt}`
  )
  cnt = 0
  for (let i = 0; i < 160 * factor; ++i) {
    cnt += addRandomTag(0.1, false, 0.72, 5, 80, 40) ? 1 : 0
  }
  const t7 = performance.now()
  console.log(
    `t7: Finished: ${((t7 - t6) / 1000).toFixed(1)} seconds, cnt: ${cnt}`
  )
  cnt = 0
  // for (let i = 0; i < 100; ++i) {
  //   addRandomTag(0.08, false, 0.1, 20, 100, 50)
  // }
  for (let i = 0; i < 100 * factor; ++i) {
    cnt += addRandomTag(0.05, false, 0.22, 5, 160, 30) ? 1 : 0
  }
  const t8 = performance.now()
  console.log(
    `t8: Finished: ${((t8 - t7) / 1000).toFixed(1)} seconds, cnt: ${cnt}`
  )
  cnt = 0
  // for (let i = 0; i < 100; ++i) {
  //   addRandomTag(0.08, false, 0.1, 20, 100, 50)
  // }
  for (let i = 0; i < 400 * factor; ++i) {
    cnt += addRandomTag(0.025, false, 0.22, 5, 160, 30) ? 1 : 0
  }
  const t9 = performance.now()
  console.log(
    `t9: Finished: ${((t9 - t8) / 1000).toFixed(1)} seconds, cnt: ${cnt}`
  )
  // for (let i = 0; i < 100; ++i) {
  //   addRandomTag(0.03, false, 0.05, 20, 100, 60)
  // }
  // for (let i = 0; i < 300; ++i) {
  //   addRandomTag(0.03, false, 0.05, 30, 500, 60)
  // }

  // let scale = 0.5
  // let batchSize = 5

  // let placedCount = 0
  // let scalesTried = 1
  // let attemptsAtCurrentScale = 0
  // // for (const config of configs) {
  // while (placedCount < 3) {
  //   // let scale = config.scale
  //   // let scale = 0.1 + (1 - (i * 0.9) / nWords) * Math.random()

  //   let successCount = 0
  //   for (let i = 0; i < batchSize / scale; ++i) {
  //     const placed = addRandomTag(scale, false, 0.05, 10, 200)
  //     attemptsAtCurrentScale += 1
  //     if (placed) {
  //       placedCount += 1
  //       successCount += 1
  //     }
  //   }
  //   console.log('scale = ', scale, successCount)

  //   if (successCount === 0) {
  //     attemptsAtCurrentScale += 1
  //   }

  //   if (successCount === 0 && attemptsAtCurrentScale > 3 / scale) {
  //     scale /= 1.3
  //     scalesTried += 1
  //     attemptsAtCurrentScale = 0
  //   }

  //   if (scalesTried > 3) {
  //     break
  //   }

  //   if (placedCount > 100) {
  //     break
  //   }
  // }

  // @ts-ignore
  scene.addRandomTag = (
    scale: number,
    dt = 0.02,
    maxAttempts = 10,
    maxIterations = 30,
    spiralDivider = 15
  ) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    renderScene(scene, ctx)
    addRandomTag(scale, true, dt, maxAttempts, maxIterations, spiralDivider)
  }

  return scene
}

const renderScene = (scene: GeneratedScene, ctx: CanvasRenderingContext2D) => {
  ctx.save()
  for (let tag of scene.tags) {
    // ctx.fillStyle = '#f002'
    // ctx.fillRect(tag.bounds.x, tag.bounds.y, tag.bounds.w, tag.bounds.h)

    tag.draw(ctx)

    // drawHBounds(ctx, tag.hBounds)
  }
  ctx.restore()
}

export class GeneratedScene {
  viewBox: Rect
  font: opentype.Font

  nextWordId = 0
  nextTagId = 0
  words: Word[] = []
  tags: Tag[] = []

  symbols: Map<SymbolId, Symbol> = new Map()
  quad: Quadtree<Tag>
  _lastTagCollided: Tag | null = null
  _lastTagChecked: Tag | null = null

  constructor(font: Font, viewBox: Rect) {
    this.font = font
    this.viewBox = viewBox
    this.quad = new Quadtree<Tag>({ width: viewBox.w, height: viewBox.h })
  }

  addWord = (text: string) => {
    const id = (this.nextWordId += 1)

    const word = new Word(id, text, this.font)
    this.words.push(word)

    for (let symbols of word.symbols) {
      this.symbols.set(symbols.id, symbols)
    }
  }

  removeTag = (tag: Tag) => {
    this.tags = this.tags.filter((t) => t === tag)
    this.quad.remove(tag)
  }

  checkCollision = (tag: Tag): boolean => {
    const padding = Math.min(tag.bounds.h, tag.bounds.w) * 0.1
    const candidateTags = this.quad.colliding({
      x: tag.bounds.x - padding,
      y: tag.bounds.y - padding,
      width: tag.bounds.w + 2 * padding,
      height: tag.bounds.h + 2 * padding,
    })

    if (this._lastTagChecked === tag && this._lastTagCollided) {
      if (
        collideHBounds(this._lastTagCollided.hBounds, tag.hBounds, padding)
          .collides
      ) {
        return true
      }
    } else {
      this._lastTagChecked = null
      this._lastTagCollided = null
    }

    for (let t of candidateTags) {
      if (collideHBounds(t.hBounds, tag.hBounds, padding).collides) {
        this._lastTagChecked = tag
        this._lastTagCollided = t
        return true
      }
    }
    return false
  }

  addTag = (tag: Tag) => {
    const id = (this.nextTagId += 1)
    const addedTag = new Tag(
      id,
      tag.word,
      tag.left,
      tag.top,
      tag.scale,
      tag.angle
    )
    addedTag.fillStyle = tag.fillStyle
    addedTag._hBounds = tag._hBounds
    this.tags.push(addedTag)
    this.quad.push(addedTag)
  }
}

export class Tag {
  word: Word
  _transform: Matrix | null = null
  id: number

  fillStyle: string = 'black'

  _bounds: Rect | null = null
  _hBounds: HBounds | null = null

  /** left (X) coord of the center of the tag */
  _left: number = 0
  /** top (Y) coord of the center of the tag */
  _top: number = 0

  _angle: number = 0
  _scale: number = 1

  constructor(
    id: TagId,
    word: Word,
    x: number,
    y: number,
    scale = 1,
    angle = 0
  ) {
    this.id = id
    this.word = word
    this._left = x
    this._top = y
    this._scale = scale
    this._angle = angle
  }

  get x() {
    return this.bounds.x
  }
  get y() {
    return this.bounds.y
  }
  get width() {
    return this.bounds.w
  }
  get height() {
    return this.bounds.h
  }

  get transform() {
    if (!this._transform) {
      const transform = multiply(
        multiply(translate(this._left, this._top), rotate(this._angle)),
        scale(this._scale)
      )
      this._transform = transform
    }
    return this._transform
  }

  get left() {
    return this._left
  }

  set left(left: number) {
    this._left = left
    this._transform = null
    this._bounds = null
  }

  get top() {
    return this._top
  }
  set top(top: number) {
    this._top = top
    this._transform = null
    this._bounds = null
  }

  get scale() {
    return this._scale
  }
  set scale(scale: number) {
    this._scale = scale
    this._transform = null
    this._bounds = null
    // this._hBounds = null
  }

  get angle() {
    return this._angle
  }
  set angle(angle: number) {
    this._angle = angle
    this._transform = null
    this._hBounds = null
    this._bounds = null
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save()
    ctx.setTransform(this.transform)
    ctx.fillStyle = this.fillStyle
    this.word.draw(ctx)
    ctx.restore()
  }

  get hBounds(): HBounds {
    if (!this._hBounds) {
      this._hBounds = this._computeHBounds()
    }
    const id = tm.identity()
    const transform = multiply(
      multiply(
        multiply(id, tm.translate(this._left, this._top)),
        tm.scale(this._scale)
      ),
      this._hBounds.transform ? this._hBounds.transform : id
    )

    return {
      count: this._hBounds.count,
      level: this._hBounds.level,
      bounds: this._hBounds.bounds,
      overlapsShape: this._hBounds.overlapsShape,
      children: this._hBounds.children,
      transform: transform,
    }
  }

  get bounds(): Rect {
    if (!this._bounds) {
      this._bounds = this.hBounds.transform
        ? transformRect(this.hBounds.transform, this.hBounds.bounds)
        : this.hBounds.bounds
    }
    return this._bounds
  }

  _computeHBounds = (): HBounds => {
    let currentOffset = 0

    const symbolHBounds = this.word.symbols.map((symbol, index) => {
      const symbolHBounds = symbol.computeHBounds(this._angle, 1)

      symbolHBounds.transform = multiply(
        multiply(
          multiply(
            // tm.scale(this._scale),
            tm.rotate(this._angle),
            tm.translate(currentOffset)
          ),
          tm.rotate(-this._angle)
        ),
        // tm.scale(1 / this._scale),
        symbolHBounds.transform ? symbolHBounds.transform : identity()
      )

      currentOffset += this.word.symbolOffsets[index]
      return symbolHBounds
    })

    const wordHBounds = mergeHBounds(symbolHBounds)
    return wordHBounds
  }
}

export class Word {
  id: number
  font: opentype.Font
  text: string
  symbols: Symbol[]
  symbolOffsets: number[]
  fontSize: number

  constructor(id: WordId, text: string, font: Font, fontSize = 200) {
    this.id = id
    this.font = font
    this.text = text
    this.fontSize = fontSize
    this.symbols = stringToSymbols(text, font, fontSize)

    this.symbolOffsets = this.symbols.map(
      (symbol) => (fontSize * symbol.glyph.advanceWidth) / this.font.unitsPerEm
    )
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save()
    for (const [index, symbol] of this.symbols.entries()) {
      symbol.draw(ctx)
      ctx.translate(this.symbolOffsets[index], 0)
    }
    ctx.restore()
  }
}

const drawHBounds = (ctx: CanvasRenderingContext2D, hBounds: HBounds) => {
  const drawHBoundsImpl = (hBounds: HBounds, level = 0) => {
    if (level > 5) {
      return
    }
    ctx.save()
    ctx.lineWidth = 0.5
    ctx.strokeStyle = hBounds.overlapsShape ? 'red' : 'yellow'

    if (hBounds.transform) {
      ctx.transform(
        hBounds.transform.a,
        hBounds.transform.b,
        hBounds.transform.c,
        hBounds.transform.d,
        hBounds.transform.e,
        hBounds.transform.f
      )
    }

    // if (hBounds.overlapsShape) {
    ctx.strokeRect(
      hBounds.bounds.x,
      hBounds.bounds.y,
      hBounds.bounds.w,
      hBounds.bounds.h
    )
    // }

    if (hBounds.children) {
      hBounds.children.forEach((child) => drawHBoundsImpl(child, level + 1))
    }

    ctx.restore()
  }

  drawHBoundsImpl(hBounds)
}

export class Symbol {
  glyph: Glyph
  font: Font
  id: string
  fontSize: number

  private _hBounds: HBounds | null = null

  constructor(font: Font, glyph: Glyph, fontSize: number) {
    this.font = font
    this.fontSize = fontSize
    this.id = getSymbolId(glyph, font)
    this.glyph = glyph
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    const path = this.glyph.getPath(0, 0, this.fontSize)
    // @ts-ignore
    path.fill = ctx.fillStyle
    path.draw(ctx)
  }

  computeHBounds(angle = 0, scaleFactor = 1): HBounds {
    return computeHBoundsForPath(
      this.glyph.getPath(0, 0, this.fontSize),
      angle,
      scaleFactor
    ).hBounds
  }
}

export const getSymbolId = (glyph: Glyph, font: Font): SymbolId =>
  // @ts-ignore
  `${glyph.index}`

export const stringToSymbols = (
  text: string,
  font: Font,
  fontSize: number
): Symbol[] =>
  font
    .stringToGlyphs(text)
    .map((otGlyph) => new Symbol(font, otGlyph, fontSize))

export type Glyph = opentype.Glyph
export type Font = opentype.Font

export type WordId = number
export type TagId = number
export type SymbolId = string

// ---------------------
