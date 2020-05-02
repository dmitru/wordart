import { WordConfigId } from 'components/pages/EditorPage/editor-page-store'
import { createCanvasCtx } from 'lib/wordart/canvas-utils'
import { CollisionDetectorWasm } from 'lib/wordart/wasm/collision-detector-wasm'
import { consoleLoggers } from 'utils/console-logger'
import {
  getWasmModule,
  HBoundsWasm,
  WasmModule,
} from 'lib/wordart/wasm/wasm-module'
import { Rect, multiply, aabbForRect } from 'lib/wordart/geometry'
import { ShapeWasm } from 'lib/wordart/wasm/image-processor-wasm'
import { randomPointInsideHboundsSerialized } from 'lib/wordart/wasm/hbounds'
import * as tm from 'transformation-matrix'
import { Path } from 'opentype.js'

const FONT_SIZE = 100

export class Generator {
  logger = consoleLoggers.generator

  words: Map<WordId, Word> = new Map()
  symbolHbounds: Map<SymbolAngleId, HBoundsWasm> = new Map()
  wordHbounds: Map<WordId, HBoundsWasm> = new Map()
  wordPaths: Map<WordId, Path> = new Map()
  symbols: Map<SymbolId, Symbol> = new Map()
  wasm?: WasmModule

  constructor() {}

  init = async () => {
    this.wasm = await getWasmModule()
  }

  items: Item[] = []

  clear = () => {
    this.items = []
  }

  processWord = async (
    wordConfigId: WordConfigId,
    text: string,
    font: Font,
    angle = 0
  ) => {
    if (!this.wasm) {
      throw new Error('call init() first')
    }
    const wordId = getWordAngleId(text, font, angle)
    const word = new Word(wordId, wordConfigId, text, font, angle)

    const wordPath = word.font.getPath(word.text, 0, 0, FONT_SIZE)
    const wordHbounds = await this.computeHboundsForPath(wordPath, angle)
    this.wordPaths.set(wordId, wordPath)
    this.wordHbounds.set(wordId, wordHbounds)

    return word
  }

  generate = async (task: GenerateTask): Promise<GenerateResult> => {
    if (!this.wasm) {
      throw new Error('call init() first')
    }
    this.logger.debug('Generator: generate', task)
    const tStarted = performance.now()

    const shape = task.shape
    const collisionDetector = new CollisionDetectorWasm(
      this.wasm,
      task.bounds,
      shape.hBoundsInverted
    )

    const t1 = performance.now()
    const words: Word[] = []
    for (const wordItem of task.words) {
      for (const font of wordItem.fonts) {
        for (const angle of wordItem.angles) {
          this.logger.debug(
            `Processing word ${wordItem.text}, font ${getFontName(
              font
            )}, angle: ${angle}`
          )
          const word = await this.processWord(
            wordItem.wordConfigId,
            wordItem.text,
            font,
            angle
          )
          words.push(word)
        }
      }
    }

    const wordBounds = words.map((word) =>
      this.wordHbounds.get(word.id)!.get_bounds()
    )

    const t2 = performance.now()

    this.logger.debug(
      `Processed ${words.length} words: ${(t2 - t1).toFixed(2)}ms`
    )

    let currentItemId = 1
    let addedItems: Item[] = []
    let addedHbounds: any[] = []

    const shapeHBoundsJs = shape.hBounds.get_js()

    const wordCurrentScales = words.map(() => 1)
    const wordMaxScalePlaced = words.map(() => -1)
    const wordMinScale = 0.02
    let timeout = 1500
    let maxCount = 800

    let countPlaced = 0

    const tPrepEnd = performance.now()
    this.logger.debug(`Generator: ${(tPrepEnd - tStarted).toFixed(3)}ms`)

    const getPad = (
      bounds: Rect,
      countPlaced: number,
      scale: number,
      maxScalePlaced: number | undefined
    ) => {
      // return 0
      const minDim = Math.min(bounds.h, bounds.w) * scale
      let factor = 0.2
      if (maxScalePlaced != null && scale < maxScalePlaced * 0.5) {
        factor = 0.2
      }
      if (maxScalePlaced != null && scale < maxScalePlaced * 0.2) {
        factor = 0.1
      }
      if (maxScalePlaced != null && scale < maxScalePlaced * 0.1) {
        factor = 0.05
      }
      if (countPlaced > 100) {
        factor = 0.02
      }
      const pad = minDim * factor
      return pad > 0.2 ? pad : 0.2
    }

    const getBatchSize = (countPlaced: number, maxCount: number) => {
      if (countPlaced < Math.max(0.05 * maxCount, 30)) {
        return 20
      }
      if (countPlaced < 0.2 * maxCount) {
        return 10
      }
      return 10
    }

    const getNextScale = (scale: number): number => {
      const scaleStepFactor = 0.03
      const maxScaleStep = 0.03
      return scale - Math.min(maxScaleStep, scaleStepFactor * scale)
    }

    let start = performance.now()
    let currentTime = performance.now()

    let wordIndex = 0

    while (countPlaced < maxCount && currentTime - start <= timeout) {
      const word = words[wordIndex]
      let currentScale = wordCurrentScales[wordIndex]

      let success = false

      // Try to place the word at the current scale
      let scalesTried = 0
      while (!success && currentScale >= wordMinScale) {
        // console.log('scale: ', word.text, scalesTried, currentScale)

        const batchSize = getBatchSize(countPlaced, maxCount)
        let i = 0

        for (i = 0; i < batchSize; ++i) {
          const hboundsWord = this.wordHbounds.get(word.id)
          if (!hboundsWord) {
            throw new Error(`No hbounds for word ${word.id}`)
          }

          const p = randomPointInsideHboundsSerialized(shapeHBoundsJs)
          if (!p) {
            continue
          }

          const bounds = wordBounds[wordIndex]

          const cx = p.x - (bounds.w / 2) * currentScale
          const cy = p.y + (bounds.h / 2) * currentScale

          // debugCtx.fillStyle = 'red'
          // debugCtx.fillRect(cx, cy, 2, 2)

          const x = cx
          const y = cy

          const scaleRandomized =
            currentScale + currentScale * (Math.random() - 0.5) * 2 * 0.1

          const padItem = getPad(
            bounds,
            countPlaced,
            currentScale,
            wordMaxScalePlaced[wordIndex]
          )
          const padShape = 5

          const transform: tm.Matrix = multiply(
            tm.translate(x, y),
            tm.scale(scaleRandomized)
          )
          const transformWasm = new this.wasm.Matrix()
          transformWasm.set_mut(
            transform.a,
            transform.b,
            transform.c,
            transform.d,
            transform.e,
            transform.f
          )

          const hasPlaced = collisionDetector.addItem(
            hboundsWord,
            transformWasm,
            padShape,
            padItem
          )

          if (hasPlaced) {
            if (wordMaxScalePlaced[wordIndex] == null) {
              wordMaxScalePlaced[wordIndex] = currentScale
            }

            success = true
            addedHbounds.push({
              hboundsWord,
              transform,
            })

            addedItems.push({
              kind: 'word',
              id: currentItemId++,
              word,
              wordPath: this.wordPaths.get(word.id)!,
              shapeColor: shape.color,
              transform: transform,
            })

            countPlaced++
            break
          }
        }

        if (!success) {
          currentScale = getNextScale(currentScale)
          scalesTried += 1
        } else {
          console.log('success', i, currentScale)
        }
      }

      wordCurrentScales[wordIndex] = currentScale

      wordIndex = (wordIndex + 1) % words.length
      currentTime = performance.now()
    }

    const tEnded = performance.now()
    this.logger.debug(
      `Generator: placed ${countPlaced} in ${(tEnded - tPrepEnd).toFixed(3)}ms`
    )

    return {
      items: addedItems,
    }
  }

  computeHboundsForPath = async (
    path: Path,
    angle = 0
  ): Promise<HBoundsWasm> => {
    if (!this.wasm) {
      throw new Error('wasm not initialized')
    }

    this.logger.debug('computeHboundsForPath: ')

    const pathScale = 1
    const imgSize = 100

    const pathBbox = path.getBoundingBox()
    const pathBboxRect = {
      x: pathBbox.x1,
      y: pathBbox.y1,
      w: pathBbox.x2 - pathBbox.x1,
      h: pathBbox.y2 - pathBbox.y1,
    }

    const pathAaabUnscaled = aabbForRect(
      multiply(tm.rotate(angle), tm.scale(pathScale)),
      pathBboxRect
    )
    const pathAaabScaleFactor =
      imgSize / Math.max(pathAaabUnscaled.w, pathAaabUnscaled.h)
    const pathAaab = aabbForRect(
      multiply(tm.rotate(angle), tm.scale(pathScale * pathAaabScaleFactor)),
      pathBboxRect
    )

    const scaleFactor = pathScale * pathAaabScaleFactor

    const pathAaabTransform = multiply(
      multiply(tm.translate(-pathAaab.x, -pathAaab.y), tm.rotate(angle)),
      tm.scale(scaleFactor)
    )

    const canvas = document.createElement('canvas') as HTMLCanvasElement
    canvas.width = pathAaab.w
    canvas.height = pathAaab.h
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.save()
    ctx.setTransform(pathAaabTransform)
    path.draw(ctx)
    ctx.restore()

    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    )

    const hboundsWasm = this.wasm.create_hbounds(
      new Uint32Array(imageData.data.buffer),
      canvas.width,
      canvas.height,
      false
    )

    const hboundsWasmTransform = multiply(
      tm.scale(1 / pathAaabScaleFactor),
      tm.translate(pathAaab.x, pathAaab.y)
    )

    hboundsWasm.set_transform(
      hboundsWasmTransform.a,
      hboundsWasmTransform.b,
      hboundsWasmTransform.c,
      hboundsWasmTransform.d,
      hboundsWasmTransform.e,
      hboundsWasmTransform.f
    )

    return hboundsWasm
  }
}

/** Describes a task of filling a shape with items (usually words) */
export type GenerateTask = {
  /** Bounds of the task, should include the shape */
  bounds: Rect
  /** Shape to fill */
  // TODO: consider adding an ID to shapes
  shape: ShapeWasm
  /** Words to use */
  words: GenerateTaskWord[]
}

export type GenerateTaskWord = {
  wordConfigId: WordConfigId
  text: string
  /** Rotation angles in degrees */
  angles: number[]
  /** Fonts to use */
  fonts: Font[]
  fillColors: string[]
}

export type GenerateResult = {
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
