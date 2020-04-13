import * as opentype from 'opentype.js'
import 'lib/wordart/console-extensions'
import {
  Rect,
  computeHBounds,
  renderHBounds,
  Transform,
  HBounds,
  mkTransform,
  mergeHBounds,
} from 'lib/wordart/geometry'
import { sample } from 'lodash'

export const scratch = async (canvas: HTMLCanvasElement) => {
  const font = await loadFont('/fonts/mail-ray-stuff.ttf')
  console.log('font = ', font)
  // @ts-ignore
  window['font'] = font

  const ctx = canvas.getContext('2d')!

  // Build hierarchical bounding boxes
  // const path1 = font.getPath('OUT', 100, 520, 590)
  // const hBounds1 = computeHBoundsForPath(path1).hBounds

  // path1.draw(ctx)
  // renderHBounds(ctx, hBounds1)

  const viewBox: Rect = { x: 0, y: 0, w: canvas.width, h: canvas.height }
  const scene = generateWordArt({ font, viewBox })
  console.log(scene)

  for (let symbol of scene.symbols.values()) {
    console.log(symbol.hBounds)
  }

  const word = scene.words[4]

  ctx.translate(0, 200)
  word.draw(ctx)
  renderHBounds(ctx, word.hBounds)

  // renderScene(scene)
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
  }
}

export class Tag {
  word: Word
  transform: Transform
  id: number

  constructor(id: TagId, word: Word, x: number, y: number, scale = 1) {
    this.id = id
    this.word = word
    this.transform = mkTransform(x, y, scale)
  }

  // getHBox = (): HBounds => {
  //   return mergeHBounds()
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
      this._hBounds = mergeHBounds(this.symbols.map((s) => s.hBounds))
    }

    return this._hBounds
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
    this.glyph.getPath(0, 0, this.fontSize).draw(ctx)
  }

  get hBounds() {
    if (!this._hBounds) {
      this._hBounds = computeHBoundsForPath(
        this.glyph.getPath(0, 0, this.fontSize)
      ).hBounds
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
  const words = ['you', 'great', 'awesome', 'love', 'universe', 'meaning']
  for (let word of words) {
    scene.addWord(word)
  }

  for (let i = 0; i < 100; ++i) {
    const x = Math.random() * viewBox.w
    const y = Math.random() * viewBox.h
    const scale = 0.2 + Math.random() * 2
    scene.addRandomTag(x, y, scale)
  }

  return scene
}

export type Glyph = opentype.Glyph
export type Font = opentype.Font

export type WordId = number
export type TagId = number
export type SymbolId = string

// ---------------------

export const computeHBoundsForPath = (path: opentype.Path) => {
  const pathBbox = path.getBoundingBox()

  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = pathBbox.x2 - pathBbox.x1
  canvas.height = pathBbox.y2 - pathBbox.y1

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.translate(-pathBbox.x1, -pathBbox.y1)

  path.draw(ctx)
  console.screenshot(ctx.canvas)

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

  const isPointIntersecting = (x: number, y: number): boolean => {
    const index = Math.round(y) * imageData.width + Math.round(x)
    return imageData.data[4 * index + 3] > 0
  }

  const isRectIntersecting = (
    bounds: Rect,
    dx = 2
  ): 'full' | 'partial' | 'none' => {
    const maxX = bounds.x + bounds.w
    const maxY = bounds.y + bounds.h

    let checked = 0
    let overlapping = 0

    for (let x = Math.ceil(bounds.x); x < Math.floor(maxX); x += dx) {
      for (let y = Math.ceil(bounds.y); y < Math.floor(maxY); y += dx) {
        const intersecting = isPointIntersecting(x, y)
        if (intersecting) {
          overlapping += 1
        }
        checked += 1
      }
    }

    if (overlapping === 0) {
      return 'none'
    }

    return checked === overlapping ? 'full' : 'partial'
  }

  const bounds: Rect = {
    x: 0,
    y: 0,
    w: pathBbox.x2 - pathBbox.x1,
    h: pathBbox.y2 - pathBbox.y1,
  }
  const hBounds = computeHBounds(bounds, isRectIntersecting)

  hBounds.transform = { x: pathBbox.x1, y: pathBbox.y1, scale: 1 }

  return { hBounds }
}

export const loadFont = (path: string): Promise<opentype.Font> =>
  new Promise<opentype.Font>((resolve, reject) =>
    opentype.load(path, (error, font) => {
      if (!font || error) {
        reject(error || new Error('Failed to load font'))
        return
      }
      resolve(font)
    })
  )
