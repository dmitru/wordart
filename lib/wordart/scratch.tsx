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
  Transform,
  HBounds,
  mkTransform,
  mergeHBounds,
  computeHBoundsForPath,
  transformRect,
  collideHBounds,
  multiply,
  Point,
  drawHBounds,
} from 'lib/wordart/geometry'
import { loadFont } from 'lib/wordart/fonts'
import { sample } from 'lodash'
import Bounds from 'superquad/lib/bounds/Bounds'

const fontName = 'mountains-of-christmas_bold.ttf'
const fontName2 = 'mail-ray-stuff.ttf'
const fontName3 = 'Verona-Xlight.ttf'

let font: Font
if (typeof window !== 'undefined') {
  loadFont(`/fonts/${fontName3}`).then((f) => {
    font = f
  })
}

export const scratch = (canvas: HTMLCanvasElement) => {
  // const tagBg = scene.addTag(scene.words[0], 300, 100, 2, Math.PI / 2)
  let tag: Tag | null = null

  const ctx = canvas.getContext('2d')!

  const onKeyDown = (e: KeyboardEvent) => {
    const key = e.key
    if (key === 'g') {
      console.log('font = ', font)
      // @ts-ignore
      window['font'] = font

      const viewBox: Rect = { x: 0, y: 0, w: canvas.width, h: canvas.height }
      const t1 = performance.now()
      let scene = generateWordArt({ ctx, font, viewBox })
      const t2 = performance.now()
      console.log(`Finished: ${((t2 - t1) / 1000).toFixed(1)} seconds`)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      renderScene(scene, ctx)

      // tag = new Tag(0, sample(scene.words)!, 0, 0, 1)

      let collides = false
      // canvas.addEventListener('mousemove', (e) => {
      //   const x = e.offsetX
      //   const y = e.offsetY

      //   if (tag) {
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
    // if (key === 'w') {
    //   if (tag) {
    //     tag.scale = tag._scale + 0.1
    //   }
    // } else if (key === 's') {
    //   if (tag) {
    //     tag.scale = tag._scale - 0.1
    //   }
    // } else if (key === 'd') {
    //   if (tag) {
    //     tag.angle = tag._angle + 0.03
    //   }
    // } else if (key === 'a') {
    //   if (tag) {
    //     tag.angle = tag._angle - 0.03
    //   }
    // }
  }
  document.addEventListener('keydown', onKeyDown)

  let raf = -1

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

  const addRandomTag = (
    scale: number,
    visualize = false,
    maxAttempts = 50,
    padding = 0,
    enableSticky = false
  ) => {
    const tag = sample(protoTags)!
    const maxIterations = 5
    const dtMin = 0.0002
    const dtMax = 0.0005
    // const getDt = (nIter: number) => dtMax - (nIter / 1000) * (dtMax - dtMin)
    const getDt = (nIter: number) =>
      20.5 * (dtMax - (nIter / maxIterations) * (dtMax - dtMin))
    const getSpiralPoint = archimedeanSpiral(30)

    const x1 = 30
    const x2 = viewBox.w - 30
    const y1 = 30
    const y2 = viewBox.h - 30

    tag.scale = scale * (1 + 0.4 * 2 * (Math.random() - 0.5))

    let placed = false

    for (let attempt = 0; attempt < maxAttempts; ++attempt) {
      let cx0 =
        x1 +
        (x2 - x1 - tag.bounds.w) / 2 +
        (Math.random() - 0.5) * 2 * (x2 - x1 - tag.bounds.w) * 0.5
      let cy0 =
        y1 +
        (y2 - y1 + tag.bounds.h) / 2 +
        (Math.random() - 0.5) * 2 * (y2 - y1 + tag.bounds.h) * 0.5

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

        // cx = cx0 + Math.cos(angle) * radius
        // cy = cx0 + Math.sin(angle) * radius

        // radius += (0.1 * viewBox.h) / 10
        // angle += (2 * Math.PI) / 10

        iteration += 1
      }

      // if (iteration > 10) {
      if (visualize) {
        console.screenshot(ctx.canvas, 0.3)
      }
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

  const countFactor = 3.5
  const scaleFactor = 1

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
      maxAttempts: 20,
      maxFailsInRow: 20,
      padding: 3,
      enableSticky: true,
    },
    {
      scale: 0.016,
      count: 400,
      maxAttempts: 20,
      maxFailsInRow: 10,
      padding: 3,
      enableSticky: true,
    },
    {
      scale: 0.013,
      count: 400,
      maxAttempts: 20,
      maxFailsInRow: 10,
      padding: 3,
      enableSticky: true,
    },
  ]

  for (const [index, config] of configs.entries()) {
    let cnt = 0
    let failsInRow = 0
    const t1 = performance.now()
    for (let i = 0; i < countFactor * config.count; ++i) {
      const isPlaced = addRandomTag(
        scaleFactor * config.scale,
        false,
        config.maxAttempts,
        scaleFactor * config.padding,
        config.enableSticky || false
      )
        ? 1
        : 0
      if (isPlaced) {
        cnt += 1
        failsInRow = 0
      } else {
        failsInRow += 1
      }
      if (failsInRow > (config.maxFailsInRow || 3)) {
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
    addRandomTag(scale, visualize, maxAttempts)
  }

  return scene
}

const renderScene = (scene: GeneratedScene, ctx: CanvasRenderingContext2D) => {
  // @ts-ignore
  window['ctx'] = ctx
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

  checkCollision = (tag: Tag, pad = 0): boolean => {
    const getTagPadding = (tag: Tag) => {
      // return 0
      return pad
    }
    const getTagMaxLevel = (tag: Tag) => {
      // return 100
      return tag.scale >= 0.2
        ? 9
        : tag.scale > 0.05
        ? 6
        : tag.scale > 0.03
        ? 3
        : 2
    }

    const padding = getTagPadding(tag)
    const candidateTags = this.quad.colliding({
      x: tag.bounds.x - padding,
      y: tag.bounds.y - padding,
      width: tag.bounds.w + 2 * padding,
      height: tag.bounds.h + 2 * padding,
    })

    const minSize = 4

    if (this._lastTagChecked === tag && this._lastTagCollided) {
      if (
        collideHBounds(
          this._lastTagCollided.hBounds,
          tag.hBounds,
          0,
          padding,
          getTagMaxLevel(this._lastTagCollided),
          getTagMaxLevel(tag),
          minSize
        )
      ) {
        return true
      }
    } else {
      this._lastTagChecked = null
      this._lastTagCollided = null
    }

    for (let t of candidateTags) {
      if (
        collideHBounds(
          t.hBounds,
          tag.hBounds,
          0,
          padding,
          getTagMaxLevel(t),
          getTagMaxLevel(tag),
          minSize
        )
      ) {
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

  drawHBounds = (ctx: CanvasRenderingContext2D) => {
    drawHBounds(ctx, this.hBounds)
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

  constructor(id: WordId, text: string, font: Font, fontSize = 400) {
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
