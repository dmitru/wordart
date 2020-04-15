import * as opentype from 'opentype.js'
import {
  Matrix,
  identity,
  translate,
  compose,
  scale,
  rotate,
} from 'transformation-matrix'
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
} from 'lib/wordart/geometry'
import { loadFont } from 'lib/wordart/fonts'
import { sample } from 'lodash'

export const scratch = async (canvas: HTMLCanvasElement) => {
  const font = await loadFont('/fonts/mail-ray-stuff.ttf')
  console.log('font = ', font)
  // @ts-ignore
  window['font'] = font

  const ctx = canvas.getContext('2d')!

  const viewBox: Rect = { x: 0, y: 0, w: canvas.width, h: canvas.height }
  let scene = generateWordArt({ ctx, font, viewBox })
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  renderScene(scene, ctx)

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

  document.addEventListener('keydown', (e) => {
    const key = e.key
    if (key === 'g') {
      scene = generateWordArt({ ctx, font, viewBox })
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      renderScene(scene, ctx)
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
  })

  // let raf = -1

  // const render = () => {
  //   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  //   renderScene(scene, ctx)
  //   raf = requestAnimationFrame(render)
  // }

  // raf = requestAnimationFrame(render)
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

  const doesCollideOtherTags = (tag: Tag) => {
    for (let t of scene.tags) {
      if (collideHBounds(t.hBounds, tag.hBounds, 2).collides) {
        return true
      }
    }
    return false
  }

  // Precompute all hbounds
  const protoTags = scene.words.map((word) => new Tag(0, word, 0, 0, 1, 0))
  protoTags.forEach((tag) => console.log(tag.bounds))

  // let nWords = 0
  const configs = [
    { nWords: 1, scale: 1.2 },
    { nWords: 3, scale: 0.8 },
    { nWords: 5, scale: 0.6 },
    { nWords: 10, scale: 0.5 },
    { nWords: 50, scale: 0.2 },
    { nWords: 100, scale: 0.1 },
    // { nWords: 0, scale: 0.2 },
    // { nWords: 50, scale: 0.1 },
    // { nWords: 50, scale: 0.075 },
    // { nWords: 50, scale: 0.05 },
  ]
  for (const config of configs) {
    let nWords = config.nWords
    let scale = config.scale
    // let scale = 0.1 + (1 - (i * 0.9) / nWords) * Math.random()

    for (let i = 0; i < nWords; ++i) {
      const tag = sample(protoTags)!

      const x1 = 10
      const x2 = viewBox.w - 10
      const y1 = 10
      const y2 = viewBox.h - 10

      tag.scale = scale
      // tag.angle = sample([0, Math.PI / 2])!

      let placed = false

      for (let attempt = 0; attempt < 20; ++attempt) {
        let cx0 = x1 + Math.random() * (x2 - x1 - tag.bounds.w)
        let cy0 =
          y1 +
          (y2 - y1) / 2 -
          tag.bounds.h / 2 +
          (Math.random() - 0.5) * (y2 - y1 - tag.bounds.h)

        let cx = cx0
        let cy = cy0

        let angle = Math.random() > 0.5 ? 0 : Math.PI
        let radius = viewBox.h * (0.1 + Math.random() * 0.2)
        let iteration = 0

        while (iteration < 20) {
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
              const tagAdded = scene.addTag(
                tag.word,
                tag.left,
                tag.top,
                tag.scale,
                tag.angle
              )
              tagAdded._hBounds = tag._hBounds

              // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
              // renderScene(scene, ctx)
              // console.screenshot(ctx.canvas, 0.4)

              console.log('attempt: ', attempt, 'iteration: ', iteration)
              placed = true
              break
            }
          }

          cx = cx0 + Math.cos(angle) * radius
          cy = cx0 + Math.sin(angle) * radius

          radius += (0.1 * viewBox.h) / 10
          angle += (2 * Math.PI) / 10

          iteration += 1
        }

        // console.log('placed', placed, i, nWords)

        if (placed) {
          break
        }

        // scale = Math.max(0.1, scale / 1.2)
      }
    }
  }

  return scene
}

const renderScene = (scene: GeneratedScene, ctx: CanvasRenderingContext2D) => {
  ctx.save()
  for (let tag of scene.tags) {
    ctx.fillStyle = '#f002'
    ctx.fillRect(tag.bounds.x, tag.bounds.y, tag.bounds.w, tag.bounds.h)

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

  constructor(font: Font, viewBox: Rect) {
    this.font = font
    this.viewBox = viewBox
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
  }

  addTag = (word: Word, x: number, y: number, scale = 1, angle = 0) => {
    if (this.words.length === 0) {
      throw new Error('No words added')
    }

    const id = (this.nextTagId += 1)
    const tag = new Tag(id, word, x, y, scale, angle)
    this.tags.push(tag)

    return tag
  }
}

export class Tag {
  word: Word
  _transform: Matrix | null = null
  id: number

  fillStyle: string = 'black'

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

  get transform() {
    if (!this._transform) {
      this._transform = compose(
        translate(this._left, this._top),
        rotate(this._angle),
        scale(this._scale)
      )
    }
    return this._transform
  }

  get left() {
    return this._left
  }

  set left(left: number) {
    this._left = left
    this._transform = null
  }

  get top() {
    return this._top
  }
  set top(top: number) {
    this._top = top
    this._transform = null
  }

  get scale() {
    return this._scale
  }
  set scale(scale: number) {
    this._scale = scale
    this._transform = null
    // this._hBounds = null
  }

  get angle() {
    return this._angle
  }
  set angle(angle: number) {
    this._angle = angle
    this._transform = null
    this._hBounds = null
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
    return {
      ...this._hBounds,
      transform: tm.compose(
        tm.translate(this._left, this._top),
        tm.scale(this._scale),
        this._hBounds.transform
      ),
    }
  }

  get bounds(): Rect {
    return transformRect(this.hBounds.transform, this.hBounds.bounds)
  }

  _computeHBounds = (): HBounds => {
    let currentOffset = 0

    const symbolHBounds = this.word.symbols.map((symbol, index) => {
      const symbolHBounds = symbol.computeHBounds(this._angle, 1)

      symbolHBounds.transform = compose(
        // tm.scale(this._scale),
        tm.rotate(this._angle),
        tm.translate(currentOffset),
        tm.rotate(-this._angle),
        // tm.scale(1 / this._scale),
        symbolHBounds.transform
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

    ctx.transform(
      hBounds.transform.a,
      hBounds.transform.b,
      hBounds.transform.c,
      hBounds.transform.d,
      hBounds.transform.e,
      hBounds.transform.f
    )

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
