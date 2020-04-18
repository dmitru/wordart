import {
  Rect,
  collideHBounds,
  HBounds,
  multiply,
  drawHBounds,
  transformRect,
  mergeHBounds,
  computeHBoundsForPath,
  computeHBoundsForCanvas,
} from 'lib/wordart/geometry'
import Quadtree from 'quadtree-lib'
import * as tm from 'transformation-matrix'
import {
  Matrix,
  translate,
  rotate,
  scale,
  identity,
} from 'transformation-matrix'
import chroma from 'chroma-js'

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

  bgShape: {
    imgData: ImageData
    imgDataData: Uint8ClampedArray
    ctx: CanvasRenderingContext2D
    hBounds: HBounds
    hBoundsNagative: HBounds
  } | null = null

  constructor(font: Font, viewBox: Rect) {
    this.font = font
    this.viewBox = viewBox
    this.quad = new Quadtree<Tag>({ width: viewBox.w, height: viewBox.h })
  }

  setBgShape = (ctx: CanvasRenderingContext2D) => {
    const hBoundsNagative = computeHBoundsForCanvas({
      srcCanvas: ctx.canvas,
      imgSize: 400,
      targetSize: this.viewBox,
      invert: true,
      angle: 0,
      minSize: 1,
      // visualize: true,
    }).hBounds

    const hBounds = computeHBoundsForCanvas({
      srcCanvas: ctx.canvas,
      imgSize: 400,
      targetSize: this.viewBox,
      angle: 0,
      minSize: 1,
      // visualize: true,
    }).hBounds

    const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

    this.bgShape = {
      ctx,
      hBoundsNagative,
      hBounds,
      imgData,
      imgDataData: imgData.data,
    }
  }

  clearTags = () => {
    this.tags = []
    this.quad.clear()
    this._lastTagCollided = null
    this._lastTagChecked = null
  }

  addWord = (text: string) => {
    const id = (this.nextWordId += 1)

    const word = new Word(id, text, this.font)
    this.words.push(word)

    for (let symbol of word.symbols) {
      if (!this.symbols.has(symbol.id)) {
        this.symbols.set(symbol.id, symbol)
      }
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
    const minSize = 2

    const bgShapePadding = 1

    if (this.bgShape) {
      if (
        collideHBounds(
          this.bgShape.hBoundsNagative,
          tag.hBounds,
          bgShapePadding,
          0,
          7,
          getTagMaxLevel(tag),
          1
          // true
        )
      ) {
        return true
      }
    }

    const candidateTags = this.quad.colliding({
      x: tag.bounds.x - padding,
      y: tag.bounds.y - padding,
      width: tag.bounds.w + 2 * padding,
      height: tag.bounds.h + 2 * padding,
    })

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

    if (this.bgShape) {
      // sample bg shape for tag color
      const index =
        Math.round(tag.y - tag.bounds.h / 2) * this.bgShape.ctx.canvas.width +
        Math.round(tag.x + tag.bounds.w / 2)

      const r = this.bgShape.imgDataData[4 * index]
      const g = this.bgShape.imgDataData[4 * index + 1]
      const b = this.bgShape.imgDataData[4 * index + 2]
      const color = chroma(r, g, b).hex()
      addedTag.fillStyle = color
    }
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
