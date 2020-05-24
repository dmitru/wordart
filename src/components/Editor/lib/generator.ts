import chroma from 'chroma-js'
import { WordConfigId } from 'components/Editor/editor-store'
import { ShapeConfig, ShapeId } from 'components/Editor/style'
import { FontId } from 'data/fonts'
import {
  clampPixelOpacityUp,
  clearCanvas,
  copyCanvas,
  createCanvasCtx,
  createCanvasCtxCopy,
  detectEdges,
  Dimensions,
  invertImageMask,
  removeLightPixels,
  shrinkShape,
} from 'lib/wordart/canvas-utils'
import { Rect } from 'lib/wordart/geometry'
import { ImageProcessorWasm } from 'lib/wordart/wasm/image-processor-wasm'
import { getWasmModule, WasmModule } from 'lib/wordart/wasm/wasm-module'
import { flatten, noop, sample, uniq } from 'lodash'
import { Path } from 'opentype.js'
import paper from 'paper'
import { consoleLoggers } from 'utils/console-logger'

const FONT_SIZE = 100

export class Generator {
  logger = consoleLoggers.generator

  words: Map<WordInfoId, WordInfo> = new Map()
  wordPaths: Map<WordInfoId, Path> = new Map()
  wasm?: WasmModule

  constructor() {}

  init = async () => {
    this.wasm = await getWasmModule()
  }

  items: GeneratedItem[] = []

  clear = () => {
    this.items = []
  }

  fillShape = async (
    task: FillShapeTask,
    onProgressCallback: (progress: number) => void = noop
  ): Promise<FillShapeTaskResult> => {
    if (!this.wasm) {
      throw new Error('call init() first')
    }
    this.logger.debug('Generator: generate', task)

    const shapeCanvasMaxExtent = 320

    const shapeCanvas = task.shape.canvas
    const shapeCanvasOriginalColors = task.shape.shapeCanvasOriginalColors
    console.screenshot(shapeCanvas, 0.3)
    const shapeCanvasScale =
      shapeCanvasMaxExtent / Math.max(shapeCanvas.width, shapeCanvas.height)

    const shapeCanvasDimensions: Dimensions = {
      w: Math.floor(shapeCanvasScale * shapeCanvas.width),
      h: Math.floor(shapeCanvasScale * shapeCanvas.height),
    }

    const unrotatedCtx = createCanvasCtx(shapeCanvasDimensions)
    const unrotatedCtxOriginalColors = createCanvasCtx(shapeCanvasDimensions)

    unrotatedCtx.drawImage(
      shapeCanvas,
      0,
      0,
      shapeCanvas.width,
      shapeCanvas.height,
      1,
      1,
      unrotatedCtx.canvas.width - 2,
      unrotatedCtx.canvas.height - 2
    )
    unrotatedCtxOriginalColors.drawImage(
      shapeCanvasOriginalColors,
      0,
      0,
      shapeCanvasOriginalColors.width,
      shapeCanvasOriginalColors.height,
      1,
      1,
      unrotatedCtx.canvas.width - 2,
      unrotatedCtx.canvas.height - 2
    )

    if (task.shape.processing.removeWhiteBg.enabled) {
      removeLightPixels(
        unrotatedCtx.canvas,
        task.shape.processing.removeWhiteBg.lightnessThreshold / 100
      )
    }

    let edgesCanvas: HTMLCanvasElement | undefined
    if (
      task.shape.processing.edges.enabled &&
      !task.shape.processing.invert.enabled
    ) {
      edgesCanvas = detectEdges(
        unrotatedCtxOriginalColors.canvas,
        (task.shape.processing.edges.blur * shapeCanvasMaxExtent) / 300,
        task.shape.processing.edges.lowThreshold,
        task.shape.processing.edges.highThreshold
      )
    }

    clampPixelOpacityUp(unrotatedCtx.canvas)
    clampPixelOpacityUp(unrotatedCtxOriginalColors.canvas)

    if (task.shape.processing.invert.enabled) {
      invertImageMask(unrotatedCtx.canvas)
      // Remove a 1px border around the shape to make largest-rect algorithm work correctly
      unrotatedCtx.save()
      unrotatedCtx.globalCompositeOperation = 'destination-out'
      unrotatedCtx.lineWidth = 1
      unrotatedCtx.strokeRect(
        0,
        0,
        unrotatedCtx.canvas.width,
        unrotatedCtx.canvas.height
      )
      unrotatedCtx.restore()
    }

    if (task.shape.processing.shrink.enabled) {
      shrinkShape(
        unrotatedCtx.canvas,
        (task.shape.processing.shrink.amount / 100) *
          5 *
          (shapeCanvasMaxExtent / 100)
      )
    }

    const unrotatedCtxOriginalShape = createCanvasCtxCopy(unrotatedCtx)
    copyCanvas(unrotatedCtxOriginalColors, unrotatedCtxOriginalShape)
    const unrotatedCtxOriginalColorsImgData = new Uint8ClampedArray(
      unrotatedCtxOriginalShape.getImageData(
        0,
        0,
        unrotatedCtxOriginalShape.canvas.width,
        unrotatedCtxOriginalShape.canvas.height
      ).data.buffer
    )

    if (edgesCanvas) {
      unrotatedCtx.save()
      unrotatedCtx.globalCompositeOperation = 'destination-out'
      unrotatedCtx.drawImage(edgesCanvas, 0, 0)
      unrotatedCtx.restore()
    }
    if (task.shape.canvasSubtract) {
      unrotatedCtx.save()
      unrotatedCtx.globalCompositeOperation = 'destination-out'
      unrotatedCtx.shadowBlur =
        0.25 + (task.itemPadding / 100) * (shapeCanvasMaxExtent / 360) * 3.6
      unrotatedCtx.shadowColor = 'black'
      unrotatedCtx.drawImage(
        task.shape.canvasSubtract,
        0,
        0,
        task.shape.canvasSubtract.width,
        task.shape.canvasSubtract.height,
        0,
        0,
        unrotatedCtx.canvas.width,
        unrotatedCtx.canvas.height
      )
      unrotatedCtx.restore()
    }

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
      task.words.map((word) =>
        word.fonts.map(
          (font) =>
            new WordInfo(
              `${font.id}-${word.text}`,
              word.wordConfigId,
              word.text,
              font
            )
        )
      )
    )
    const wordPaths = words.map((word) =>
      word.font.otFont.getPath(word.text, 0, 0, 100)
    )
    const wordPathsBounds = wordPaths.map((wordPath) =>
      wordPath.getBoundingBox()
    )

    const placedWordItems: WordGeneratedItem[] = []
    const placedSymbolItems: SymbolGeneratedItem[] = []

    const nIter = 500
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

    unrotatedCtx.fillStyle = 'black'
    unrotatedCtx.globalCompositeOperation = 'destination-out'

    let wordIndex = 0
    let iconIndex = 0

    let mostLargestRect: Rect | undefined

    let tLastNotified = performance.now()

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
        let {
          ctx: rotatedCtx,
          rotatedCanvasDimensions,
          transform: rotatedBoundsTransform,
          inverseTransform: rotatedBoundsTransformInverted,
        } = rotationInfo

        if (wordAngles.length === 1 && wordAngles[0] === 0) {
          // Optimize for case of just 1 angle
          rotatedCtx = unrotatedCtx
          rotatedBoundsTransform = new paper.Matrix()
          rotatedBoundsTransformInverted = new paper.Matrix()
        } else {
          rotatedCtx = rotationInfo.ctx
          clearCanvas(rotatedCtx)
          rotatedCtx.save()
          rotatedBoundsTransformInverted.applyToContext(rotatedCtx)

          rotatedCtx.drawImage(unrotatedCtx.canvas, 0, 0)
          rotatedCtx.restore()
        }
        // console.log('i = ', i, angle)

        const wordPathBounds = wordPathsBounds[wordIndex]
        const wordPath = wordPaths[wordIndex]

        // let scale = 1 - (0.5 * i) / nIter
        let scale = 1

        // rotatedCtx.fillStyle = '#f002'
        // rotatedCtx.fillRect(
        //   0,
        //   0,
        //   rotatedCtx.canvas.width,
        //   rotatedCtx.canvas.height
        // )
        // console.log(rotatedCanvasDimensions)
        // console.screenshot(rotatedCtx.canvas)

        const rotatedImgData = rotatedCtx.getImageData(
          0,
          0,
          rotatedCanvasDimensions.w,
          rotatedCanvasDimensions.h
        )
        const rotatedCanvasBounds: Rect = {
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
          rotatedImgData,
          rotatedCanvasBounds,
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

        unrotatedCtx.save()
        rotatedBoundsTransform.applyToContext(unrotatedCtx)

        unrotatedCtx.shadowBlur =
          0.25 + (task.itemPadding / 100) * (shapeCanvasMaxExtent / 360) * 3.6
        unrotatedCtx.shadowColor = 'red'

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
          unrotatedCtx.translate(tx, ty)
          unrotatedCtx.scale(pathScale, pathScale)

          const wordCenterRotated = new paper.Point(
            tx + (wordPathSize.w * pathScale) / 2,
            ty - (wordPathSize.h * pathScale) / 2
          )
          // TODO: perhaps the transform is off...
          const wordCenterUnrotated = rotatedBoundsTransform.transform(
            wordCenterRotated
          )
          const col = Math.round(wordCenterUnrotated.x)
          const row = Math.round(wordCenterUnrotated.y)

          const colorSamplePixelIndex =
            4 * (unrotatedCtxOriginalShape.canvas.width * row + col)
          const r = unrotatedCtxOriginalColorsImgData[colorSamplePixelIndex + 0]
          const g = unrotatedCtxOriginalColorsImgData[colorSamplePixelIndex + 1]
          const b = unrotatedCtxOriginalColorsImgData[colorSamplePixelIndex + 2]
          const shapeColor = chroma.rgb(r, g, b).hex()

          wordPath.draw(unrotatedCtx)

          placedWordItems.push({
            index: i,
            kind: 'word',
            shapeColor,
            fontId: word.font.id,
            text: word.text,
            wordConfigId: word.wordConfigId,
            // Transform to the center of the placed item
            transform: new paper.Matrix()
              .translate(task.shape.bounds.left, task.shape.bounds.top)
              .scale(
                task.shape.bounds.width / shapeCanvasDimensions.w,
                task.shape.bounds.height / shapeCanvasDimensions.h
              )
              .append(rotatedBoundsTransform)
              .translate(tx, ty)
              .scale(pathScale)
              .translate(
                wordPathBounds.x1 + 0.5 * wordPathSize.w,
                wordPathBounds.y1 + wordPathSize.h * 0.5
              ),
          })
        } else {
          unrotatedCtx.fillRect(
            largestRect.x,
            largestRect.y,
            Math.max(1.2, largestRect.w),
            Math.max(1.2, largestRect.h)
          )
        }

        unrotatedCtx.restore()

        // console.screenshot(shapeCtx.canvas)

        wordIndex = (wordIndex + 1) % words.length
      } else {
        const icon = icons[iconIndex]
        const iconSymDef = iconSymbolDefs[iconIndex]
        const rasterCanvas = iconRasterCanvases[iconIndex]

        const angle = 0
        const rotationInfo = rotationInfos.get(angle)
        if (!rotationInfo) {
          throw new Error(`rotation info is missing for angle ${angle}`)
        }

        let {
          ctx: rotatedCtx,
          rotatedCanvasDimensions,
          transform: rotatedBoundsTransform,
          inverseTransform: rotatedBoundsTransformInverted,
        } = rotationInfo
        // console.log('i = ', i, angle)

        if (angle === 0) {
          // Optimize for case of just 1 angle
          rotatedCtx = unrotatedCtx
          rotatedBoundsTransform = new paper.Matrix()
          rotatedBoundsTransformInverted = new paper.Matrix()
        } else {
          rotatedCtx = rotationInfo.ctx
          clearCanvas(rotatedCtx)
          rotatedCtx.save()
          rotatedBoundsTransformInverted.applyToContext(rotatedCtx)

          rotatedCtx.drawImage(unrotatedCtx.canvas, 0, 0)
          rotatedCtx.restore()
        }

        // let scale = 1 - (0.5 * i) / nIter
        let scale = 1
        // rotatedCtx.fillStyle = '#f002'
        // rotatedCtx.fillRect(
        //   0,
        //   0,
        //   rotatedCtx.canvas.width,
        //   rotatedCtx.canvas.height
        // )
        // console.log(rotatedCanvasDimensions)
        // console.screenshot(rotatedCtx.canvas)

        const rotatedImgData = rotatedCtx.getImageData(
          0,
          0,
          rotatedCanvasDimensions.w,
          rotatedCanvasDimensions.h
        )
        const rotatedCanvasBounds: Rect = {
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
          rotatedImgData,
          rotatedCanvasBounds,
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

        unrotatedCtx.save()
        rotatedBoundsTransform.applyToContext(unrotatedCtx)

        if (task.itemPadding > 0) {
          unrotatedCtx.shadowBlur =
            ((task.itemPadding / 100) * (shapeCanvasMaxExtent / 360) * 3.6) /
            iconScale
          unrotatedCtx.shadowColor = 'red'
        } else {
          unrotatedCtx.shadowBlur = 0
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
          unrotatedCtx.translate(tx, ty)
          unrotatedCtx.scale(iconScale, iconScale)

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
          unrotatedCtx.drawImage(
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
            index: i,
            kind: 'symbol',
            shapeColor: 'black',
            symbolDef: iconSymDef,
            shapeId: icon.shape.id,
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
          unrotatedCtx.fillRect(
            largestRect.x,
            largestRect.y,
            Math.max(1.2, largestRect.w),
            Math.max(1.2, largestRect.h)
          )
        }

        unrotatedCtx.restore()

        // console.screenshot(shapeCtx.canvas)

        iconIndex = (iconIndex + 1) % icons.length
      }

      if (i % 30) {
        const t2 = performance.now()
        if (t2 - t1 > 50) {
          tLastNotified = t2
          // onProgressCallback(i / nIter)
          // await sleep(10)
        }
      }
    }

    const t2 = performance.now()

    console.screenshot(unrotatedCtx.canvas, 1)
    console.log(
      `Placed ${
        placedWordItems.length
      } words; Finished ${nIter} iterations in ${((t2 - t1) / 1000).toFixed(
        2
      )} s, ${((t2 - t1) / nIter).toFixed(3)}ms / iter`
    )

    return {
      generatedItems: [...placedWordItems, ...placedSymbolItems],
    }
  }
}

/** Describes a task of filling a shape with items (usually words) */
export type FillShapeTask = {
  shape: {
    canvas: HTMLCanvasElement
    /** Subtract this canvas from `canvas` before starting generation */
    canvasSubtract?: HTMLCanvasElement
    shapeCanvasOriginalColors: HTMLCanvasElement
    bounds: paper.Rectangle
    processing: {
      /** Pixels with lightness above the threshold will be made transparent */
      removeWhiteBg: {
        enabled: boolean
        /** 0 - 100 */
        lightnessThreshold: number
      }
      shrink: {
        enabled: boolean
        /** Additional padding between shape and items, in percent (0 - 100) */
        amount: number
      }
      invert: {
        enabled: boolean
      }
      edges: {
        enabled: boolean
        /** In pixels, normalized to 300 x 300 canvas */
        blur: number
        /** 0-100, input for Canny algorithm */
        lowThreshold: number
        /** 0-100, input for Canny algorithm */
        highThreshold: number
      }
    }
  }
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
  generatedItems: GeneratedItem[]
}

export type GeneratedItem =
  | WordGeneratedItem
  | SymbolGeneratedItem
  | RasterGeneratedItem

export type RasterGeneratedItem = {
  kind: 'img'
  locked?: boolean
  index: number
  ctx: CanvasRenderingContext2D
  transform: paper.Matrix
}

export type SymbolGeneratedItem = {
  kind: 'symbol'
  locked?: boolean
  index: number
  shapeId: ShapeId
  shapeColor: string
  symbolDef: paper.SymbolDefinition
  transform: paper.Matrix
}

export type WordGeneratedItem = {
  kind: 'word'
  index: number
  text: string
  fontId: FontId
  transform: paper.Matrix
  wordConfigId: WordConfigId
  /** Color of the shape at the location where item was placed */
  shapeColor: string
}

// Perhaps it's not needed
export class WordInfo {
  id: WordInfoId
  wordConfigId: WordConfigId
  font: Font
  text: string
  // symbols: Symbol[]
  // symbolOffsets: number[]
  fontSize: number

  constructor(
    id: WordInfoId,
    wordConfigId: WordConfigId,
    text: string,
    font: Font,
    fontSize = FONT_SIZE
  ) {
    this.id = id
    this.wordConfigId = wordConfigId
    this.font = font
    this.text = text
    this.fontSize = fontSize
    // this.symbols = stringToSymbols(text, font, fontSize)

    // this.symbolOffsets = this.symbols.map(
    //   (symbol) =>
    //     (fontSize * symbol.glyph.advanceWidth) / this.font.otFont.unitsPerEm
    // )
  }

  // getSymbolPaths = (): Path[] => {
  //   const paths: Path[] = []
  //   let currentOffset = 0
  //   for (let i = 0; i < this.symbols.length; ++i) {
  //     paths.push(this.symbols[i].glyph.getPath(currentOffset, 0, this.fontSize))
  //     currentOffset += this.symbolOffsets[i]
  //   }
  //   return paths
  // }

  // draw = (ctx: CanvasRenderingContext2D) => {
  //   ctx.save()
  //   for (const [index, symbol] of this.symbols.entries()) {
  //     symbol.draw(ctx)
  //     ctx.translate(this.symbolOffsets[index], 0)
  //   }
  //   ctx.restore()
  // }
}

export class Symbol {
  glyph: Glyph
  font: Font
  id: string
  fontSize: number

  getPathData = (): string =>
    this.glyph.getPath(0, 0, this.fontSize).toPathData(3)

  constructor(font: Font, glyph: Glyph, fontSize = FONT_SIZE) {
    this.font = font
    this.fontSize = fontSize
    this.id = getSymbolAngleId(glyph, font)
    this.glyph = glyph
  }

  // draw = (ctx: CanvasRenderingContext2D) => {
  //   const path = this.glyph.getPath(0, 0, this.fontSize)
  //   // @ts-ignore
  //   path.fill = ctx.fillStyle
  //   path.draw(ctx)
  // }
}

export const getFontName = (font: Font): string => font.otFont.names.fullName.en

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
  fontSize: number = FONT_SIZE
): Symbol[] =>
  font.otFont
    .stringToGlyphs(text)
    .map((otGlyph) => new Symbol(font, otGlyph, fontSize))

export type Glyph = opentype.Glyph
export type Font = {
  otFont: opentype.Font
  id: FontId
  isCustom: boolean
}

export type WordInfoId = string
export type SymbolId = string
export type SymbolAngleId = string
