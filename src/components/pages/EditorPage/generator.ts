import { WordConfigId } from 'components/pages/EditorPage/editor-page-store'
import { createCanvasCtx } from 'lib/wordart/canvas-utils'
import { CollisionDetectorWasm } from 'lib/wordart/wasm/collision-detector-wasm'
import { consoleLoggers } from 'utils/console-logger'
import {
  getWasmModule,
  HBoundsWasm,
  WasmModule,
} from 'lib/wordart/wasm/wasm-module'
import {
  Rect,
  multiply,
  aabbForRect,
  Point,
  randomPointInRect,
} from 'lib/wordart/geometry'
import { ShapeWasm } from 'lib/wordart/wasm/image-processor-wasm'
import { randomPointInsideHboundsSerialized } from 'lib/wordart/wasm/hbounds'
import * as tm from 'transformation-matrix'
import { Path } from 'opentype.js'
import { archimedeanSpiral } from 'components/pages/EditorPage/spirals'

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
      shape ? shape.hBoundsInverted : undefined
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

    const shapeHBoundsJs = shape ? shape.hBounds.get_js() : undefined

    const wordCurrentScales = words.map(() => task.itemScaleMax)
    const wordMaxScalePlaced = words.map(() => -1)
    const wordMinScale = task.itemScaleMin
    let timeout = 3000
    let maxCount = 1000

    let countPlaced = 0

    const tPrepEnd = performance.now()
    this.logger.debug(`Generator: ${(tPrepEnd - tStarted).toFixed(3)}ms`)

    const getPad = (
      bounds: Rect,
      countPlaced: number,
      scale: number,
      maxScalePlaced: number | undefined
    ) => {
      const minDim = Math.min(bounds.h, bounds.w) * scale
      let factor = 0.5
      if (maxScalePlaced != null && scale < maxScalePlaced * 0.5) {
        factor = 0.4
      }
      if (maxScalePlaced != null && scale < maxScalePlaced * 0.2) {
        factor = 0.2
      }
      const pad = minDim * factor
      const result = pad
      const resultAdjusted = (result * task.itemPadding) / 100
      return resultAdjusted
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
      const scaleStepFactor = 0.02
      const maxScaleStep = (task.itemScaleMax - task.itemScaleMin) / 30
      return scale - Math.min(maxScaleStep, scaleStepFactor * scale)
    }

    let start = performance.now()
    let currentTime = performance.now()

    let wordIndex = 0

    while (countPlaced < maxCount && currentTime - start <= timeout) {
      // console.log('countPlaced: ', countPlaced)
      const word = words[wordIndex]
      let currentScale = wordCurrentScales[wordIndex]
      const hboundsWord = this.wordHbounds.get(word.id)!

      let success = false

      const maxTries = 1
      let currentTry = 0
      while (!success && currentTry < maxTries) {
        // console.log('scale: ', word.text, currentScale)
        currentTry += 1

        // const paper = window['paper'] as paper.PaperScope
        // paper.project.clear()

        const spiralStep = 100
        const nRotations = Math.ceil(task.bounds.w / spiralStep)
        const spiral = archimedeanSpiral(nRotations)
        const maxSteps = 60
        const size = task.bounds.w
        // const p0 = new paper.Point(
        //   size / 2 + (size / 3) * (Math.random() - 0.5),
        //   task.bounds.h / 2 + (size / 3) * (Math.random() - 0.5)
        // )
        let p0 = shapeHBoundsJs
          ? randomPointInsideHboundsSerialized(shapeHBoundsJs)
          : randomPointInRect(
              task.bounds,
              task.fitWithinShape
                ? 0
                : Math.max(task.bounds.w * 0.1, task.bounds.h * 0.1, 100)
            )
        if (!p0) {
          p0 = {
            x: size / 2 + (size / 3) * (Math.random() - 0.5),
            y: task.bounds.h / 2 + (size / 3) * (Math.random() - 0.5),
          }
        }
        let curt = 0.01

        for (let i = 0; i < maxSteps; ++i) {
          const sp = new paper.Point(spiral(curt))

          curt += 3 / (curt * size) / nRotations

          const p = new paper.Point(p0).add(sp.multiply(2 * size))
          // const path = new paper.Path.Rectangle(p, p.add(new paper.Point(2, 2)))
          // path.fillColor = new paper.Color('blue')

          const bounds = wordBounds[wordIndex]

          const scaleRandomized =
            (currentScale + currentScale * (Math.random() - 0.5) * 2 * 0.3) *
            (1 - (0.8 * i) / maxSteps)

          const x = p.x - (bounds.w / 2) * scaleRandomized
          const y = p.y

          const padItem = getPad(
            bounds,
            countPlaced,
            scaleRandomized,
            wordMaxScalePlaced[wordIndex]
          )
          const padShape = task.shapePadding

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
            padItem,
            task.fitWithinShape
          )

          if (hasPlaced) {
            console.log('success', i, x, y, currentScale)
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
              shapeColor: shape ? shape.color : 'black',
              transform,
            })

            countPlaced++
            break
          }
        }

        if (getNextScale(currentScale) >= wordMinScale) {
          currentScale = getNextScale(currentScale)
        }

        // if (!success) {
        //   // console.log('currentScale', currentScale, getNextScale(currentScale))
        //   if (getNextScale(currentScale) >= wordMinScale) {
        //     currentScale = getNextScale(currentScale)
        //   }
        // } else {
        //   // console.log('success', i, currentScale)
        // }
      }

      wordCurrentScales[wordIndex] = currentScale

      wordIndex = (wordIndex + 1) % words.length
      currentTime = performance.now()
    }

    const tEnded = performance.now()
    this.logger.debug(
      `Generator: placed ${countPlaced} in ${(tEnded - tPrepEnd).toFixed(3)}ms`
    )

    console.log('addedItems', addedItems)

    return {
      items: addedItems,
    }
  }

  generateRandom = async (task: GenerateTask): Promise<GenerateResult> => {
    if (!this.wasm) {
      throw new Error('call init() first')
    }
    this.logger.debug('Generator: generate', task)
    const tStarted = performance.now()

    const shape = task.shape
    const collisionDetector = new CollisionDetectorWasm(
      this.wasm,
      task.bounds,
      shape ? shape.hBoundsInverted : undefined
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

    const shapeHBoundsJs = shape ? shape.hBounds.get_js() : undefined

    const wordCurrentScales = words.map(() => task.itemScaleMax)
    const wordMaxScalePlaced = words.map(() => -1)
    const wordMinScale = task.itemScaleMin
    let timeout = 3000
    let maxCount = 500

    let countPlaced = 0

    const tPrepEnd = performance.now()
    this.logger.debug(`Generator: ${(tPrepEnd - tStarted).toFixed(3)}ms`)

    const getPad = (
      bounds: Rect,
      countPlaced: number,
      scale: number,
      maxScalePlaced: number | undefined
    ) => {
      const minDim = Math.min(bounds.h, bounds.w) * scale
      let factor = 0.5
      if (maxScalePlaced != null && scale < maxScalePlaced * 0.5) {
        factor = 0.4
      }
      if (maxScalePlaced != null && scale < maxScalePlaced * 0.2) {
        factor = 0.2
      }
      const pad = minDim * factor
      const result = pad
      const resultAdjusted = (result * task.itemPadding) / 100
      return resultAdjusted
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
      const scaleStepFactor = 0.02
      const maxScaleStep = (task.itemScaleMax - task.itemScaleMin) / 30
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
      const maxTries = 30
      let currentTry = 0
      while (!success && currentTry < maxTries) {
        // console.log('scale: ', word.text, scalesTried, currentScale)
        currentTry += 1

        const batchSize = getBatchSize(countPlaced, maxCount)
        let i = 0

        for (i = 0; i < batchSize; ++i) {
          const hboundsWord = this.wordHbounds.get(word.id)
          if (!hboundsWord) {
            throw new Error(`No hbounds for word ${word.id}`)
          }

          const p = shapeHBoundsJs
            ? randomPointInsideHboundsSerialized(shapeHBoundsJs)
            : randomPointInRect(
                task.bounds,
                task.fitWithinShape
                  ? 0
                  : Math.max(task.bounds.w * 0.1, task.bounds.h * 0.1, 100)
              )
          if (!p) {
            continue
          }

          const bounds = wordBounds[wordIndex]

          const scaleRandomized =
            currentScale + currentScale * (Math.random() - 0.5) * 2 * 0.3

          // const fontHeight =
          //   (word.font.getPath(word.text, 0, 0, word.fontSize).getBoundingBox()
          //     .y2 -
          //     word.font.getPath(word.text, 0, 0, word.fontSize).getBoundingBox()
          //       .y1) *
          //   currentScale
          // console.log('fontHeight = ', fontHeight)
          const cx = p.x - (bounds.w / 2) * scaleRandomized
          const cy = p.y // - word.fontSize * currentScale // - (bounds.h / 2) * currentScale

          const x = cx
          const y = cy

          const padItem = getPad(
            bounds,
            countPlaced,
            scaleRandomized,
            wordMaxScalePlaced[wordIndex]
          )
          const padShape = task.shapePadding

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
            padItem,
            task.fitWithinShape
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
              shapeColor: shape ? shape.color : 'black',
              transform: transform,
            })

            countPlaced++
            break
          }
        }

        if (!success) {
          // console.log('currentScale', currentScale, getNextScale(currentScale))
          if (getNextScale(currentScale) >= wordMinScale) {
            currentScale = getNextScale(currentScale)
            scalesTried += 1
          }
        } else {
          // console.log('success', i, currentScale)
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
  shape: ShapeWasm | null
  /** Padding between shape or bounds and items, in units (?) */
  shapePadding: number
  /** Padding between items, in percent (0 - 100) */
  itemPadding: number
  /** 1 by default */
  itemScaleMin: number
  itemScaleMax: number
  /** Words to use */
  words: GenerateTaskWord[]
  placementAlgorithm: PlacementAlgorithm
  fitWithinShape: boolean
}

export type PlacementAlgorithm = 'random' | 'wordle'

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
