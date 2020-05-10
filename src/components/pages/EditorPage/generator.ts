import {
  WordConfigId,
  ShapeConfig,
} from 'components/pages/EditorPage/editor-page-store'
import {
  Dimensions,
  createCanvasCtx,
  clampPixelOpacityUp,
  clearCanvas,
  shrinkShape,
} from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import { getWasmModule, WasmModule } from 'lib/wordart/wasm/wasm-module'
import { Rect, spreadRect } from 'lib/wordart/geometry'
import { ImageProcessorWasm } from 'lib/wordart/wasm/image-processor-wasm'
import { Path, BoundingBox } from 'opentype.js'
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

    const shapeCanvasMaxExtent = 300

    const shapeCanvas = task.shape.canvas
    console.screenshot(shapeCanvas, 0.3)
    const shapeCanvasScale =
      shapeCanvasMaxExtent / Math.max(shapeCanvas.width, shapeCanvas.height)

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
      1,
      1,
      shapeCtx.canvas.width - 2,
      shapeCtx.canvas.height - 2
    )
    clampPixelOpacityUp(shapeCtx.canvas)
    shrinkShape(
      shapeCtx.canvas,
      (task.shapePadding / 100) * 5 * (shapeCanvasMaxExtent / 100)
    )

    const imageProcessor = new ImageProcessorWasm(this.wasm)

    const icons = task.icons
    const iconSymbolDefs: paper.SymbolDefinition[] = []
    const iconRasterCanvases: HTMLCanvasElement[] = []
    const iconsBounds: Rect[] = []

    await Promise.all(
      icons.map(async (icon) => {
        const shapeItemGroup: paper.Group = await new Promise<paper.Group>(
          (resolve) =>
            new paper.Item().importSVG(icon.shape.url, (item: paper.Item) =>
              resolve(item as paper.Group)
            )
        )
        shapeItemGroup.fillColor = new paper.Color('black')
        shapeItemGroup.strokeColor = new paper.Color('black')
        shapeItemGroup.scale(
          shapeCanvasMaxExtent /
            Math.max(
              shapeItemGroup.bounds.width,
              shapeItemGroup.bounds.height
            ) /
            2
        )
        const iconSymDef = new paper.SymbolDefinition(shapeItemGroup)
        iconSymbolDefs.push(iconSymDef)

        const raster = iconSymDef.item.rasterize(40, false)
        const rasterCanvas = raster.getSubCanvas(
          new paper.Rectangle(0, 0, raster.width, raster.height)
        )
        iconRasterCanvases.push(rasterCanvas)
        const iconBounds = iconSymDef.item.bounds
        iconsBounds.push({
          x: Math.round(iconBounds.left),
          y: Math.round(iconBounds.top),
          h: Math.round(iconBounds.height),
          w: Math.round(iconBounds.width),
        })
      })
    )

    const words = flatten(
      task.words.map((word, index) =>
        word.fonts.map(
          (font, fontIndex) =>
            new Word(
              `${index}-${fontIndex}`,
              word.wordConfigId,
              word.text,
              font
            )
        )
      )
    )
    const wordPaths = words.map((word) =>
      word.font.getPath(word.text, 0, 0, 100)
    )
    const wordPathsBounds = wordPaths.map((wordPath) =>
      wordPath.getBoundingBox()
    )

    const placedWordItems: WordItem[] = []
    const placedSymbolItems: SymbolItem[] = []

    const nIter = 800
    const t1 = performance.now()

    const wordAngles = uniq(flatten(task.words.map((w) => w.angles)))

    const hasWords = task.words.length > 0
    const hasIcons = task.icons.length > 0
    let iconProbability = task.iconProbability
    if (hasWords && hasIcons) {
      iconProbability = task.iconProbability
    } else if (hasWords) {
      iconProbability = 0
    } else if (hasIcons) {
      iconProbability = 1
    }

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

    const computeRotationInfo = (angle: number) => {
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

      const rotatedBoundsScaleX1 =
        shapeCanvasMaxExtent / rotatedBoundsAabb.width
      const rotatedBoundsScaleY1 =
        shapeCanvasMaxExtent / rotatedBoundsAabb.height
      const rotatedBoundsScaleX = Math.max(
        rotatedBoundsScaleX1,
        rotatedBoundsScaleY1
      )
      const rotatedBoundsScaleY = Math.max(
        rotatedBoundsScaleX1,
        rotatedBoundsScaleY1
      )

      const rotatedCanvasDimensions: Dimensions = {
        w: Math.round(rotatedBoundsAabb.width * rotatedBoundsScaleX),
        h: Math.round(rotatedBoundsAabb.height * rotatedBoundsScaleY),
      }
      const rotatedBoundsTransform = new paper.Matrix()
        // .translate(rotatedBoundsAabb.center)
        .rotate(-angle, new paper.Point(0, 0))
        // .translate(rotatedBoundsAabb.center.multiply(-1))
        .translate(rotatedBoundsAabb.topLeft)
        .scale(
          1 / (rotatedCanvasDimensions.w / rotatedBoundsAabb.width),
          1 / (rotatedCanvasDimensions.h / rotatedBoundsAabb.height),
          new paper.Point(0, 0)
        )
      // .scale(rotatedBoundsScale, rotatedBoundsScale)

      const rotatedBoundsTransformInverted = rotatedBoundsTransform.inverted()
      const rotatedCtx = createCanvasCtx(rotatedCanvasDimensions)

      return {
        ctx: rotatedCtx,
        rotatedCanvasDimensions,
        rotatedBounds,
        transform: rotatedBoundsTransform,
        inverseTransform: rotatedBoundsTransformInverted,
      }
    }
    wordAngles.forEach((angle) =>
      rotationInfos.set(angle, computeRotationInfo(angle))
    )
    if (hasIcons && !rotationInfos.has(0)) {
      rotationInfos.set(0, computeRotationInfo(0))
    }

    shapeCtx.fillStyle = 'black'
    shapeCtx.globalCompositeOperation = 'destination-out'

    let wordIndex = 0
    let iconIndex = 0

    let mostLargestRect: Rect | undefined

    for (let i = 0; i < nIter; ++i) {
      let type: 'word' | 'icon' = 'word'

      if (hasWords && hasIcons) {
        type = Math.random() < task.iconProbability ? 'icon' : 'word'
      } else if (hasWords) {
        type = 'word'
      } else if (hasIcons) {
        type = 'icon'
      } else {
        break
      }

      if (type === 'word') {
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
        } = rotationInfo
        // console.log('i = ', i, angle)

        const wordPathBounds = wordPathsBounds[wordIndex]
        const wordPath = wordPaths[wordIndex]

        // let scale = 1 - (0.5 * i) / nIter
        let scale = 1

        clearCanvas(rotatedCtx)
        rotatedCtx.save()
        rotatedBoundsTransformInverted.applyToContext(rotatedCtx)

        rotatedCtx.drawImage(shapeCtx.canvas, 0, 0)
        rotatedCtx.restore()

        // rotatedCtx.fillStyle = '#f002'
        // rotatedCtx.fillRect(
        //   0,
        //   0,
        //   rotatedCtx.canvas.width,
        //   rotatedCtx.canvas.height
        // )
        // console.log(rotatedCanvasDimensions)
        // console.screenshot(rotatedCtx.canvas)

        const scratchImgData = rotatedCtx.getImageData(
          0,
          0,
          rotatedCanvasDimensions.w,
          rotatedCanvasDimensions.h
        )
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

        if (!mostLargestRect) {
          mostLargestRect = largestRect
        }

        // const [largestRect] = getLargestRect(
        //   scratchImgData,
        //   scratchCanvasBounds,
        //   wordAspect
        // )
        // console.log('largestRect ', largestRect)

        // shapeCtx.fillRect(...spreadRect(largestRect))

        if (largestRect.w < 1 || largestRect.h < 1) {
          break
        }

        let pathScale =
          scale *
          Math.min(
            largestRect.w / wordPathSize.w,
            largestRect.h / wordPathSize.h
          )

        const maxMaxDim =
          (task.wordsMaxSize / 100) *
          Math.max(mostLargestRect.w, mostLargestRect.h)

        const maxDim = Math.max(wordPathSize.w, wordPathSize.h) * pathScale
        if (maxDim > maxMaxDim) {
          pathScale *= maxMaxDim / maxDim
        }

        shapeCtx.save()
        rotatedBoundsTransform.applyToContext(shapeCtx)

        if (task.itemPadding > 0) {
          shapeCtx.shadowBlur =
            ((task.itemPadding / 100) * (shapeCanvasMaxExtent / 360) * 3.6) /
            pathScale
          shapeCtx.shadowColor = 'red'
        } else {
          shapeCtx.shadowBlur = 0
        }

        if (
          pathScale * Math.min(largestRect.w, largestRect.h) >=
          0.05 * (shapeCanvasMaxExtent / 360)
        ) {
          const dx = Math.max(largestRect.w - pathScale * wordPathSize.w, 0)
          const dy = Math.max(largestRect.h - pathScale * wordPathSize.h, 0)

          const tx =
            largestRect.x - pathScale * wordPathBounds.x1 + Math.random() * dx
          const ty =
            largestRect.y +
            largestRect.h -
            pathScale * wordPathBounds.y2 -
            Math.random() * dy
          shapeCtx.translate(tx, ty)
          shapeCtx.scale(pathScale, pathScale)

          wordPath.draw(shapeCtx)

          placedWordItems.push({
            wordPath,
            id: i,
            kind: 'word',
            shapeColor: 'black',
            word,
            wordPathBounds,
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
          shapeCtx.fillRect(
            largestRect.x,
            largestRect.y,
            Math.max(1.2, largestRect.w),
            Math.max(1.2, largestRect.h)
          )
        }

        shapeCtx.restore()

        // console.screenshot(shapeCtx.canvas)

        wordIndex = (wordIndex + 1) % words.length
      } else {
        const iconSymDef = iconSymbolDefs[iconIndex]
        const rasterCanvas = iconRasterCanvases[iconIndex]

        const angle = 0
        const rotationInfo = rotationInfos.get(angle)
        if (!rotationInfo) {
          throw new Error(`rotation info is missing for angle ${angle}`)
        }

        const {
          ctx: rotatedCtx,
          rotatedCanvasDimensions,
          transform: rotatedBoundsTransform,
          inverseTransform: rotatedBoundsTransformInverted,
        } = rotationInfo
        // console.log('i = ', i, angle)

        // let scale = 1 - (0.5 * i) / nIter
        let scale = 1

        clearCanvas(rotatedCtx)
        rotatedCtx.save()
        rotatedBoundsTransformInverted.applyToContext(rotatedCtx)

        rotatedCtx.drawImage(shapeCtx.canvas, 0, 0)
        rotatedCtx.restore()

        // rotatedCtx.fillStyle = '#f002'
        // rotatedCtx.fillRect(
        //   0,
        //   0,
        //   rotatedCtx.canvas.width,
        //   rotatedCtx.canvas.height
        // )
        // console.log(rotatedCanvasDimensions)
        // console.screenshot(rotatedCtx.canvas)

        const scratchImgData = rotatedCtx.getImageData(
          0,
          0,
          rotatedCanvasDimensions.w,
          rotatedCanvasDimensions.h
        )
        const scratchCanvasBounds: Rect = {
          x: 0,
          y: 0,
          w: rotatedCanvasDimensions.w,
          h: rotatedCanvasDimensions.h,
        }

        const iconBounds = iconsBounds[iconIndex]
        const iconDims: Dimensions = {
          w: iconBounds.w,
          h: iconBounds.h,
        }
        const aspect = iconDims.w / iconDims.h

        const largestRectWasm = imageProcessor.findLargestRect(
          scratchImgData,
          scratchCanvasBounds,
          aspect
        )
        const largestRect: Rect = {
          x: largestRectWasm.x,
          y: largestRectWasm.y,
          w: largestRectWasm.w,
          h: largestRectWasm.h,
        }
        if (!mostLargestRect) {
          mostLargestRect = largestRect
        }

        // const [largestRect] = getLargestRect(
        //   scratchImgData,
        //   scratchCanvasBounds,
        //   wordAspect
        // )
        // console.log('largestRect ', largestRect)

        // shapeCtx.fillRect(...spreadRect(largestRect))

        if (largestRect.w < 1 || largestRect.h < 1) {
          break
        }

        // let iconScale = 0.5

        let iconScale =
          scale *
          Math.min(largestRect.w / iconDims.w, largestRect.h / iconDims.h)

        const maxMaxDim =
          (task.iconsMaxSize / 100) *
          Math.max(mostLargestRect.w, mostLargestRect.h)
        const maxDim = Math.max(iconDims.w, iconDims.h) * iconScale
        if (maxDim > maxMaxDim) {
          iconScale *= maxMaxDim / maxDim
        }

        // shapeCtx.strokeStyle = '#f008'
        // shapeCtx.lineWidth = 2
        // shapeCtx.strokeRect(...spreadRect(largestRect))

        shapeCtx.save()
        rotatedBoundsTransform.applyToContext(shapeCtx)

        if (task.itemPadding > 0) {
          shapeCtx.shadowBlur =
            ((task.itemPadding / 100) * (shapeCanvasMaxExtent / 360) * 3.6) /
            iconScale
          shapeCtx.shadowColor = 'red'
        } else {
          shapeCtx.shadowBlur = 0
        }

        // console.log(
        //   'shapeCtx.shadowBlur',
        //   shapeCtx.shadowBlur,
        //   (task.itemPadding / 100) * (shapeCanvasMaxExtent / 100) * 1,
        //   iconScale
        // )

        if (
          iconScale * Math.min(largestRect.w, largestRect.h) >=
          0.05 * (shapeCanvasMaxExtent / 360)
        ) {
          const dx = Math.max(largestRect.w - iconScale * iconDims.w, 0)
          const dy = Math.max(largestRect.h - iconScale * iconDims.h, 0)

          const tx =
            largestRect.x - iconScale * iconBounds.x + Math.random() * dx
          const ty =
            largestRect.y +
            largestRect.h -
            iconScale * (iconBounds.y + iconBounds.h) -
            Math.random() * dy
          shapeCtx.translate(tx, ty)
          shapeCtx.scale(iconScale, iconScale)

          // console.log('iconScale: ', iconScale)
          // console.log('rasterCanvas: ', rasterCanvas.width, rasterCanvas.height)
          // console.log(
          //   'iconBounds: ',
          //   iconBounds.x,
          //   iconBounds.y,
          //   iconBounds.w,
          //   iconBounds.h
          // )
          // console.log('---------------------')

          // shapeCtx.imageSmoothingEnabled = false
          shapeCtx.drawImage(
            rasterCanvas,
            0,
            0,
            rasterCanvas.width,
            rasterCanvas.height,
            iconBounds.x,
            iconBounds.y,
            // rasterCanvas.width,
            // rasterCanvas.height
            iconBounds.w,
            iconBounds.h
          )

          placedSymbolItems.push({
            id: i,
            kind: 'symbol',
            symbolDef: iconSymDef,
            transform: new paper.Matrix()
              .translate(task.shape.bounds.left, task.shape.bounds.top)
              .scale(
                task.shape.bounds.width / shapeCanvasDimensions.w,
                task.shape.bounds.height / shapeCanvasDimensions.h
              )
              .append(rotatedBoundsTransform)
              .translate(tx, ty)
              .scale(iconScale),
          })
        } else {
          shapeCtx.fillRect(
            largestRect.x,
            largestRect.y,
            Math.max(1.2, largestRect.w),
            Math.max(1.2, largestRect.h)
          )
        }

        shapeCtx.restore()

        // console.screenshot(shapeCtx.canvas)

        iconIndex = (iconIndex + 1) % icons.length
      }
    }
    const t2 = performance.now()

    console.screenshot(shapeCtx.canvas, 1)
    console.log(
      `Placed ${
        placedWordItems.length
      } words; Finished ${nIter} iterations in ${((t2 - t1) / 1000).toFixed(
        2
      )} s, ${((t2 - t1) / nIter).toFixed(3)}ms / iter`
    )

    return {
      placedItems: [...placedWordItems, ...placedSymbolItems],
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
  wordsMaxSize: number
  /** Words to use */
  words: FillShapeTaskWordConfig[]
  /** Icons to use */
  icons: FillShapeTaskIconConfig[]
  /** 0 - 100 */
  iconsMaxSize: number
  /** 0 - 100 */
  iconProbability: number
}

export type FillShapeTaskWordConfig = {
  wordConfigId: WordConfigId
  text: string
  /** Rotation angles in degrees */
  angles: number[]
  /** Fonts to use */
  fonts: Font[]
}

export type FillShapeTaskIconConfig = {
  shape: ShapeConfig
}

export type FillShapeTaskResult = {
  placedItems: Item[]
}

export type Item = WordItem | SymbolItem | RasterItem

export type RasterItem = {
  kind: 'img'
  id: ItemId
  ctx: CanvasRenderingContext2D
  transform: paper.Matrix
}

export type SymbolItem = {
  kind: 'symbol'
  id: ItemId
  symbolDef: paper.SymbolDefinition
  transform: paper.Matrix
}

export type WordItem = {
  kind: 'word'
  id: ItemId
  word: Word
  transform: paper.Matrix
  /** Color of the shape at the given location */
  shapeColor: string
  wordPath: Path
  wordPathBounds: BoundingBox
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
