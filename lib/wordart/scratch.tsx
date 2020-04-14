import * as opentype from 'opentype.js'
import {
  Matrix,
  identity,
  translate,
  compose,
  scale,
  rotate,
} from 'transformation-matrix'
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
  const scene = generateWordArt({ font, viewBox })
  console.log(scene)

  for (let symbol of scene.symbols.values()) {
    console.log(symbol.hBounds)
  }

  const tag = scene.addRandomTag(0, 0)

  canvas.addEventListener('mousemove', (e) => {
    const x = e.offsetX
    const y = e.offsetY
    tag.left = x
    tag.top = y
  })

  document.addEventListener('keydown', (e) => {
    const key = e.key
    if (key === 'w') {
      tag.scale = tag._scale + 0.1
    } else if (key === 's') {
      tag.scale = tag._scale - 0.1
    } else if (key === 'd') {
      tag.angle = tag._angle + 0.03
    } else if (key === 'a') {
      tag.angle = tag._angle - 0.03
    }
  })

  let raf = -1

  const render = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    renderScene(scene, ctx)
    raf = requestAnimationFrame(render)
  }

  raf = requestAnimationFrame(render)

  // const word = scene.words[4]

  // ctx.translate(100, 200)
  // word.draw(ctx)
  // renderHBounds(ctx, word.hBounds)
}

const renderScene = (scene: GeneratedScene, ctx: CanvasRenderingContext2D) => {
  ctx.save()
  for (let tag of scene.tags) {
    ctx.fillStyle = '#f002'
    ctx.fillRect(tag.bounds.x, tag.bounds.y, tag.bounds.w, tag.bounds.h)

    tag.draw(ctx)

    drawHBounds(ctx, tag.hBounds)
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

  addRandomTag = (x: number, y: number, scale = 1) => {
    if (this.words.length === 0) {
      throw new Error('No words added')
    }

    const id = (this.nextTagId += 1)
    const word = sample(this.words)!
    const tag = new Tag(id, word, x, y, scale)
    this.tags.push(tag)

    return tag
  }
}

export class Tag {
  word: Word
  _transform: Matrix | null = null
  id: number

  private _hBounds: HBounds | null = null

  /** left (X) coord of the center of the tag */
  _left: number = 0
  /** top (Y) coord of the center of the tag */
  _top: number = 0

  _angle: number = 0
  _scale: number = 1

  constructor(id: TagId, word: Word, x: number, y: number, scale = 1) {
    this.id = id
    this.word = word
    this._left = x
    this._top = y
    this._scale = scale
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

  set left(left: number) {
    this._left = left
    this._transform = null
    this._hBounds = null
  }

  set top(top: number) {
    this._top = top
    this._transform = null
    this._hBounds = null
  }

  set scale(scale: number) {
    this._scale = scale
    this._transform = null
    this._hBounds = null
  }

  set angle(angle: number) {
    this._angle = angle
    this._transform = null
    this._hBounds = null
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save()
    ctx.setTransform(this.transform)
    for (const [index, symbol] of this.word.symbols.entries()) {
      symbol.draw(ctx)
      ctx.translate(this.word.symbolOffsets[index], 0)
    }
    ctx.restore()
  }

  get hBounds(): HBounds {
    if (!this._hBounds) {
      this._hBounds = this._computeHBounds()
    }
    return this._hBounds
  }

  get bounds(): Rect {
    return transformRect(this.hBounds.transform, this.hBounds.bounds)
  }

  _computeHBounds = (): HBounds => {
    const wordHBounds = this.word.computeHBounds(this._angle, this._scale)
    wordHBounds.transform = compose(
      translate(this._left, this._top),
      // @ts-ignore
      scale(this._scale)
    )
    return wordHBounds
  }

  // getHBox = (): HBounds => {
  //   return this.word.hBounds
  // }
}

export class Word {
  id: number
  font: opentype.Font
  text: string
  symbols: Symbol[]
  symbolOffsets: number[]
  fontSize: number

  private _hBounds: HBounds | null = null

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

  get hBounds() {
    if (!this._hBounds) {
      let currentOffset = 0
      const symbolHBounds = this.symbols.map((s, index) => {
        const symbolHBounds = { ...s.hBounds }
        symbolHBounds.transform = compose(
          translate(currentOffset, 0),
          symbolHBounds.transform
        )
        currentOffset += this.symbolOffsets[index]
        return symbolHBounds
      })
      this._hBounds = mergeHBounds(symbolHBounds)
    }

    return this._hBounds
  }

  computeHBounds = (angle = 0, scaleFactor = 1) => {
    let currentOffset = 0

    const symbolHBounds = this.symbols.map((symbol, index) => {
      const symbolHBounds = symbol.computeHBounds(angle, scaleFactor)

      symbolHBounds.transform = compose(
        rotate(angle),
        translate(currentOffset, 0),
        rotate(-angle),
        symbolHBounds.transform,
        scale(1 / scaleFactor)
      )

      currentOffset += this.symbolOffsets[index]
      return symbolHBounds
    })

    return mergeHBounds(symbolHBounds)
  }

  get bounds() {
    return this.hBounds.bounds
  }
}

const drawHBounds = (ctx: CanvasRenderingContext2D, hBounds: HBounds) => {
  const drawHBoundsImpl = (hBounds: HBounds) => {
    ctx.save()
    ctx.lineWidth = 1
    ctx.strokeStyle = hBounds.children ? 'red' : 'yellow'

    ctx.transform(
      hBounds.transform.a,
      hBounds.transform.b,
      hBounds.transform.c,
      hBounds.transform.d,
      hBounds.transform.e,
      hBounds.transform.f
    )

    if (hBounds.overlapsShape) {
      ctx.strokeRect(
        hBounds.bounds.x,
        hBounds.bounds.y,
        hBounds.bounds.w,
        hBounds.bounds.h
      )
    }

    if (hBounds.children) {
      hBounds.children.forEach((child) => drawHBoundsImpl(child))
    }

    ctx.restore()
  }

  ctx.save()
  drawHBoundsImpl(hBounds)
  ctx.restore()
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
    this.glyph.getPath(0, 0, this.fontSize).draw(ctx)
  }

  computeHBounds(angle = 0, scaleFactor = 1): HBounds {
    const hBounds = computeHBoundsForPath(
      this.glyph.getPath(0, 0, this.fontSize),
      angle,
      scaleFactor
      // compose(rotate(angle), scale(scaleFactor))
    ).hBounds
    // hBounds.transform = compose(
    //   rotate(angle),
    //   hBounds.transform,
    //   scale(scaleFactor)
    // )
    return hBounds
  }

  get hBounds() {
    if (!this._hBounds) {
      this._hBounds = this.computeHBounds()
    }

    return this._hBounds
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

export const generateWordArt = (args: {
  font: opentype.Font
  viewBox: Rect
}): GeneratedScene => {
  const { font, viewBox } = args

  const scene = new GeneratedScene(font, viewBox)
  // const words = ['you', 'gre', 'awes', 'love', 'mea']
  const words = ['oooooooooo']
  for (let word of words) {
    scene.addWord(word)
  }

  // for (let i = 0; i < 100; ++i) {
  //   const x = Math.random() * viewBox.w
  //   const y = Math.random() * viewBox.h
  //   const scale = 0.2 + Math.random() * 2
  //   scene.addRandomTag(x, y, scale)
  // }

  return scene
}

export type Glyph = opentype.Glyph
export type Font = opentype.Font

export type WordId = number
export type TagId = number
export type SymbolId = string

// ---------------------
