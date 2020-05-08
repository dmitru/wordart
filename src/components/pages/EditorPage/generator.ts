import { WordConfigId } from 'components/pages/EditorPage/editor-page-store'
import {
  Dimensions,
  loadImageUrlToCanvasCtx,
  createCanvasCtx,
  removeImageOpacity,
  clearCanvas,
} from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import { getWasmModule, WasmModule } from 'lib/wordart/wasm/wasm-module'
import { Rect, Point, spreadRect, degToRad } from 'lib/wordart/geometry'
import {
  ShapeWasm,
  ImageProcessorWasm,
} from 'lib/wordart/wasm/image-processor-wasm'
import * as tm from 'transformation-matrix'
import { Path } from 'opentype.js'
import { sample, uniq, flatten } from 'lodash'

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
    console.screenshot(shapeCanvas, 0.3)
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

    const nIter = 500
    const usePreciseShapesEvery = 10
    const t1 = performance.now()

    let wordIndex = 0

    const angles = uniq(flatten(task.words.map((w) => w.angles)))
    const rotationInfos = new Map<
      number,
      {
        ctx: CanvasRenderingContext2D
        rotatedCanvasDimensions: Dimensions
        transform: paper.Matrix
        rotatedBounds: paper.Item
        inverseTransform: paper.Matrix
      }
    >()

    angles.forEach((angle) => {
      const bounds = new paper.Path.Rectangle(
        new paper.Rectangle(
          0,
          0,
          shapeCanvasDimensions.w,
          shapeCanvasDimensions.h
        )
      )
      const rotatedBounds = bounds.clone()
      rotatedBounds.rotate(angle, new paper.Point(0, 0))
      const rotatedBoundsAabb = rotatedBounds.bounds

      const rotatedCanvasDimensions: Dimensions = {
        w: rotatedBoundsAabb.width,
        h: rotatedBoundsAabb.height,
      }

      const rotatedBoundsScaleX =
        rotatedCanvasDimensions.w / rotatedBoundsAabb.width
      const rotatedBoundsScaleY =
        rotatedCanvasDimensions.h / rotatedBoundsAabb.height

      const rotatedBoundsScale = Math.max(
        rotatedBoundsScaleX,
        rotatedBoundsScaleY
      )

      // bounds.scale(rotatedBoundsScale, rotatedBoundsScale)

      // console.log(
      //   'rotatedBoundsAabb = ',
      //   bounds.bounds.left,
      //   bounds.bounds.top,
      //   bounds.bounds.width,
      //   bounds.bounds.height,
      //   angle,
      //   rotatedBoundsAabb.left,
      //   rotatedBoundsAabb.top,
      //   rotatedBoundsAabb.width,
      //   rotatedBoundsAabb.height
      // )

      const rotatedBoundsTransform = new paper.Matrix()
        // .translate(rotatedBoundsAabb.center)
        .rotate(-angle, new paper.Point(0, 0))
        // .translate(rotatedBoundsAabb.center.multiply(-1))
        .translate(rotatedBoundsAabb.topLeft)
      // .scale(rotatedBoundsScaleX, rotatedBoundsScaleY)
      // .scale(rotatedBoundsScale, rotatedBoundsScale)

      const rotatedBoundsTransformInverted = rotatedBoundsTransform.inverted()
      const rotatedCtx = createCanvasCtx(rotatedCanvasDimensions)

      rotationInfos.set(angle, {
        ctx: rotatedCtx,
        rotatedCanvasDimensions,
        rotatedBounds,
        transform: rotatedBoundsTransform,
        inverseTransform: rotatedBoundsTransformInverted,
      })
    })

    shapeCtx.fillStyle = 'black'
    shapeCtx.globalCompositeOperation = 'destination-out'

    let shouldUpdateRotatedCtx = true
    for (let i = 0; i < nIter; ++i) {
      const word = words[wordIndex]
      const wordConfig = task.words.find(
        (wc) => wc.wordConfigId === word.wordConfigId
      )!
      const angle = sample(wordConfig.angles)!
      const rotationInfo = rotationInfos.get(angle)
      if (!rotationInfo) {
        throw new Error(`rotation info is missing for angle ${angle}`)
      }
      const {
        ctx: rotatedCtx,
        rotatedCanvasDimensions,
        transform: rotatedBoundsTransform,
        inverseTransform: rotatedBoundsTransformInverted,
        rotatedBounds,
      } = rotationInfo
      // console.log('i = ', i, angle)

      const wordPathBounds = wordPathsBounds[wordIndex]
      const wordPath = wordPaths[wordIndex]

      // let scale = 1 - (0.5 * i) / nIter
      let scale = 1
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

      // Rotate bounds of the shape and fit the scratchCanvasDimensions

      // if (shouldUpdateRotatedCtx) {
      clearCanvas(rotatedCtx)
      rotatedCtx.save()
      // console.log(
      //   'rotatedBoundsTransform = ',
      //   rotatedBoundsTransform.rotation,
      //   rotatedBoundsTransform.scaling
      // )
      rotatedBoundsTransformInverted.applyToContext(rotatedCtx)
      // rotatedCtx.rotate(degToRad(angle))
      // rotatedCtx.translate(rotatedBounds.bounds.top, rotatedBounds.bounds.left)
      // rotatedCtx.scale(
      //   rotatedCanvasDimensions.w / rotatedBounds.bounds.width,
      //   rotatedCanvasDimensions.h / rotatedBounds.bounds.height
      // )

      rotatedCtx.drawImage(shapeCtx.canvas, 0, 0)
      rotatedCtx.restore()
      // shouldUpdateRotatedCtx = false
      // }

      // rotatedCtx.fillStyle = '#f002'
      // rotatedCtx.fillRect(
      //   0,
      //   0,
      //   rotatedCtx.canvas.width,
      //   rotatedCtx.canvas.height
      // )
      // console.screenshot(rotatedCtx.canvas)
      // console.screenshot(shapeCtx.canvas)

      const scratchImgData = rotatedCtx.getImageData(
        0,
        0,
        rotatedCanvasDimensions.w,
        rotatedCanvasDimensions.h
      )
      // shapeCtx.imageSmoothingEnabled = false
      const scratchCanvasBounds: Rect = {
        x: 0,
        y: 0,
        w: rotatedCanvasDimensions.w,
        h: rotatedCanvasDimensions.h,
      }
      const wordPathSize: Dimensions = {
        w: wordPathBounds.x2 - wordPathBounds.x1,
        h: wordPathBounds.y2 - wordPathBounds.y1,
      }
      const wordAspect = wordPathSize.w / wordPathSize.h

      const largestRectWasm = imageProcessor.findLargestRect(
        scratchImgData,
        scratchCanvasBounds,
        wordAspect
      )
      const largestRect: Rect = {
        x: largestRectWasm.x,
        y: largestRectWasm.y,
        w: largestRectWasm.w,
        h: largestRectWasm.h,
      }
      // console.log('largestRect ', largestRect)

      // const [largestRect,] = getLargestRect(
      //   scratchImgData,
      //   scratchCanvasBounds,
      //   wordAspect
      // )

      // shapeCtx.fillRect(...spreadRect(largestRect))

      if (largestRect.w < 1 || largestRect.h < 1) {
        break
      }
      // console.log(largestRect, getLargestRect(imgData, imgDataBounds))

      let pathScale =
        scale *
        Math.min(largestRect.w / wordPathSize.w, largestRect.h / wordPathSize.h)

      const maxMinDim = (task.itemSize / 100) * 60
      const minDim = Math.min(wordPathSize.w, wordPathSize.h) * pathScale
      if (minDim > maxMinDim) {
        pathScale *= maxMinDim / minDim
      }

      shapeCtx.save()
      rotatedBoundsTransform.applyToContext(shapeCtx)

      if (task.itemPadding > 0) {
        shapeCtx.shadowBlur =
          (task.itemPadding / 100) * (shapeCanvasSize / 100) * 2
        shapeCtx.shadowColor = 'red'
      } else {
        shapeCtx.shadowBlur = 0
      }

      if (
        pathScale * Math.min(largestRect.w, largestRect.h) >=
        0.05 * (shapeCanvasSize / 360)
      ) {
        const dx = Math.max(largestRect.w - pathScale * wordPathSize.w, 0)
        const dy = Math.max(largestRect.h - pathScale * wordPathSize.h, 0)

        const tx = largestRect.x + Math.random() * dx
        const ty =
          largestRect.y +
          largestRect.h -
          pathScale * wordPathBounds.y2 -
          Math.random() * dy
        shapeCtx.translate(tx, ty)
        shapeCtx.scale(pathScale, pathScale)

        wordPath.draw(shapeCtx)

        shouldUpdateRotatedCtx = true

        placedWords.push({
          wordPath,
          id: i,
          kind: 'word',
          shapeColor: 'black',
          word,
          transform: new paper.Matrix()
            .translate(task.shape.bounds.left, task.shape.bounds.top)
            .scale(
              task.shape.bounds.width / shapeCanvasDimensions.w,
              task.shape.bounds.height / shapeCanvasDimensions.h
            )
            .append(rotatedBoundsTransform)
            .translate(tx, ty)
            .scale(pathScale),
        })
      } else {
        // console.log('i', i)
        // console.log(
        //   'removing',
        //   largestRect.x,
        //   largestRect.y,
        //   largestRect.w,
        //   largestRect.h
        // )
        shouldUpdateRotatedCtx = true
        shapeCtx.fillRect(
          largestRect.x,
          largestRect.y,
          Math.max(1.2, largestRect.w),
          Math.max(1.2, largestRect.h)
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
  /** Additional padding between shape and items, in percent (0 - 100) */
  shapePadding: number
  /** Padding between items, in percent (0 - 100) */
  itemPadding: number
  /** 0 - 100 */
  itemSize: number
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
  transform: paper.Matrix
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

// https://stackoverflow.com/questions/7245/puzzle-find-largest-rectangle-maximal-rectangle-problem
const getLargestRect = (
  imgData: ImageData,
  bounds: Rect,
  aspectRatio: number
): [Rect, number] => {
  const imgWidth = imgData.width
  const img = imgData.data

  const x1 = bounds.x
  const y1 = bounds.y
  const M = bounds.h
  const N = bounds.w

  const dpH = new Uint32Array(N).fill(0)
  const dpL = new Uint32Array(N).fill(N)
  const dpR = new Uint32Array(N).fill(0)

  const imgPixelIndex = (row: number, col: number) =>
    4 * (x1 + col + (y1 + row) * imgWidth)
  const isImgPixelEmpty = (row: number, col: number) =>
    img[imgPixelIndex(row, col) + 3] < 255

  let maxArea = 0
  let maxRect: Rect = { x: 0, y: 0, w: 0, h: 0 }
  // Compute DP
  for (let i = 0; i < M; ++i) {
    let curLeft = 0
    let curRight = N

    // Update height
    for (let j = 0; j < N; ++j) {
      dpH[j] = isImgPixelEmpty(i, j) ? 0 : dpH[j] + 1
    }

    // Update left
    for (let j = 0; j < N; ++j) {
      if (!isImgPixelEmpty(i, j)) {
        dpL[j] = Math.max(dpL[j], curLeft)
      } else {
        dpL[j] = 0
        curLeft = j + 1
      }
    }

    // Update right
    for (let j = N - 1; j >= 0; --j) {
      if (!isImgPixelEmpty(i, j)) {
        dpR[j] = Math.min(dpR[j], curRight)
      } else {
        dpR[j] = N
        curRight = j
      }
    }

    // Update the area
    for (let j = 0; j < N; ++j) {
      const h = dpH[j]
      const w = dpR[j] - dpL[j]
      let a = h * w

      if (a > 0) {
        if (w / h > aspectRatio) {
          a = h * aspectRatio * h
        } else {
          a = (w / aspectRatio) * w
        }
      }

      if (a > maxArea) {
        maxArea = a
        maxRect = {
          x: dpL[j],
          y: i - dpH[j],
          h,
          w,
        }
      }
    }
  }

  return [maxRect, maxArea]
}
