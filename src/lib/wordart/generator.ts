import { Rect, multiply, transformRect, Point } from 'lib/wordart/geometry'
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
import {
  HBounds,
  computeHBoundsForCanvas,
  collideHBounds,
  drawHBounds,
  mergeHBounds,
  computeHBoundsForPath,
  randomPointInsideHbounds,
} from 'lib/wordart/hbounds'
import { sample } from 'lodash'
import { archimedeanSpiral } from 'lib/wordart/spirals'

export type GeneratorParams = {
  viewBox: Rect
  font: opentype.Font
}

type BgShapeInfo = {
  imgData: ImageData
  imgDataData: Uint8ClampedArray
  ctx: CanvasRenderingContext2D
  hBounds: HBounds
  hBoundsNagative: HBounds
}

export type WordConfig = {
  text: string
}

export type GenerateParams = {
  words: WordConfig[]
  debug?: {
    ctx: CanvasRenderingContext2D
    logWordPlacementImg: boolean
  }
  font: opentype.Font
  viewBox: Rect
  bgImageCtx: CanvasRenderingContext2D
  progressCallback?: (percentage: number) => void
}

export type GenerateHandle = {
  start: () => Promise<GenerationResult>
  cancel: () => void
}

export type GenerationResult = {
  status: 'finished' | 'cancelled'
}

/** Generates word art with hierarchical bounds (hbounds) approach */
export class SceneGenerator {
  params: GeneratorParams

  bgShape: BgShapeInfo | null = null
  nextWordId = 0
  words: Word[] = []
  symbols: Map<SymbolId, Symbol> = new Map()

  tags: Tag[] = []
  nextTagId = 0
  quad: Quadtree<Tag>
  _lastTagCollided: Tag | null = null
  _lastTagChecked: Tag | null = null

  constructor(params: GeneratorParams) {
    this.params = params
    this.quad = new Quadtree<Tag>({
      width: params.viewBox.w,
      height: params.viewBox.h,
    })
  }

  setBgShape = (ctx: CanvasRenderingContext2D) => {
    const hBoundsNagative = computeHBoundsForCanvas({
      srcCanvas: ctx.canvas,
      imgSize: 400,
      targetSize: this.params.viewBox,
      invert: true,
      angle: 0,
      minSize: 1,
      // visualize: true,
    }).hBounds

    const hBounds = computeHBoundsForCanvas({
      srcCanvas: ctx.canvas,
      imgSize: 400,
      targetSize: this.params.viewBox,
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

  addWord = (text: string) => {
    const id = (this.nextWordId += 1)

    const word = new Word(id, text, this.params.font)
    this.words.push(word)

    for (let symbol of word.symbols) {
      if (!this.symbols.has(symbol.id)) {
        this.symbols.set(symbol.id, symbol)
      }
    }
  }

  clearTags = () => {
    this.tags = []
    this.quad.clear()
  }

  removeTag = (tag: Tag) => {
    this.tags = this.tags.filter((t) => t === tag)
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

  generate = (params: GenerateParams): GenerateHandle => {
    let hasBeenCancelled = false

    const startGeneration = async (): Promise<GenerationResult> => {
      const { words, bgImageCtx, viewBox, debug } = params

      if (bgImageCtx) {
        this.setBgShape(bgImageCtx)
      }

      for (let word of words) {
        this.addWord(word.text)
      }

      // Precompute all hbounds
      const protoTags = [
        ...this.words.map((word) => new Tag(0, word, 0, 0, 1, 0)),
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

      const tryToPlaceTag = ({
        scale,
        maxAttempts = 50,
        padding = 0,
        enableSticky = false,
      }: {
        scale: number
        debug?: boolean
        maxAttempts?: number
        padding?: number
        enableSticky?: boolean
      }): boolean => {
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

          if (this.bgShape) {
            const p0 = randomPointInsideHbounds(this.bgShape.hBounds)
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

          if (debug) {
            const { ctx, logWordPlacementImg } = debug
            if (logWordPlacementImg) {
              ctx.clearRect(0, 0, viewBox.w, viewBox.h)
              ctx.fillStyle = '#f001'
              ctx.fillRect(0, 0, viewBox.w, viewBox.h)

              renderSceneDebug(this, ctx)

              ctx.fillStyle = 'green'
              ctx.fillRect(cx0, cy0, 10, 10)
              tag.left = cx0
              tag.top = cy0
              tag.draw(ctx)
            }
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
              if (!this.checkCollision(tag, padding)) {
                tag.fillStyle = sample(colors)!
                this.addTag(tag)

                if (debug) {
                  const { ctx, logWordPlacementImg } = debug
                  if (logWordPlacementImg) {
                    tag.draw(ctx)
                    console.screenshot(ctx.canvas, 0.4)
                  }
                }

                // console.log('attempt: ', attempt, 'iteration: ', iteration)
                placed = true
                break
              }
            }

            const spiralPoint = getSpiralPoint(t)
            t += getDt(iteration)

            cx =
              cx0 +
              (((spiralPoint.x * viewBox.w) / 2) * (2 - 1 * (1 - scale))) / 2
            cy =
              cy0 +
              (((spiralPoint.y * viewBox.h) / 2) * (2 - 1 * (1 - scale))) / 2

            if (debug) {
              const { ctx, logWordPlacementImg } = debug
              if (logWordPlacementImg) {
                ctx.fillStyle = 'red'
                ctx.fillRect(cx, cy, 5, 5)
              }
            }

            iteration += 1
          }

          if (debug) {
            const { ctx, logWordPlacementImg } = debug
            if (logWordPlacementImg) {
              console.screenshot(ctx.canvas, 0.3)
            }
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

      // @ts-ignore
      this.debugAddRandomTag = (
        scale: number,
        visualize = false,
        maxAttempts = 50
      ) => {
        if (!debug) {
          return
        }
        const { ctx, logWordPlacementImg } = debug
        if (!logWordPlacementImg) {
          return
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        renderSceneDebug(this, ctx)
        tryToPlaceTag({ scale, debug: visualize, maxAttempts })
      }

      const scaleFactor = 2

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
          const isPlaced = tryToPlaceTag({
            scale: scaleFactor * currentScale,
            maxAttempts: 20,
            padding: 40 * scaleFactor * currentScale,
            enableSticky: false,
            debug: false,
          })

          if (isPlaced) {
            placedCountAtCurrentScale += 1
            placedCountTotal += 1
            successCount += 1
          }

          if (hasBeenCancelled) {
            return {
              status: 'cancelled',
            }
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
            )}, ${placedCountAtCurrentScale} words in ${(
              (t1 - t0) /
              1000
            ).toFixed(2)} seconds`
          )
          placedCountAtCurrentScale = 0
          t0 = performance.now()

          await new Promise((resolve) => setTimeout(() => resolve(), 100))

          // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
          // renderScene(scene, ctx)
        }
      }

      return {
        status: 'finished',
      }
    }

    const cancelGeneration = () => {
      hasBeenCancelled = true
    }

    return {
      start: startGeneration,
      cancel: cancelGeneration,
    }
  }
}

export type GeneratedSceneInitParams = {
  viewBox: Rect
}

export class Tag {
  id: TagId
  word: Word
  _transform: Matrix | null = null

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

  copy = (): Tag =>
    new Tag(this.id, this.word, this._left, this._top, this._scale, this._angle)

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
          multiply(tm.rotate(this._angle), tm.translate(currentOffset)),
          tm.rotate(-this._angle)
        ),
        symbolHBounds.transform ? symbolHBounds.transform : identity()
      )

      currentOffset += this.word.symbolOffsets[index]
      return symbolHBounds
    })

    const wordHBounds = mergeHBounds(symbolHBounds)
    return wordHBounds
  }
}

// Perhaps it's not needed
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

export const renderSceneDebug = (
  generator: SceneGenerator,
  ctx: CanvasRenderingContext2D
) => {
  // @ts-ignore
  window['ctx'] = ctx
  ctx.save()

  if (generator.bgShape) {
    ctx.globalAlpha = 0.1
    ctx.drawImage(
      generator.bgShape.ctx.canvas,
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

  for (let tag of generator.tags) {
    // ctx.fillStyle = '#f002'
    // ctx.fillRect(tag.bounds.x, tag.bounds.y, tag.bounds.w, tag.bounds.h)

    tag.draw(ctx)

    // drawHBounds(ctx, tag.hBounds)
  }
  ctx.restore()
}
