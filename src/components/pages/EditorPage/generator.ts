import { WordConfigId } from 'components/pages/EditorPage/editor-page-store'
import {
  Dimensions,
  loadImageUrlToCanvasCtx,
  createCanvasCtx,
  removeImageOpacity,
} from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import { getWasmModule, WasmModule } from 'lib/wordart/wasm/wasm-module'
import { Rect, Point } from 'lib/wordart/geometry'
import {
  ShapeWasm,
  ImageProcessorWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import * as tm from 'transformation-matrix'
import { Path } from 'opentype.js'

const FONT_SIZE = 100

export class Generator {
  logger = consoleLoggers.generator

  words: Map<WordId, Word> = new Map()
  wordPaths: Map<WordId, Path> = new Map()
  wasm?: WasmModule

  constructor() {}

  init = async () => {
    this.wasm = await getWasmModule()
  }

  items: Item[] = []

  clear = () => {
    this.items = []
  }

  fillShape = async (task: FillShapeTask): Promise<FillShapeTaskResult> => {
    if (!this.wasm) {
      throw new Error('call init() first')
    }
    this.logger.debug('Generator: generate', task)

    const shapeCanvasSize = 360
    // const shapeCanvasMaxPixelCount = shapeCanvasSize * shapeCanvasSize

    const shapeCanvas = task.shape.canvas
    const shapeCanvasScale =
      shapeCanvasSize / Math.max(shapeCanvas.width, shapeCanvas.height)
    // const shapePixelsCount = shapeCanvas.width * shapeCanvas.height
    // const shapeCanvasScale = Math.sqrt(
    //   shapeCanvasMaxPixelCount / shapePixelsCount
    // )

    const shapeCanvasDimensions: Dimensions = {
      w: Math.floor(shapeCanvasScale * shapeCanvas.width),
      h: Math.floor(shapeCanvasScale * shapeCanvas.height),
    }

    const shapeCtx = createCanvasCtx(shapeCanvasDimensions)
    shapeCtx.drawImage(
      shapeCanvas,
      0,
      0,
      shapeCanvas.width,
      shapeCanvas.height,
      0,
      0,
      shapeCtx.canvas.width,
      shapeCtx.canvas.height
    )
    removeImageOpacity(shapeCtx.canvas)

    const imageProcessor = new ImageProcessorWasm(this.wasm)

    const words = task.words.map(
      (word, index) =>
        new Word(`${index}`, word.wordConfigId, word.text, word.fonts[0])
    )
    const wordPaths = words.map((word) =>
      word.font.getPath(word.text, 0, 0, 100)
    )
    const wordPathsBounds = wordPaths.map((wordPath) =>
      wordPath.getBoundingBox()
    )

    const placedWords: WordItem[] = []

    const nIter = 400
    const t1 = performance.now()

    let wordIndex = 0

    for (let i = 0; i < nIter; ++i) {
      const word = words[wordIndex]

      const wordPathBounds = wordPathsBounds[wordIndex]
      const wordPath = wordPaths[wordIndex]

      let scale = 1 - (0.5 * i) / nIter
      // let size = 60
      // if (i < 100) {
      //   size = 150
      // }
      // if (i < 200) {
      //   size = 220
      // }
      // if (i < 300) {
      //   size = 300
      // } else {
      //   size = 360
      // }
      let scratchCanvasDimensions = shapeCanvasDimensions
      const scratchCtx = createCanvasCtx(scratchCanvasDimensions)
      scratchCtx.drawImage(
        shapeCtx.canvas,
        0,
        0,
        shapeCanvasDimensions.w,
        shapeCanvasDimensions.h,
        0,
        0,
        scratchCanvasDimensions.w,
        scratchCanvasDimensions.h
      )

      const scratchImgData = shapeCtx.getImageData(
        0,
        0,
        scratchCanvasDimensions.w,
        scratchCanvasDimensions.h
      )
      // shapeCtx.imageSmoothingEnabled = false
      const scratchCanvasBounds: Rect = {
        x: 0,
        y: 0,
        w: scratchCanvasDimensions.w,
        h: scratchCanvasDimensions.h,
      }
      const largestRect = imageProcessor.findLargestRect(
        scratchImgData,
        scratchCanvasBounds
      )

      const wordPathSize: Dimensions = {
        w: wordPathBounds.x2 - wordPathBounds.x1,
        h: wordPathBounds.y2 - wordPathBounds.y1,
      }
      // const largestRect = getLargestRect(imgData, imgDataBounds)
      // console.log(largestRect, getLargestRect(imgData, imgDataBounds))

      let pathScale = Math.min(
        (largestRect.w / wordPathSize.w) * scale,
        (largestRect.h / wordPathSize.h) * scale
      )

      const maxMinDim = 60
      const minDim = Math.min(wordPathSize.w, wordPathSize.h) * pathScale
      if (minDim > maxMinDim) {
        pathScale *= maxMinDim / minDim
      }

      const dx = Math.max(largestRect.w - pathScale * wordPathSize.w, 0)
      const dy = Math.max(largestRect.h - pathScale * wordPathSize.h, 0)

      shapeCtx.save()

      shapeCtx.fillStyle = 'black'
      shapeCtx.globalCompositeOperation = 'destination-out'

      const tx = largestRect.x + Math.random() * dx
      const ty =
        largestRect.y +
        largestRect.h -
        pathScale * wordPathBounds.y2 -
        Math.random() * dy
      shapeCtx.scale(
        shapeCanvasDimensions.w / scratchCanvasDimensions.w,
        shapeCanvasDimensions.h / scratchCanvasDimensions.h
      )
      shapeCtx.translate(tx, ty)
      shapeCtx.scale(pathScale, pathScale)

      if (pathScale * Math.max(largestRect.w, largestRect.h) >= 0.25) {
        if (task.itemPadding > 0) {
          shapeCtx.shadowBlur =
            (task.itemPadding / 100) * (shapeCanvasSize / 100)
          shapeCtx.shadowColor = 'red'
        }
        wordPath.draw(shapeCtx)

        placedWords.push({
          wordPath,
          id: i,
          kind: 'word',
          shapeColor: 'black',
          word,
          transform: tm.compose(
            tm.translate(task.shape.bounds.left, task.shape.bounds.top),
            tm.scale(
              task.shape.bounds.width / shapeCanvasDimensions.w,
              task.shape.bounds.height / shapeCanvasDimensions.h
            ),
            tm.scale(
              scratchCanvasDimensions.w / shapeCanvasDimensions.w,
              scratchCanvasDimensions.h / shapeCanvasDimensions.h
            ),
            tm.translate(tx, ty),
            tm.scale(pathScale)
          ),
        })
      } else {
        // console.log('i', i)
        shapeCtx.fillRect(
          wordPathBounds.x1,
          wordPathBounds.y1,
          wordPathBounds.x2 - wordPathBounds.x1,
          wordPathBounds.y2 - wordPathBounds.y1
        )
      }
      // shapeCtx.fillRect(...spreadRect(largestRect))

      shapeCtx.restore()

      wordIndex = (wordIndex + 1) % words.length
    }
    const t2 = performance.now()

    console.screenshot(shapeCtx.canvas, 1)
    console.log(
      `Placed ${placedWords.length} words; Finished ${nIter} iterations in ${(
        (t2 - t1) /
        1000
      ).toFixed(2)} s, ${((t2 - t1) / nIter).toFixed(3)}ms / iter`
    )

    return {
      items: placedWords,
    }
  }
}

/** Describes a task of filling a shape with items (usually words) */
export type FillShapeTask = {
  shape: {
    canvas: HTMLCanvasElement
    bounds: paper.Rectangle
  }
  /** Padding between shape and items, in percent (0 - 100) */
  shapePadding: number
  /** Padding between items, in percent (0 - 100) */
  itemPadding: number
  /** Words to use */
  words: FillShapeTaskWordConfig[]
}

export type FillShapeTaskWordConfig = {
  wordConfigId: WordConfigId
  text: string
  /** Rotation angles in degrees */
  angles: number[]
  /** Fonts to use */
  fonts: Font[]
}

export type FillShapeTaskResult = {
  items: Item[]
}

export type Item = ImageItem | WordItem

export type ImageItem = {
  kind: 'img'
  id: ItemId
  ctx: CanvasRenderingContext2D
  transform: tm.Matrix
}

export type WordItem = {
  kind: 'word'
  id: ItemId
  word: Word
  transform: tm.Matrix
  /** Color of the shape at the given location */
  shapeColor: string
  wordPath: Path
}

export type ItemId = number

// Perhaps it's not needed
export class Word {
  id: WordId
  wordConfigId: WordConfigId
  font: opentype.Font
  text: string
  symbols: Symbol[]
  symbolOffsets: number[]
  fontSize: number
  angle: number

  constructor(
    id: WordId,
    wordConfigId: WordConfigId,
    text: string,
    font: Font,
    angle = 0,
    fontSize = FONT_SIZE
  ) {
    this.id = id
    this.wordConfigId = wordConfigId
    this.font = font
    this.text = text
    this.fontSize = fontSize
    this.angle = angle
    this.symbols = stringToSymbols(text, font, angle, fontSize)

    this.symbolOffsets = this.symbols.map(
      (symbol) => (fontSize * symbol.glyph.advanceWidth) / this.font.unitsPerEm
    )
  }

  getSymbolPaths = (): Path[] => {
    const paths: Path[] = []
    let currentOffset = 0
    for (let i = 0; i < this.symbols.length; ++i) {
      paths.push(this.symbols[i].glyph.getPath(currentOffset, 0, this.fontSize))
      currentOffset += this.symbolOffsets[i]
    }
    return paths
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
  angle: number

  getPathData = (): string =>
    this.glyph.getPath(0, 0, this.fontSize).toPathData(3)

  constructor(font: Font, glyph: Glyph, angle = 0, fontSize = FONT_SIZE) {
    this.font = font
    this.fontSize = fontSize
    this.angle = angle
    this.id = getSymbolAngleId(glyph, font)
    this.glyph = glyph
  }

  draw = (ctx: CanvasRenderingContext2D) => {
    const path = this.glyph.getPath(0, 0, this.fontSize)
    // @ts-ignore
    path.fill = ctx.fillStyle
    path.draw(ctx)
  }
}

export const getFontName = (font: Font): string => font.names.fullName.en

export const getSymbolId = (glyph: Glyph, font: Font): SymbolId =>
  // @ts-ignore
  `${getFontName(font)}.${glyph.index}`

export const getSymbolAngleId = (
  glyph: Glyph,
  font: Font,
  angle = 0
): SymbolAngleId =>
  // @ts-ignore
  `${getFontName(font)}.${glyph.index}.${angle}`

export const getWordAngleId = (
  text: string,
  font: Font,
  angle = 0
): SymbolAngleId =>
  // @ts-ignore
  `${getFontName(font)}.${angle}.${text}`

export const stringToSymbols = (
  text: string,
  font: Font,
  angle: number,
  fontSize: number = FONT_SIZE
): Symbol[] =>
  font
    .stringToGlyphs(text)
    .map((otGlyph) => new Symbol(font, otGlyph, angle, fontSize))

export type Glyph = opentype.Glyph
export type Font = opentype.Font

export type WordId = string
export type SymbolId = string
export type SymbolAngleId = string
