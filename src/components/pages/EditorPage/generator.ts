import {
  EditorPageStore,
  WordConfig,
  WordConfigId,
} from 'components/pages/EditorPage/editor-page-store'
import {
  loadImageUrlToCanvasCtx,
  clearCanvas,
  createCanvasCtx,
} from 'lib/wordart/canvas-utils'
import { fabric } from 'fabric'
import { CollisionDetectorWasm } from 'lib/wordart/wasm/collision-detector-wasm'
import { consoleLoggers } from 'utils/console-logger'
import {
  getWasmModule,
  HBoundsWasm,
  WasmModule,
} from 'lib/wordart/wasm/wasm-module'
import { Rect, multiply, aabbForRect } from 'lib/wordart/geometry'
import {
  ImageProcessorWasm,
  ShapeWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import {
  randomPointInsideHboundsSerialized,
  drawHBoundsWasm,
} from 'lib/wordart/wasm/hbounds'
import * as tm from 'transformation-matrix'
import { sleep } from 'utils/async'
import { Path } from 'opentype.js'
import { sample } from 'lodash'
import {
  hBoundsWasmSerializedToPaperGroup,
  matrixToPaperTransform,
} from 'components/pages/EditorPage/paper-utils'
import { Editor } from 'components/pages/EditorPage/editor'
import { compose } from 'transformation-matrix'

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

    // for (const symbol of word.symbols) {
    //   this.logger.debug(
    //     `processWord: processing "${symbol.glyph.name}", font: ${getFontName(
    //       font
    //     )}, angle: ${angle}`
    //   )
    //   if (!this.symbols.has(symbol.id)) {
    //     this.symbols.set(symbol.id, symbol)
    //   }
    //   const symbolAngleId = getSymbolAngleId(symbol.glyph, font, angle)
    //   if (!this.symbolHbounds.has(symbolAngleId)) {
    //     const wordPath = symbol.font.getPath(word.text, 0, 0, FONT_SIZE)
    //     const hbounds = await this.computeHboundsForPath(
    //       wordPath,
    //       // symbol.glyph.getPath(0, 0, FONT_SIZE),
    //       angle
    //     )
    //     this.symbolHbounds.set(symbolAngleId, hbounds)
    //   }
    // }

    // const symbolHbounds = word.symbols.map((s) => {
    //   const symbolId = getSymbolAngleId(s.glyph, font, angle)
    //   return this.symbolHbounds.get(symbolId)!
    // })

    // const wordHbounds = this.mergeHboundsWasmForWord(
    //   symbolHbounds,
    //   word.symbolOffsets
    // )
    const wordPath = word.font.getPath(word.text, 0, 0, FONT_SIZE)
    const wordHbounds = await this.computeHboundsForPath(wordPath, angle)
    this.wordPaths.set(wordId, wordPath)
    this.wordHbounds.set(wordId, wordHbounds)

    return word
  }

  // mergeHboundsWasmForWord = (
  //   symbolBounds: HBoundsWasm[],
  //   xOffsets: number[]
  // ) => {
  //   return symbolBounds[0]
  // }

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
    const t2 = performance.now()

    this.logger.debug(
      `Processed ${words.length} words: ${(t2 - t1).toFixed(2)}ms`
    )

    const circleR = 80
    const { imgData, ctx: imgCtx } = createCircleImgData(circleR, 'red')
    const hboundsCircle = this.wasm.create_hbounds(
      new Uint32Array(imgData.data.buffer),
      imgData.width,
      imgData.height,
      false
    )
    // const t: tm.Matrix = multiply(
    //   // tm.translate(x, y),
    //   tm.scale(1),
    //   tm.scale(1.5)
    // )
    // const tw = new this.wasm.Matrix()
    // tw.set_mut(t.a, t.b, t.c, t.d, t.e, t.f)

    // hboundsCircle.set_transform_matrix(tw)

    let currentItemId = 1
    let addedItems: Item[] = []
    let addedHbounds: any[] = []
    let addedImgCtxs: CanvasRenderingContext2D[] = []

    const shapeHBoundsJs = shape.hBounds.get_js()

    const ctx = createCanvasCtx({
      w: 800, //shapeHBoundsJs.bounds.w * (shapeHBoundsJs.transform?.a || 1),
      h: 800, //shapeHBoundsJs.bounds.h * (shapeHBoundsJs.transform?.d || 1),
    })

    let scaleFactor = 1.6
    const initialScale = 0.5 * scaleFactor
    // const initialScale = 0.002
    const finalScale = 0.002 * scaleFactor
    // const finalScale = 1.99 * scaleFactor
    const scaleStepFactor = 0.01
    const maxScaleStep = 0.005
    let timeout = 1500
    let maxTimeout = 3000
    let timeoutStep = 300
    let maxCount = 1000 * shape.percentArea
    // let maxCount = 30

    let failedBatchesCount = 0
    const maxFailedBatchesCount = 3

    let scale = initialScale

    const tPrepEnd = performance.now()
    this.logger.debug(`Generator: ${(tPrepEnd - tStarted).toFixed(3)}ms`)
    let countScale = 0
    let count = 0

    let tBatchStart = performance.now()
    while (scale > finalScale && count < maxCount) {
      // console.log('scale: ', scale)
      const batchSize = 30
      let success = false

      const isCircle = Math.random() > 1

      for (let i = 0; i < batchSize; ++i) {
        const word = sample(words)!
        const hboundsWord = this.wordHbounds.get(word.id)
        if (!hboundsWord) {
          throw new Error(`No hbounds for word ${word.id}`)
        }

        // const rScaled = Math.max(3, circleR * scale)
        const p = randomPointInsideHboundsSerialized(shapeHBoundsJs)
        if (!p) {
          continue
        }

        const cx = p.x
        const cy = p.y

        // ctx.fillStyle = 'red'
        // ctx.fillRect(cx, cy, 2, 2)

        const x = cx
        const y = cy

        const transform: tm.Matrix = multiply(
          tm.translate(x, y),
          tm.scale(scale)
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

        // const transformWasm2 = transformWasm.copy()

        let hasPlaced = collisionDetector.addItem(
          isCircle ? hboundsCircle : hboundsWord,
          transformWasm
        )
        // let hasPlaced = true // TODO: Remove
        if (hasPlaced) {
          // const ctx2 = createCanvasCtx({ w: 1000, h: 1000 })

          // const hbounds2 = isCircle ? hboundsCircle : hboundsWord

          // hbounds2.set_transform_matrix(transformWasm2)
          // // @ts-ignore
          // drawHBoundsWasm(ctx2, hbounds2, transform)
          // drawHBoundsWasm(ctx2, shape.hBoundsInverted)
          // console.screenshot(ctx2.canvas, 0.5)

          success = true
          addedHbounds.push({
            ...(isCircle ? hboundsCircle : hboundsWord),
            transform,
          })

          // const hboundsJs = (isCircle ? hboundsCircle : hboundsWord).get_js()
          // const item = hBoundsWasmSerializedToPaperGroup({
          //   ...hboundsJs,
          //   // transform: compose(transform, hboundsJs.transform || tm.identity()),
          // })
          // item.transform(matrixToPaperTransform(transform))
          // // console.log(
          // //   'item transform: ',
          // //   compose(transform, hboundsJs.transform || tm.identity()),
          // //   hboundsJs.bounds
          // // )
          // const editor = (window as any)['editor'] as Editor
          // editor.paperItems.shapeHbounds?.addChild(item)

          if (isCircle) {
            addedItems.push({
              kind: 'img',
              id: currentItemId++,
              ctx: imgCtx,
              transform,
            })
          } else {
            // console.log(
            //   'item transform 2: ',
            //   compose(transform, hboundsJs.transform || tm.identity()),
            //   this.wordPaths.get(word.id)?.getBoundingBox()
            // )
            addedItems.push({
              kind: 'word',
              id: currentItemId++,
              word,
              wordPath: this.wordPaths.get(word.id)!,
              shapeColor: shape.color,
              transform: compose(
                transform
                // hboundsJs.transform || tm.identity()
              ),
            })
          }

          countScale++
          count++

          break
        }
      }

      const tBatchEnd = performance.now()

      if (!success) {
        failedBatchesCount++
      }

      if (
        failedBatchesCount >= maxFailedBatchesCount ||
        tBatchEnd - tBatchStart > timeout ||
        count > maxCount
      ) {
        scale -= Math.min(maxScaleStep, scaleStepFactor * scale)
        // this.logger.debug('placed ', scale, countScale)
        countScale = 0
        failedBatchesCount = 0
        tBatchStart = performance.now()
      }
      timeout = Math.min(maxTimeout, timeout + timeoutStep)
    }

    console.screenshot(ctx.canvas)

    const tEnded = performance.now()
    this.logger.debug(
      `Generator: placed ${count} in ${(tEnded - tStarted).toFixed(3)}ms`
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
    const imgSize = 300
    const visualize = false

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
    // console.screenshot(ctx.canvas, 1)
    const hboundsWasm = this.wasm.create_hbounds(
      new Uint32Array(imageData.data.buffer),
      canvas.width,
      canvas.height,
      false
    )
    if (visualize) {
      drawHBoundsWasm(ctx, hboundsWasm)
      console.screenshot(ctx.canvas)
    }

    const hboundsWasmTransform = multiply(
      tm.scale(1 / pathAaabScaleFactor),
      // tm.scale(1.5),
      // tm.translate(10, 10)
      // tm.identity(),
      // tm.translate(0, 100)
      tm.translate(pathAaab.x, pathAaab.y)
    )

    // const hboundsWasmTransform = tm.scale(1 / pathAaabScaleFactor)

    // console.log('FISH: ', pathAaabScaleFactor)
    hboundsWasm.set_transform(
      hboundsWasmTransform.a,
      hboundsWasmTransform.b,
      hboundsWasmTransform.c,
      hboundsWasmTransform.d,
      hboundsWasmTransform.e,
      hboundsWasmTransform.f
    )

    // console.log('FISH2: ', hboundsWasm.get_bounds())
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

  // computeHBounds(angle = 0, scaleFactor = 1): HBounds {
  //   return computeHBoundsForPath(
  //     this.glyph.getPath(0, 0, this.fontSize),
  //     angle,
  //     scaleFactor
  //   ).hBounds
  // }
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

const createCircleImgData = (r = 10, color = '#0005') => {
  const pad = 0
  const w = r * 2 + 2 * pad
  const h = r * 2 + 2 * pad
  const ctx = createCanvasCtx({ w, h })
  // ctx.fillStyle = 'white'
  // ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const lineWidth = r / 3
  // ctx.fillRect(0, 0, w, h)
  ctx.arc(r + pad, r + pad, r - lineWidth, 0, 2 * Math.PI)
  // ctx.fill()
  ctx.lineWidth = lineWidth
  ctx.stroke()

  // console.screenshot(ctx.canvas)
  return { imgData: ctx.getImageData(0, 0, w, h), ctx }
}
