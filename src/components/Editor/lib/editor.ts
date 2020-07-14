import chroma, { Color } from 'chroma-js'
import { EditorStore } from 'components/Editor/editor-store'
import { computeColorsMap } from 'components/Editor/lib/colormap'
import {
  EditorItem,
  EditorItemConfig,
  EditorItemId,
} from 'components/Editor/lib/editor-item'
import {
  EditorItemConfigShape,
  EditorItemShape,
} from 'components/Editor/lib/editor-item-icon'
import {
  EditorItemConfigWord,
  EditorItemWord,
  GlyphInfo,
} from 'components/Editor/lib/editor-item-word'
import {
  applyTransformToObj,
  cloneFabricCanvas,
  cloneObj,
  cloneObjAsImage,
  createMultilineFabricTextGroup,
  getObjTransformMatrix,
  loadObjFromImg,
  loadObjFromSvgUrl,
  objAsCanvasElement,
  setFillColor,
  loadObjFromSvgString,
} from 'components/Editor/lib/fabric-utils'
import {
  Font,
  Generator,
  FillShapeTaskWordConfig,
} from 'components/Editor/lib/generator'
import { Shape, SvgShapeColorsMapEntry } from 'components/Editor/shape'
import {
  ShapeConf,
  ShapeId,
  ShapeTextConf,
  ShapeTextStyle,
  SvgProcessingConf,
  RasterProcessingConf,
} from 'components/Editor/shape-config'
import { BgStyleConf, ShapeStyleConf } from 'components/Editor/style'
import {
  UndoFrame,
  UndoItemUpdateFrame,
  UndoStack,
} from 'components/Editor/undo'
import { FontId } from 'data/fonts'
import { fabric } from 'fabric'
import {
  canvasToImgElement,
  copyCanvas,
  createCanvas,
  createCanvasCtxCopy,
  loadImageUrlToCanvasCtx,
  processRasterImg,
} from 'lib/wordart/canvas-utils'
import { loadFont } from 'lib/wordart/fonts'
import { flatten, groupBy, keyBy, max, min, sortBy } from 'lodash'
import { toJS, action, observable, computed } from 'mobx'
import { nanoid } from 'nanoid/non-secure'
import { BoundingBox, Glyph } from 'opentype.js'
import paper from 'paper'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { EditorPersistedData } from 'services/api/types'
import { waitAnimationFrame } from 'utils/async'
import { consoleLoggers } from 'utils/console-logger'
import { UniqIdGenerator } from 'utils/ids'
import { notEmpty } from 'utils/not-empty'
import { exhaustiveCheck } from 'utils/type-utils'
import { WordListEntry } from 'components/Editor/style-options'

export type EditorInitParams = {
  canvas: HTMLCanvasElement
  bgCanvas: HTMLCanvasElement
  canvasWrapperEl: HTMLElement
  aspectRatio: number
  store: EditorStore
  serialized?: EditorPersistedData

  onItemUpdated: (item: EditorItem, newTransform: MatrixSerialized) => void
  onItemSelected: (item: EditorItem) => void
  onItemSelectionCleared: () => void
}

type FontInfo = {
  font: Font
  glyphs: Map<string, { glyph: Glyph; path: opentype.Path; pathData: string }>
}

const PROGRESS_REPORT_RAF_WAIT_COUNT = 3

export type EditorMode = 'view' | 'edit'

export class Editor {
  logger = consoleLoggers.editor

  private params: EditorInitParams
  private store: EditorStore
  private generator: Generator
  mode: EditorMode = 'view'

  aspectRatio: number
  private editorItemIdGen = new UniqIdGenerator(3)

  /** Gets incremented after each change */
  version: number = 1
  /** Stable unique id of this wordlcoud */
  key = nanoid(32)

  /** Info about the current shape */
  shape: null | Shape = null

  undoStack = new UndoStack()
  @observable isUndoing = false

  items: {
    shape: {
      items: EditorItem[]
      itemsById: Map<EditorItemId, EditorItem>
      fabricObjToItem: Map<fabric.Object, EditorItem>
    }
    bg: {
      items: EditorItem[]
      itemsById: Map<EditorItemId, EditorItem>
      fabricObjToItem: Map<fabric.Object, EditorItem>
    }
  }
  /** Size of the scene in project coordinates */
  projectBounds: paper.Rectangle
  canvas: fabric.Canvas
  fontsInfo: Map<FontId, FontInfo> = new Map()

  itemsSelection = false
  shapeSelection = false
  bgCanvas: fabric.Canvas
  bgTransparentRect: fabric.Rect
  bgRect: fabric.Rect
  bgTransparentPattern: fabric.Pattern | undefined

  constructor(params: EditorInitParams) {
    this.params = params
    this.store = params.store
    this.generator = new Generator()

    paper.setup(new paper.Size({ width: 1, height: 1 }))
    this.bgCanvas = new fabric.Canvas(params.bgCanvas.id, {
      interactive: false,
      stopContextMenu: true,
    })
    this.canvas = new fabric.Canvas(params.canvas.id, {
      stopContextMenu: true,
      controlsAboveOverlay: true,
    })

    this.bgCanvas.getElement().parentElement!.style.position = 'absolute'
    this.canvas.getElement().parentElement!.style.position = 'absolute'

    this.canvas.selection = false
    this.bgCanvas.selection = false
    this.aspectRatio = this.params.aspectRatio

    this.bgCanvas.clear()
    this.bgTransparentRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: 1,
      height: 1,
      fill: 'transparent',
    })
    this.bgRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: 1,
      height: 1,
      fill: 'white',
    })
    this.bgCanvas.add(this.bgTransparentRect)
    this.bgCanvas.add(this.bgRect)

    this.canvas.on('selection:created', ({ e }) => {
      const target = this.canvas.getActiveObject()
      for (const targetKind of ['shape', 'bg'] as TargetKind[]) {
        const item = this.items[targetKind].fabricObjToItem.get(target)
        if (item && e?.type !== 'no-callbacks') {
          params.onItemSelected(item)
        }
      }
    })

    this.canvas.on('selection:updated', ({ e }) => {
      const target = this.canvas.getActiveObject()
      for (const targetKind of ['shape', 'bg'] as TargetKind[]) {
        const item = this.items[targetKind].fabricObjToItem.get(target)

        if (item && e?.type !== 'no-callbacks') {
          params.onItemSelected(item)
        }
      }
    })

    this.canvas.on('selection:cleared', ({ e }) => {
      if (e?.type !== 'no-callbacks') {
        params.onItemSelectionCleared()
      }
    })

    this.canvas.on('object:moving', (evt) => {
      const target = evt.target
      if (!target) {
        return
      }

      if (target === this.shape?.obj) {
        this.clearItems('shape')
        this.clearItems('bg')
      }
    })
    this.canvas.on('object:rotating', (evt) => {
      const target = evt.target
      if (!target) {
        return
      }

      if (target === this.shape?.obj) {
        this.clearItems('shape')
        this.clearItems('bg')
      }
    })
    this.canvas.on('object:scaling', (evt) => {
      const target = evt.target
      if (!target) {
        return
      }

      if (target === this.shape?.obj) {
        this.clearItems('shape')
        this.clearItems('bg')
      }
    })

    this.canvas.on('object:modified', (evt) => {
      const target = evt.target
      const { shape } = this
      console.log('obj:modified')
      if (!target) {
        return
      }

      if (
        target === shape?.obj &&
        (shape.kind === 'custom:svg' ||
          shape.kind === 'clipart:svg' ||
          shape.kind === 'icon') &&
        shape.objOriginalColors
      ) {
        const transform = getObjTransformMatrix(shape.obj)
        shape.transform = transform
        applyTransformToObj(shape.objOriginalColors, transform)
        this.store.renderKey++

        this.canvas.requestRenderAll()

        this.version++
      } else {
        for (const targetKind of ['shape', 'bg'] as TargetKind[]) {
          const item = this.items[targetKind].fabricObjToItem.get(target)
          if (item) {
            item.setLocked(true)
            const transform = getObjTransformMatrix(item.fabricObj)
            params.onItemUpdated(item, transform)
          }
        }

        this.version++
      }
    })
    this.canvas.renderOnAddRemove = false
    // @ts-ignore
    window['canvas'] = this.canvas

    this.projectBounds = new paper.Rectangle({
      x: 0,
      y: 0,
      width: 1000,
      height: 1000 / this.aspectRatio,
    })

    this.logger.debug(
      `Editor: init, ${params.canvas.width} x ${params.canvas.height}`
    )

    this.items = {
      shape: {
        items: [],
        itemsById: new Map(),
        fabricObjToItem: new Map(),
      },
      bg: {
        items: [],
        itemsById: new Map(),
        fabricObjToItem: new Map(),
      },
    }

    fabric.util.loadImage('/images/editor/transparent-bg.svg', (img) => {
      this.bgTransparentRect.set(
        'fill',
        new fabric.Pattern({
          source: img,
          repeat: 'repeat',
          patternTransform: new paper.Matrix().scale(0.4)
            .values as MatrixSerialized,
        })
      )
      this.bgCanvas.requestRenderAll()
    })

    window.addEventListener('resize', () => this.handleResize(true))
    this.handleResize()
  }

  exportAsSvg = async (): Promise<string> => {
    const canvas = await cloneFabricCanvas(this.canvas)
    let bgColor = (this.bgRect.fill as string) || 'transparent'

    const bgOpacity =
      this.store.styleOptions.bg.fill.kind === 'transparent'
        ? 0
        : this.store.styleOptions.bg.fill.color.opacity

    bgColor = chroma(bgColor).alpha(bgOpacity).hex('rgba')

    canvas.backgroundColor = bgColor
    return canvas.toSVG({
      viewBox: {
        x: 0,
        y: 0,
        width: this.projectBounds.width,
        height: this.projectBounds.height,
      },
      width: this.projectBounds.width,
      height: this.projectBounds.height,
    })
  }

  exportAsRaster = async (
    maxDimension = 1024,
    format: 'png' | 'jpeg' = 'png'
  ): Promise<HTMLCanvasElement> => {
    const aspect = this.projectBounds.width / this.projectBounds.height
    const resultCanvas = createCanvas(
      aspect > 1
        ? {
            w: maxDimension,
            h: maxDimension / aspect,
          }
        : {
            w: maxDimension * aspect,
            h: maxDimension,
          }
    )

    const bgCanvas = this.bgCanvas
    this.bgCanvas.backgroundColor = '#fff'
    this.bgTransparentRect.opacity = 0
    bgCanvas.renderAll()
    const canvas = this.canvas

    const exportCanvasScale = resultCanvas.width / 1000 / canvas.getZoom()

    const bgCanvasExported = (
      await loadImageUrlToCanvasCtx(
        bgCanvas.toDataURL({
          left:
            this.projectBounds.left / exportCanvasScale +
            bgCanvas.viewportTransform![4],
          top:
            this.projectBounds.top / exportCanvasScale +
            bgCanvas.viewportTransform![5],
          width: this.projectBounds.width * canvas.getZoom(),
          height: this.projectBounds.height * canvas.getZoom(),
          multiplier: exportCanvasScale,
        }),
        {}
      )
    ).canvas

    this.bgTransparentRect.opacity = 1
    this.bgCanvas.backgroundColor = '#ddd'
    bgCanvas.renderAll()

    const resultCtx = resultCanvas.getContext('2d')!

    const bgOpacity =
      this.store.styleOptions.bg.fill.kind === 'transparent'
        ? 0
        : this.store.styleOptions.bg.fill.color.opacity

    if (format === 'png') {
      resultCtx.globalAlpha = bgOpacity
    }

    copyCanvas(
      bgCanvasExported.getContext('2d')!,
      resultCtx,
      {
        x: 0,
        y: 0,
        w: bgCanvasExported.width,
        h: bgCanvasExported.height,
      },
      {
        x: 0,
        y: 0,
        w: resultCanvas.width,
        h: resultCanvas.height,
      }
    )

    resultCtx.globalAlpha = 1

    const canvasExported = (
      await loadImageUrlToCanvasCtx(
        canvas.toDataURL({
          left:
            this.projectBounds.left / exportCanvasScale +
            bgCanvas.viewportTransform![4],
          top:
            this.projectBounds.top / exportCanvasScale +
            bgCanvas.viewportTransform![5],
          width: this.projectBounds.width * canvas.getZoom(),
          height: this.projectBounds.height * canvas.getZoom(),
          multiplier: exportCanvasScale,
        }),
        {}
      )
    ).canvas

    copyCanvas(
      canvasExported.getContext('2d')!,
      resultCanvas.getContext('2d')!,
      {
        x: 0,
        y: 0,
        w: canvasExported.width,
        h: canvasExported.height,
      },
      {
        x: 0,
        y: 0,
        w: resultCanvas.width,
        h: resultCanvas.height,
      }
    )

    return resultCanvas
  }

  showLockBorders = (target: TargetKind) => {
    for (const [, item] of this.items[target].itemsById) {
      item.setLockBorderVisibility(true)
    }
    this.canvas.requestRenderAll()
  }

  hideLockBorders = (target: TargetKind) => {
    for (const [, item] of this.items[target].itemsById) {
      item.setLockBorderVisibility(false)
    }
    this.canvas.requestRenderAll()
  }

  enableItemsSelection = (target: TargetKind) => {
    this.itemsSelection = true
    for (const [, item] of this.items[target].itemsById) {
      if (item.fabricObj) {
        item.fabricObj.selectable = true
      }
    }
    this.enableSelectionMode()
    this.canvas.requestRenderAll()
  }
  disableItemsSelection = (target: TargetKind) => {
    this.itemsSelection = false
    for (const [, item] of this.items[target].itemsById) {
      if (item.fabricObj) {
        item.fabricObj.selectable = false
      }
    }
    this.deselectAll()
  }

  resetAllItems = (target: TargetKind) => {
    this.itemsSelection = false
    for (const [, item] of this.items[target].itemsById) {
      item.transform = item.generatedTransform
      applyTransformToObj(
        item.fabricObj,
        item.transform.values as MatrixSerialized
      )
      item.clearCustomColor()
      item.setLocked(false)
    }
    this.canvas.requestRenderAll()
    this.version++
  }

  setAspectRatio = (aspect: number, render = true) => {
    this.aspectRatio = aspect
    this.projectBounds = new paper.Rectangle({
      x: 0,
      y: 0,
      width: 1000,
      height: 1000 / this.aspectRatio,
    })
    this.handleResize(render)
    this.version++
  }

  get canvases() {
    return [this.bgCanvas, this.canvas]
  }

  removeSceneClipPath = () => {
    this.canvas.clipPath = undefined
  }

  applySceneClipPath = () => {
    const sceneClipPath = new fabric.Rect({
      left: 0,
      top: 0,
      width: 1000,
      height: 1000 / this.aspectRatio,
      fill: 'black',
    })
    this.canvas.clipPath = sceneClipPath
  }

  handleResize = (render = true) => {
    const wrapperBounds = this.params.canvasWrapperEl.getBoundingClientRect()

    for (const canvas of this.canvases) {
      if (wrapperBounds.width !== canvas.getWidth()) {
        canvas.setWidth(wrapperBounds.width)
      }
      if (wrapperBounds.height !== canvas.getHeight()) {
        canvas.setHeight(wrapperBounds.height)
      }
    }

    this.projectBounds = new paper.Rectangle({
      x: 0,
      y: 0,
      width: 1000,
      height: 1000 / this.aspectRatio,
    })

    this.bgRect.set({
      left: 0,
      top: 0,
      width: 1000,
      height: 1000 / this.aspectRatio,
    })
    this.bgTransparentRect.set({
      left: 0,
      top: 0,
      width: 1000,
      height: 1000 / this.aspectRatio,
    })

    this.applySceneClipPath()

    const pad = 20
    const zoomLevel = Math.min(
      (this.canvas.getWidth() - 2 * pad) / 1000,
      (this.canvas.getHeight() - 2 * pad) / (1000 / this.aspectRatio)
    )

    for (const canvas of this.canvases) {
      canvas.setZoom(zoomLevel)

      // @ts-ignore
      canvas.viewportTransform[4] = (canvas.getWidth() - zoomLevel * 1000) / 2
      // @ts-ignore
      canvas.viewportTransform[5] =
        (canvas.getHeight() - zoomLevel * (1000 / this.aspectRatio)) / 2

      if (render) {
        canvas.requestRenderAll()
      }
    }
  }

  setBgOpacity = (opacity: number, render = true) => {
    this.logger.debug('setBgOpacity', opacity, render)

    this.bgRect.set({
      opacity,
    })
    if (render) {
      this.bgCanvas.requestRenderAll()
    }
  }

  setBgColor = (config: BgStyleConf['fill'], render = true) => {
    this.logger.debug(
      'setBgColor',
      toJS(config, { recurseEverything: true }),
      render
    )
    this.bgCanvas.backgroundColor = '#ddd'
    this.canvas.backgroundColor = 'transparent'
    this.bgRect.set({
      fill: config.kind === 'transparent' ? 'transparent' : config.color,
    })

    if (render) {
      this.bgCanvas.requestRenderAll()
      this.canvas.requestRenderAll()
    }
  }

  updateRasterShapeColors = (config: RasterProcessingConf) => {
    // @TODO
    throw new Error('not implemented')
  }

  updateBlobShapeColors = async (color: string) => {
    if (this.shape?.kind !== 'blob') {
      console.error(
        `Unexpected shape type: expected blob, got ${this.shape?.kind}`
      )
      return
    }

    if (!this.shape.obj) {
      return
    }

    const shapeObj = this.shape.obj
    setFillColor(shapeObj, color)
  }

  updateFullCanvasShapeColors = async (color: string) => {
    if (this.shape?.kind !== 'full-canvas') {
      console.error(
        `Unexpected shape type: expected full-canvas, got ${this.shape?.kind}`
      )
      return
    }

    if (!this.shape.obj) {
      return
    }

    const shapeObj = this.shape.obj
    setFillColor(shapeObj, color)
  }

  updateTextShapeColors = async (textStyle: ShapeTextStyle) => {
    if (this.shape?.kind !== 'text') {
      console.error(
        `Unexpected shape type: expected text, got ${this.shape?.kind}`
      )
      return
    }

    if (!this.shape.obj) {
      return
    }

    const shapeObj = this.shape.obj
    setFillColor(shapeObj, textStyle.color)
  }

  updateIconShapeColors = async (color: string) => {
    if (this.shape?.kind !== 'icon') {
      console.error(
        `Unexpected shape type: expected icon, got ${this.shape?.kind}`
      )
      return
    }

    if (!this.shape.obj) {
      return
    }

    const shapeObj = this.shape.obj
    setFillColor(shapeObj, color)
  }

  updateSvgShapeColors = async (config: SvgProcessingConf) => {
    if (
      this.shape?.kind !== 'clipart:svg' &&
      this.shape?.kind !== 'custom:svg' &&
      this.shape?.kind !== 'icon'
    ) {
      console.error(
        `Unexpected shape type: expected svg, got ${this.shape?.kind}, shape id: ${this.shape}`
      )
      return
    }

    if (!this.shape.obj || !this.shape.objOriginalColors) {
      return
    }

    let shapeObj = await cloneObj(this.shape.objOriginalColors)
    shapeObj.selectable = false
    shapeObj.opacity = this.shape.obj.opacity || 1
    const { colors } = config

    if (colors.kind === 'original') {
      // do nothing
    } else if (colors.kind === 'color-map') {
      const colorsMap = computeColorsMap(shapeObj)

      this.logger.debug('>  Using color map', colorsMap)
      colorsMap.forEach((colorEntry, entryIndex) => {
        this.logger.debug(
          `>    Setting color to ${colors.colors[entryIndex]}, ${colorEntry.color} for ${colorEntry.objs.length} items...`
        )
        colorEntry.objs.forEach((item) => {
          const color = colors.colors[entryIndex] || colorEntry.color
          if (colorEntry.fill) {
            item.set({ fill: color })
          }
          if (colorEntry.stroke && item.stroke) {
            item.set({ stroke: color })
          }
        })
      })
    } else {
      this.logger.debug('>  Using single color')
      setFillColor(shapeObj, colors.color)
    }

    this.canvas.remove(this.shape.obj)
    this.canvas.insertAt(shapeObj, 0, false)

    this.shape.obj = shapeObj
  }

  updateShapeColors = async (config: ShapeConf, render = true) => {
    this.logger.debug(
      'updateShapeColors',
      render,
      toJS(config, { recurseEverything: true })
    )
    if (!this.shape) {
      this.logger.debug('>  No current shape, early exit')
      return
    }
    if (config.kind === 'clipart:raster' || config.kind === 'custom:raster') {
      this.updateRasterShapeColors(config.processing)
    }
    if (config.kind === 'clipart:svg' || config.kind === 'custom:svg') {
      this.updateSvgShapeColors(config.processing)
    }
    if (config.kind === 'text') {
      this.updateTextShapeColors(config.textStyle)
    }
    if (config.kind === 'icon') {
      this.updateIconShapeColors(config.color)
    }
    if (config.kind === 'blob') {
      this.updateBlobShapeColors(config.color)
    }
    if (config.kind === 'full-canvas') {
      this.updateFullCanvasShapeColors(config.color)
    }
    if (render) {
      this.canvas.requestRenderAll()
    }

    this.version++
  }

  setShapeOpacity = (opacity: number, render = true) => {
    this.logger.debug('setShapeOpacity', opacity)
    if (!this.shape) {
      return
    }
    this.shape.obj.set({ opacity })
    if (render) {
      this.canvas.requestRenderAll()
    }

    this.version++
  }

  setBgItemsStyle = async (
    itemsStyleConf: BgStyleConf['items'],
    render = true
  ) => {
    this.setItemsStyle('bg', itemsStyleConf, render)
    this.version++
  }
  setShapeItemsStyle = async (
    itemsStyleConf: ShapeStyleConf['items'],
    render = true
  ) => {
    this.setItemsStyle('shape', itemsStyleConf, render)
    this.version++
  }

  setItemsStyle = async (
    target: TargetKind,
    itemsStyleConf: BgStyleConf['items'] | ShapeStyleConf['items'],
    render = true
  ) => {
    const { coloring, dimSmallerItems, brightness } = itemsStyleConf
    const { items } = this.items[target]
    this.logger.debug(
      'setItemsStyle',
      target,
      toJS(coloring, { recurseEverything: true }),
      `${items.length} items`
    )

    let colors: string[] = []
    if (coloring.kind === 'gradient' || coloring.kind === 'color') {
      if (coloring.kind === 'color') {
        colors = coloring.colors
      } else if (coloring.kind === 'gradient') {
        const scale = chroma.scale([
          coloring.gradient.from,
          coloring.gradient.to,
        ])
        colors = scale.colors(20)
      }
    } else if (coloring.kind === 'shape') {
      // TODO
    }

    const itemAreas = items.map((item) => {
      if (item.kind === 'word') {
        const wordPathBb = item.pathBounds!
        const scaling = item.transform.scaling
        const wordH = (wordPathBb.y2 - wordPathBb.y1) * scaling.y
        const wordW = (wordPathBb.x2 - wordPathBb.x1) * scaling.x
        const wordArea = Math.sqrt(wordH * wordW)
        return wordArea
      }
      if (item.kind === 'shape') {
        const bounds = item.bounds
        const scaling = item.transform.scaling
        const wordH = bounds.width * scaling.y
        const wordW = bounds.height * scaling.x
        const wordArea = Math.sqrt(Math.sqrt(wordH * wordW))
        return wordArea
      }
      return 0
    })
    const maxArea = max(itemAreas)!
    const minArea = min(itemAreas)!
    let colorIndex = 0

    // const rng = seedrandom('fill color')
    let shapeRaster: fabric.Image | undefined
    let shapeRasterImgData: ImageData | undefined
    const dimSmallerFactor = dimSmallerItems / 100
    if ((!shapeRaster || !shapeRasterImgData) && this.shape?.obj) {
      shapeRaster = await cloneObjAsImage(this.shape.obj)
    }

    const shape = this.shape

    for (let i = 0; i < items.length; ++i) {
      const item = items[i]
      const area = itemAreas[i]

      if (!shape) {
        continue
      }

      if (item.kind !== 'word' && item.kind !== 'shape') {
        continue
      }

      let color: Color | undefined

      if (item.kind === 'word') {
        const wordConfig = itemsStyleConf.words.wordList.find(
          (wc) => wc.id === item.wordConfigId
        )

        // Use custom color for that word
        if (wordConfig && wordConfig.color != null) {
          const paperColor = new paper.Color(wordConfig.color)
          color = chroma.rgb(
            255 * paperColor.red,
            255 * paperColor.green,
            255 * paperColor.blue
          )
        }
      }

      if (!color) {
        if (coloring.kind === 'gradient' || coloring.kind === 'color') {
          // const index = Math.floor(rng() * colors.length)
          color = chroma(colors[colorIndex])
          colorIndex = (colorIndex + 1) % colors.length
        } else if (coloring.kind === 'shape') {
          if (shape.kind === 'custom:svg' || shape.kind === 'clipart:svg') {
            if (shape.config.processing.colors.kind === 'single-color') {
              const shapeColor = new paper.Color(
                shape.config.processing.colors.color
              )
              color = chroma.rgb(
                255 * shapeColor.red,
                255 * shapeColor.green,
                255 * shapeColor.blue
              )
            } else if (shape.config.processing.colors.kind === 'color-map') {
              const colorMapSorted = sortBy(
                shape.originalColors.map((color, index) => ({
                  color,
                  index,
                })),
                ({ color }) => chroma.distance(color, item.shapeColor, 'rgb')
              )
              const shapeColorStringIndex = colorMapSorted[0].index
              const shapeColorString =
                shape.config.processing.colors.colors[shapeColorStringIndex]
              const shapeColor = new paper.Color(shapeColorString)
              color = chroma.rgb(
                255 * shapeColor.red,
                255 * shapeColor.green,
                255 * shapeColor.blue
              )
            } else if (shape.config.processing.colors.kind === 'original') {
              const shapeColor = new paper.Color(item.shapeColor)
              color = chroma.rgb(
                255 * shapeColor.red,
                255 * shapeColor.green,
                255 * shapeColor.blue
              )
            }
          } else if (shape.kind === 'icon') {
            const shapeColor = new paper.Color(shape.config.color)
            color = chroma.rgb(
              255 * shapeColor.red,
              255 * shapeColor.green,
              255 * shapeColor.blue
            )
          } else if (
            shape.kind === 'custom:raster' ||
            shape.kind === 'clipart:raster'
          ) {
            let colorString = item.shapeColor
            if (shape.config.processing?.invert) {
              colorString = shape.config.processing.invert.color
            }
            color = chroma(colorString)
          } else if (shape.kind === 'text') {
            const shapeColor = new paper.Color(shape.config.textStyle.color)
            color = chroma.rgb(
              255 * shapeColor.red,
              255 * shapeColor.green,
              255 * shapeColor.blue
            )
          } else if (shape.kind === 'blob') {
            const shapeColor = new paper.Color(shape.config.color)
            color = chroma.rgb(
              255 * shapeColor.red,
              255 * shapeColor.green,
              255 * shapeColor.blue
            )
          } else if (shape.kind === 'full-canvas') {
            const shapeColor = new paper.Color(shape.config.color)
            color = chroma.rgb(
              255 * shapeColor.red,
              255 * shapeColor.green,
              255 * shapeColor.blue
            )
          }
        } else {
          exhaustiveCheck(coloring)
        }

        if (brightness != 0) {
          color = color!
            .brighten((2 * brightness) / 100)
            .saturate(-(0.2 * brightness) / 100)
        }
      }

      const hex = color!.hex()
      item.setColor(hex)

      item.setOpacity(
        ((dimSmallerFactor * (area - minArea)) / (maxArea - minArea) +
          (1 - dimSmallerFactor)) *
          itemsStyleConf.opacity
      )
    }

    if (render) {
      this.canvas.requestRenderAll()
    }

    this.version++
  }

  /** Sets the shape, clearing the project */
  setShape = async (params: {
    shapeConfig: ShapeConf
    bgFillStyle: BgStyleConf['fill']
    shapeStyle: ShapeStyleConf
    clear: boolean
    updateShapeColors?: boolean
    render?: boolean
  }) => {
    console.log('setShape', params)
    const { shapeConfig, updateShapeColors = true, render = true } = params

    if (!shapeConfig) {
      throw new Error('Missing shape config')
    }
    this.logger.debug('setShape', toJS(params, { recurseEverything: true }))

    let colorMap: SvgShapeColorsMapEntry[] | undefined
    let shapeObj: fabric.Object | undefined
    let shape: Shape | undefined

    // Process the shape...
    if (
      shapeConfig.kind === 'clipart:svg' ||
      shapeConfig.kind === 'custom:svg' ||
      shapeConfig.kind === 'icon'
    ) {
      shapeObj = await loadObjFromSvgUrl(shapeConfig.url)

      colorMap = computeColorsMap(shapeObj as fabric.Group)

      shape = {
        // @ts-ignore
        config: shapeConfig,
        // @ts-ignore
        kind: shapeConfig.kind,
        obj: shapeObj,
        objOriginalColors: shapeObj,
        customColors: colorMap.map((c) => c.color),
        originalColors: colorMap.map((c) => c.color),
        transform: new paper.Matrix().values as MatrixSerialized,
        originalTransform: new paper.Matrix().values as MatrixSerialized,
        url: shapeConfig.url,
        colorMap,
      }
    } else if (
      shapeConfig.kind === 'custom:raster' ||
      shapeConfig.kind === 'clipart:raster'
    ) {
      shapeObj = await loadObjFromImg(shapeConfig.url)
      const originalCanvas = objAsCanvasElement(shapeObj)
      const processedCanvas = objAsCanvasElement(shapeObj)

      if (shapeConfig.processing) {
        processRasterImg(processedCanvas, shapeConfig.processing)
      }
      shapeObj = new fabric.Image(canvasToImgElement(processedCanvas))

      shape = {
        // @ts-ignore
        config: shapeConfig,
        // @ts-ignore
        kind: shapeConfig.kind,
        obj: shapeObj,
        transform: new paper.Matrix().values as MatrixSerialized,
        originalTransform: new paper.Matrix().values as MatrixSerialized,
        url: shapeConfig.url,
        originalCanvas,
        processedCanvas,
      }
    } else if (shapeConfig.kind === 'text') {
      const font = await this.store.fetchFontById(shapeConfig.textStyle.fontId)
      const group = createMultilineFabricTextGroup(
        shapeConfig.text,
        font!,
        100,
        shapeConfig.textStyle.color
      )
      group.setPositionByOrigin(
        new fabric.Point(
          this.canvas.getWidth() / 2,
          this.canvas.getHeight() / 2
        ),
        'center',
        'center'
      )
      shapeObj = group

      shape = {
        config: shapeConfig,
        kind: 'text',
        transform: new paper.Matrix().values as MatrixSerialized,
        originalTransform: new paper.Matrix().values as MatrixSerialized,
        obj: shapeObj,
      }
    } else if (shapeConfig.kind === 'blob') {
      const pathObj = new fabric.Path(shapeConfig.pathData)
      shapeObj = new fabric.Group([pathObj])

      shape = {
        kind: 'blob',
        config: shapeConfig,
        transform: new paper.Matrix().values as MatrixSerialized,
        originalTransform: new paper.Matrix().values as MatrixSerialized,
        obj: shapeObj,
      }
    } else if (shapeConfig.kind === 'full-canvas') {
      const pathObj = new fabric.Rect({
        left: this.projectBounds.left,
        top: this.projectBounds.top,
        width: this.projectBounds.width,
        height: this.projectBounds.height,
        fill: shapeConfig.color,
      })
      shapeObj = new fabric.Group([pathObj])

      shape = {
        kind: 'full-canvas',
        config: shapeConfig,
        transform: new paper.Matrix().values as MatrixSerialized,
        originalTransform: new paper.Matrix().values as MatrixSerialized,
        obj: shapeObj,
      }
    }

    if (!shapeObj) {
      throw new Error('no shape obj')
    }

    const shouldAutoScale = shapeConfig.kind !== 'full-canvas'

    if (shouldAutoScale) {
      const w = shapeObj.width!
      const h = shapeObj.height!
      const defaultPadding = 50

      const sceneBounds = this.getSceneBounds(defaultPadding)
      if (Math.max(w, h) !== Math.max(sceneBounds.width, sceneBounds.height)) {
        const scale =
          w / h > sceneBounds.width / sceneBounds.height
            ? sceneBounds.width / w
            : sceneBounds.height / h
        shapeObj.set({ scaleX: scale, scaleY: scale })
      }

      shapeObj.setPositionByOrigin(
        new fabric.Point(
          sceneBounds.left + sceneBounds.width / 2,
          sceneBounds.top + sceneBounds.height / 2
        ),
        'center',
        'center'
      )
    }

    const { shapeStyle, bgFillStyle } = params

    if (params.clear) {
      this.clear(params.render)
    }
    this.setBgColor(bgFillStyle, render)

    shapeObj.set({
      opacity: shapeStyle.opacity,
      selectable: false,
    })
    shapeObj.bringToFront()
    if (this.shape?.obj) {
      this.canvas.remove(this.shape.obj)
    }
    if (render) {
      this.canvas.clear()
    }
    this.canvas.add(shapeObj)

    if (
      shape?.kind === 'clipart:svg' ||
      shape?.kind === 'custom:svg' ||
      shape?.kind === 'icon'
    ) {
      const shapeCopyObj = await cloneObj(shapeObj)
      shapeCopyObj.set({ selectable: false })
      shape.objOriginalColors = shapeCopyObj
    }

    this.shape = shape!

    this.shape.originalTransform = getObjTransformMatrix(this.shape.obj)
    this.shape.transform = getObjTransformMatrix(this.shape.obj)

    if (updateShapeColors) {
      this.updateShapeColors(this.shape.config, render)
    }

    if (render) {
      this.canvas.requestRenderAll()
    }

    return { colorsMap: colorMap }
  }

  getSceneBounds = (pad = 20): paper.Rectangle =>
    new paper.Rectangle({
      x: this.projectBounds.left + pad,
      y: this.projectBounds.top + pad,
      width: this.projectBounds.width - pad * 2,
      height: this.projectBounds.height - pad * 2,
    })

  /** Returns list of items in paint order (order: bottom to front) */
  getItemsSorted = (target: TargetKind): EditorItem[] => {
    const fabricObjToItem =
      target === 'shape'
        ? this.items.shape.fabricObjToItem
        : this.items.bg.fabricObjToItem
    const objsSet = new Set(fabricObjToItem.keys())

    const objs = this.canvas.getObjects().filter((obj) => objsSet.has(obj))
    const items = objs.map((obj) => fabricObjToItem.get(obj)!)
    return items
  }

  deleteNonLockedShapeItems = async () => {
    const oldItemsToDelete = [...this.items.shape.itemsById.values()].filter(
      (item) => !item.locked
    )
    this.canvas.remove(
      ...flatten(
        oldItemsToDelete.map((item) => [
          item.fabricObj,
          ...item.fabricObj.getObjects(),
        ])
      )
    )
    oldItemsToDelete.forEach((i) => this.items.shape.itemsById.delete(i.id))
  }

  // addShapeItems = async (itemConfigs: EditorItemConfig[]) => {
  //   let { items, itemsById, fabricObjToItem } = await this.convertToEditorItems(
  //     itemConfigs
  //   )
  //   const oldItemsToKeep = [...this.items.shape.items]
  //   for (const item of oldItemsToKeep) {
  //     itemsById.set(item.id, item)
  //     fabricObjToItem.set(item.fabricObj, item)
  //   }

  //   const objs = items.map((item) => item.fabricObj)
  //   this.canvas.add(...objs)
  //   this.canvas.requestRenderAll()

  //   this.items.shape = {
  //     items: [...oldItemsToKeep, ...items],
  //     itemsById,
  //     fabricObjToItem,
  //   }
  // }

  setShapeItems = (itemConfigs: EditorItemConfig[], render = true) =>
    this.setItems('shape', itemConfigs, render)

  setBgItems = (itemConfigs: EditorItemConfig[], render = true) =>
    this.setItems('bg', itemConfigs, render)

  private setItems = async (
    target: TargetKind,
    itemConfigs: EditorItemConfig[],
    render = true
  ) => {
    if (!this.shape?.obj) {
      console.error('No shape')
      return
    }
    const {
      items,
      itemsById,
      fabricObjToItem,
    } = await this.convertToEditorItems(itemConfigs)

    const oldItemsToDelete = [...this.items[target].itemsById.values()].filter(
      (item) => !item.locked
    )
    const oldItemsToKeep = [...this.items[target].itemsById.values()].filter(
      (item) => item.locked
    )

    for (const item of oldItemsToKeep) {
      itemsById.set(item.id, item)
      fabricObjToItem.set(item.fabricObj, item)
    }

    this.canvas.remove(
      ...flatten(
        oldItemsToDelete.map((item) => [
          item.fabricObj,
          ...item.fabricObj.getObjects(),
        ])
      )
    )

    const objs = items.map((item) => item.fabricObj)
    this.canvas.add(...objs)
    if (render) {
      this.canvas.requestRenderAll()
    }

    this.items[target] = {
      items,
      itemsById,
      fabricObjToItem,
    }
  }

  cancelVisualization = () => {
    this.generator.isCancelled = true
  }

  generateBgItems = async (params: { style: BgStyleConf }) => {
    const { style } = params
    this.store.visualizeAnimatedLastTime = new Date()
    this.logger.debug('generateBgItems')
    if (!this.shape?.obj) {
      console.error('No shape obj')
      return
    }

    const stateBefore = this.store.getStateSnapshot()
    const persistedDataBefore = await this.store.serialize()

    const shapeObj = this.shape.obj
    const shapeOriginalColorsObj =
      this.shape.kind === 'clipart:svg' ||
      this.shape.kind === 'custom:svg' ||
      this.shape.kind === 'icon'
        ? this.shape.objOriginalColors
        : this.shape.obj

    if (!shapeOriginalColorsObj) {
      console.error('No shapeOriginalColorsObj')
      return
    }

    const defaultFontIds = style.items.words.fontIds
    const allUsedFontIds = [
      ...new Set([
        ...defaultFontIds,
        ...style.items.words.wordList.map((w) => w.fontId).filter(notEmpty),
      ]),
    ]
    await this.fetchFonts(allUsedFontIds)
    const defaultFonts: Font[] = await this.fetchFonts(defaultFontIds)

    const { processedWordList, langCheckErrors } = this.processWordList({
      wordConfigs: style.items.words.wordList,
      defaultFonts,
      defaultAngles: style.items.words.angles,
    })

    if (langCheckErrors.length > 0) {
      this.store.isVisualizing = false
      this.store.langCheckErrors = langCheckErrors
      return
    }

    this.store.visualizingStep = 'generating'
    this.store.visualizingProgress = 0
    this.store.isVisualizing = true
    for (let i = 0; i < PROGRESS_REPORT_RAF_WAIT_COUNT; ++i) {
      await waitAnimationFrame()
    }
    await this.generator.init()

    const shapeClone = await cloneObj(shapeObj)
    shapeClone.set({ opacity: 1 })
    const shapeImage = await cloneObjAsImage(shapeClone)

    const shapeCanvas = objAsCanvasElement(shapeImage)

    const sceneBounds = this.getSceneBounds(0)
    const sceneCanvas = createCanvas({
      w: sceneBounds.width,
      h: sceneBounds.height,
    })

    sceneCanvas
      .getContext('2d')!
      .drawImage(
        shapeCanvas,
        shapeObj.getBoundingRect(true).left,
        shapeObj.getBoundingRect(true).top
      )

    const sceneCanvasOriginalColors = createCanvasCtxCopy(
      sceneCanvas.getContext('2d')!
    )
    copyCanvas(sceneCanvas.getContext('2d')!, sceneCanvasOriginalColors)

    let canvasSubtract: HTMLCanvasElement | undefined
    const lockedItems = this.getItemsSorted('bg').filter((i) => i.locked)
    if (lockedItems.length > 0) {
      canvasSubtract = createCanvas({
        w: sceneBounds.width,
        h: sceneBounds.height,
      })
      const ctx = canvasSubtract.getContext('2d')!
      for (const item of lockedItems) {
        ctx.save()
        const saved = item.isShowingLockBorder
        item.setLockBorderVisibility(false)
        item.fabricObj.drawObject(ctx)
        item.setLockBorderVisibility(saved)
        ctx.restore()
      }
    }

    const shapeConfig = this.store.getSelectedShapeConf()
    const wordConfigsById = keyBy(style.items.words.wordList, 'id')

    const enableRemoveWhiteBg =
      shapeConfig.kind === 'custom:raster' ||
      shapeConfig.kind === 'clipart:raster'
    const enableEdges =
      (shapeConfig.kind === 'custom:raster' ||
        shapeConfig.kind === 'clipart:raster' ||
        shapeConfig.kind === 'custom:svg' ||
        shapeConfig.kind === 'clipart:svg') &&
      shapeConfig.processing?.edges != null
    const edgesAmount =
      shapeConfig.kind === 'custom:raster' ||
      shapeConfig.kind === 'clipart:raster' ||
      shapeConfig.kind === 'custom:svg' ||
      shapeConfig.kind === 'clipart:svg'
        ? shapeConfig.processing?.edges?.amount
        : 0

    const randomIconAngles = new Array(8)
      .fill(null)
      .map(() => Math.round(360 * Math.random()))

    const result = await this.generator.fillShape(
      {
        shape: {
          canvas: sceneCanvas,
          canvasSubtract,
          shapeCanvasOriginalColors: sceneCanvasOriginalColors.canvas,
          bounds: sceneBounds,
          processing: {
            removeWhiteBg: {
              enabled: enableRemoveWhiteBg,
              lightnessThreshold: 98,
            },
            shrink: {
              enabled: style.items.placement.shapePadding > 0,
              amount: style.items.placement.shapePadding,
            },
            edges: {
              enabled: enableEdges,
              blur:
                (17 *
                  (1 -
                    (enableEdges && edgesAmount != null ? edgesAmount : 0))) /
                100,
              lowThreshold: 30,
              highThreshold: 100,
            },
            invert: {
              enabled: true,
            },
          },
        },
        itemPadding: Math.max(1, 100 - style.items.placement.itemDensity),
        // Words
        wordsMaxSize: style.items.placement.wordsMaxSize,
        words: processedWordList,
        // Icons
        icons: style.items.icons.iconList.map((icon) => ({
          shape: this.store.getIconShapeConfById(icon.shapeId)!,
          angles: style.items.placement.iconsRandomAngle
            ? randomIconAngles
            : [0],
          repeats: icon.repeats ?? -1,
        })),
        iconsMaxSize: style.items.placement.iconsMaxSize,
        iconProbability: style.items.placement.iconsProportion / 100,
      },
      async (batch, progressPercent) => {
        this.store.visualizingProgress = progressPercent
        for (let i = 0; i < PROGRESS_REPORT_RAF_WAIT_COUNT; ++i) {
          await waitAnimationFrame()
        }
      }
    )

    if (result.status !== 'finished') {
      this.store.isVisualizing = false
      return
    }

    const items: EditorItemConfig[] = []

    for (const genItem of result.generatedItems) {
      if (genItem.kind === 'word') {
        const wordConfig = wordConfigsById[genItem.wordConfigId]
        items.push({
          ...genItem,
          color: 'black',
          locked: false,
          text: wordConfig.text,
        })
      } else if (genItem.kind === 'shape') {
        items.push({
          ...genItem,
          color: 'black',
          locked: false,
        })
      }
    }

    await this.setBgItems(items)
    await this.setBgItemsStyle(style.items)
    this.store.isVisualizing = false

    const persistedDataAfter = await this.store.serialize()

    this.pushUndoFrame({
      kind: 'visualize',
      dataBefore: persistedDataBefore,
      dataAfter: persistedDataAfter,
      stateBefore,
      stateAfter: this.store.getStateSnapshot(),
      versionAfter: this.version + 1,
      versionBefore: this.version,
    })
    this.version++

    this.store.renderKey++
  }

  generateShapeItems = async (params: { style: ShapeStyleConf }) => {
    const { style } = params
    this.logger.debug('generateShapeItems')
    this.store.visualizeAnimatedLastTime = new Date()
    if (!this.shape?.obj) {
      console.error('No shape obj')
      return
    }

    const stateBefore = this.store.getStateSnapshot()
    const persistedDataBefore = await this.store.serialize()

    const shapeObj = this.shape.obj
    const shapeOriginalColorsObj =
      this.shape.kind === 'clipart:svg' ||
      this.shape.kind === 'custom:svg' ||
      this.shape.kind === 'icon'
        ? this.shape.objOriginalColors
        : this.shape.obj

    if (!shapeOriginalColorsObj) {
      console.error('No shapeOriginalColorsObj')
      return
    }

    this.store.visualizingStep = 'generating'
    this.store.visualizingProgress = 0
    this.store.isVisualizing = true
    for (let i = 0; i < PROGRESS_REPORT_RAF_WAIT_COUNT; ++i) {
      await waitAnimationFrame()
    }

    const defaultFontIds = style.items.words.fontIds
    const allUsedFontIds = [
      ...new Set([
        ...defaultFontIds,
        ...style.items.words.wordList.map((w) => w.fontId).filter(notEmpty),
      ]),
    ]
    await this.fetchFonts(allUsedFontIds)
    const defaultFonts: Font[] = await this.fetchFonts(defaultFontIds)

    const { processedWordList, langCheckErrors } = this.processWordList({
      wordConfigs: style.items.words.wordList,
      defaultFonts,
      defaultAngles: style.items.words.angles,
    })

    if (langCheckErrors.length > 0) {
      this.store.isVisualizing = false
      this.store.langCheckErrors = langCheckErrors
      return
    }

    await this.generator.init()

    const shapeClone = await cloneObj(shapeObj)
    shapeClone.set({ opacity: 1 })
    const shapeImage = await cloneObjAsImage(shapeClone)

    const shapeCanvas = objAsCanvasElement(shapeImage)
    const shapeCanvasOriginalColors = objAsCanvasElement(shapeOriginalColorsObj)

    let canvasSubtract: HTMLCanvasElement | undefined
    const lockedItems = this.getItemsSorted('shape').filter((i) => i.locked)
    if (lockedItems.length > 0) {
      canvasSubtract = createCanvas({
        w: shapeCanvas.width,
        h: shapeCanvas.height,
      })
      const ctx = canvasSubtract.getContext('2d')!
      for (const item of lockedItems) {
        ctx.save()
        ctx.translate(
          -shapeObj.getBoundingRect(true).left || 0,
          -shapeObj.getBoundingRect(true).top || 0
        )
        const saved = item.isShowingLockBorder
        item.setLockBorderVisibility(false)
        item.fabricObj.drawObject(ctx)
        item.setLockBorderVisibility(saved)
        ctx.restore()
      }
    }

    const shapeRasterBounds = new paper.Rectangle(
      shapeObj.getBoundingRect(true).left || 0,
      shapeObj.getBoundingRect(true).top || 0,
      shapeCanvas.width,
      shapeCanvas.height
    )

    const shapeConfig = this.store.getSelectedShapeConf()
    const wordConfigsById = keyBy(style.items.words.wordList, 'id')

    // @TODO: don't remove edges for single-color SVG shapes
    const enableRemoveWhiteBg =
      shapeConfig.kind === 'custom:raster' ||
      shapeConfig.kind === 'clipart:raster'
    const enableEdges =
      (shapeConfig.kind === 'custom:raster' ||
        shapeConfig.kind === 'clipart:raster' ||
        shapeConfig.kind === 'custom:svg' ||
        shapeConfig.kind === 'clipart:svg') &&
      shapeConfig.processing?.edges != null
    const edgesAmount =
      shapeConfig.kind === 'custom:raster' ||
      shapeConfig.kind === 'clipart:raster' ||
      shapeConfig.kind === 'custom:svg' ||
      shapeConfig.kind === 'clipart:svg'
        ? shapeConfig.processing?.edges?.amount
        : 0

    const randomIconAngles = new Array(8)
      .fill(null)
      .map(() => Math.round(360 * Math.random()))

    const result = await this.generator.fillShape(
      {
        shape: {
          canvas: shapeCanvas,
          canvasSubtract,
          shapeCanvasOriginalColors,
          bounds: shapeRasterBounds,
          processing: {
            removeWhiteBg: {
              enabled: enableRemoveWhiteBg,
              lightnessThreshold: 98,
            },
            shrink: {
              enabled: style.items.placement.shapePadding > 0,
              amount: style.items.placement.shapePadding,
            },
            edges: {
              enabled: enableEdges,
              blur:
                (17 *
                  (1 -
                    (enableEdges && edgesAmount != null ? edgesAmount : 0))) /
                100,
              lowThreshold: 30,
              highThreshold: 100,
            },
            invert: {
              enabled: false,
            },
          },
        },
        itemPadding: Math.max(1, 100 - style.items.placement.itemDensity),
        // Words
        wordsMaxSize: style.items.placement.wordsMaxSize,
        words: processedWordList,
        // Icons
        icons: style.items.icons.iconList.map((icon) => ({
          shape: this.store.getIconShapeConfById(icon.shapeId)!,
          angles: style.items.placement.iconsRandomAngle
            ? randomIconAngles
            : [0],
          repeats: icon.repeats ?? -1,
        })),
        iconsMaxSize: style.items.placement.iconsMaxSize,
        iconProbability: style.items.placement.iconsProportion / 100,
      },
      async (batch, progressPercent) => {
        this.store.visualizingProgress = progressPercent
        for (let i = 0; i < PROGRESS_REPORT_RAF_WAIT_COUNT; ++i) {
          await waitAnimationFrame()
        }
      }
    )

    if (result.status !== 'finished') {
      this.store.isVisualizing = false
      return
    }

    const items: EditorItemConfig[] = []

    for (const genItem of result.generatedItems) {
      if (genItem.kind === 'word') {
        const wordConfig = wordConfigsById[genItem.wordConfigId]
        items.push({
          ...genItem,
          color: 'black',
          locked: false,
          text: wordConfig.text,
        })
      } else if (genItem.kind === 'shape') {
        items.push({
          ...genItem,
          color: 'black',
          locked: false,
        })
      }
    }

    await this.setShapeItems(items)
    await this.setShapeItemsStyle(style.items)
    this.store.isVisualizing = false

    const persistedDataAfter = await this.store.serialize()

    this.pushUndoFrame({
      kind: 'visualize',
      dataBefore: persistedDataBefore,
      dataAfter: persistedDataAfter,
      stateAfter: this.store.getStateSnapshot(),
      stateBefore,
      versionAfter: this.version + 1,
      versionBefore: this.version,
    })
    this.version++
    this.store.renderKey++
  }

  @action pushUndoFrame = (frame: UndoFrame) => {
    this.undoStack.push(frame)
    this.store.renderKey++
  }

  private applyItemUpdateUndoFrame = (
    frame: UndoItemUpdateFrame,
    direction: 'forward' | 'back'
  ) => {
    const data = direction === 'back' ? frame.before : frame.after
    frame.item.setLocked(data.locked)
    if (data.customColor) {
      frame.item.setCustomColor(data.customColor)
    } else {
      frame.item.clearCustomColor()
    }
    frame.item.transform = new paper.Matrix(data.transform)
    applyTransformToObj(frame.item.fabricObj, data.transform)

    if (this.store.selectedItemData) {
      this.store.selectedItemData.locked = data.locked
      this.store.selectedItemData.customColor = data.customColor
    }

    this.canvas.requestRenderAll()
  }

  @action undo = async () => {
    this.isUndoing = true

    const frame = this.undoStack.undo()
    console.log('undo', frame)
    if (frame.kind === 'visualize') {
      await this.store.loadSerialized(frame.dataBefore)
      this.store.restoreStateSnapshot(frame.stateBefore)
      this.version = frame.versionBefore
    } else if (frame.kind === 'selection-change') {
      this.store.restoreSelection(frame.before)
    } else if (frame.kind === 'item-update') {
      this.applyItemUpdateUndoFrame(frame, 'back')
      this.version = frame.versionBefore
    }
    this.isUndoing = false
    this.canvas.requestRenderAll()
    this.store.renderKey++
  }

  @action redo = async () => {
    const frame = this.undoStack.redo()
    this.isUndoing = true

    console.log('redo', frame)
    if (frame.kind === 'visualize') {
      await this.store.loadSerialized(frame.dataAfter)
      this.store.restoreStateSnapshot(frame.stateAfter)
      this.version = frame.versionAfter
    } else if (frame.kind === 'selection-change') {
      this.store.restoreSelection(frame.after)
    } else if (frame.kind === 'item-update') {
      this.applyItemUpdateUndoFrame(frame, 'forward')
      this.version = frame.versionAfter
    }
    this.isUndoing = false
    this.canvas.requestRenderAll()
    this.store.renderKey++
  }

  @computed get canUndo() {
    return !this.isUndoing && this.undoStack.canUndo
  }
  @computed get canRedo() {
    return !this.isUndoing && this.undoStack.canRedo
  }

  clear = async (clearCanvas = true) => {
    this.logger.debug('Editor: clear')
    if (clearCanvas) {
      this.canvas.clear()
    } else {
      this.canvas._objects = []
    }

    this.shape = null

    this.items.bg.items = []
    this.items.bg.fabricObjToItem.clear()
    this.items.bg.itemsById.clear()

    this.items.shape.items = []
    this.items.shape.fabricObjToItem.clear()
    this.items.shape.itemsById.clear()
  }

  clearItems = (target: TargetKind, removeLocked = false) => {
    if (this.items[target].items.length === 0) {
      return
    }
    const nonLockedItems = [
      ...(target === 'shape'
        ? this.items.shape.itemsById.values()
        : this.items.bg.itemsById.values()),
    ].filter((item) => !item.locked || removeLocked)

    const fabricObjs = nonLockedItems.map((i) => i.fabricObj).filter(notEmpty)
    this.canvas.remove(...fabricObjs)

    fabricObjs.forEach((obj) => this.items.shape.fabricObjToItem.delete(obj))
    nonLockedItems.forEach((item) => this.items.shape.itemsById.delete(item.id))

    this.editorItemIdGen.removeIds(nonLockedItems.map((i) => i.id))
    this.editorItemIdGen.resetLen()
    this.items[target].items = this.items[target].items.filter(
      (i) => i.locked && !removeLocked
    )

    this.canvas.requestRenderAll()
    this.store.renderKey++
  }

  destroy = () => {
    window.removeEventListener('resize', () => this.handleResize(true))
    this.undoStack.clear()
  }

  selectShape = () => {
    this.logger.debug('selectShape')
    if (!this.shape) {
      return
    }
    this.shapeSelection = true
    this.shape.obj.selectable = true
    this.enableSelectionMode()
    this.canvas.setActiveObject(this.shape.obj)
    this.canvas.requestRenderAll()
  }

  deselectShape = () => {
    this.logger.debug('deselectShape')
    if (!this.shape) {
      return
    }
    this.applySceneClipPath()
    this.shapeSelection = false
    this.shape.obj.selectable = false
    this.deselectAll()
  }

  disableSelectionMode = () => {
    this.applySceneClipPath()
    this.canvas.skipTargetFind = true
    this.canvas.requestRenderAll()
  }

  enableSelectionMode = () => {
    this.removeSceneClipPath()
    this.canvas.skipTargetFind = false
    this.canvas.requestRenderAll()
  }

  deselectAll = () => {
    this.applySceneClipPath()
    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
  }

  convertToEditorItems = async (
    itemConfigs: EditorItemConfig[]
  ): Promise<{
    items: EditorItem[]
    itemsById: Map<EditorItemId, EditorItem>
    fabricObjToItem: Map<fabric.Object, EditorItem>
  }> => {
    this.store.visualizingStep = 'drawing'
    this.store.visualizingProgress = 0

    const items: EditorItem[] = []
    const itemsById: Map<EditorItemId, EditorItem> = new Map()
    const fabricObjToItem: Map<fabric.Object, EditorItem> = new Map()

    // Process word items...
    const allWordItems = itemConfigs.filter(
      (item) => item.kind === 'word'
    ) as EditorItemConfigWord[]

    const allIconItems = itemConfigs.filter(
      (item) => item.kind === 'shape'
    ) as EditorItemConfigShape[]

    const wordItemsByFont = groupBy(allWordItems, 'fontId')
    const uniqFontIds = Object.keys(wordItemsByFont)
    await this.fetchFonts(uniqFontIds)

    const glyphsInfo = new Map<string, GlyphInfo>()
    const paths = new Map<string, opentype.Path>()
    const wordPathObjs = new Map<string, fabric.Path>()
    const pathDatas = new Map<string, string | any[]>()
    const pathBounds = new Map<string, BoundingBox>()

    // Process all word items...
    for (const itemConfig of allWordItems) {
      // Process all glyphs...
      const font = this.fontsInfo.get(itemConfig.fontId)!.font
      const glyphs = font.otFont.stringToGlyphs(itemConfig.text)

      const wordPath = font.otFont.getPath(itemConfig.text, 0, 0, 100)
      const pathBoundsKey = `${font.id}:${itemConfig.text}`
      if (!pathBounds.has(pathBoundsKey)) {
        paths.set(pathBoundsKey, wordPath)
        const wordPathCmds = wordPath.commands.map(
          ({ type, x, y, x1, y1, x2, y2 }) =>
            [type, x1, y1, x2, y2, x, y].filter(notEmpty)
        )
        const wordPathObj = new fabric.Path(wordPathCmds as any)
        wordPathObj.set({ originX: 'center', originY: 'center ' })
        wordPathObjs.set(pathBoundsKey, wordPathObj)
        pathDatas.set(pathBoundsKey, wordPathCmds)
        pathBounds.set(pathBoundsKey, wordPath.getBoundingBox())
      }

      for (const glyph of glyphs) {
        const glyphKey = `${font.id}:${glyph.unicode}`
        if (glyphsInfo.has(glyphKey)) {
          continue
        }
        const path = glyph.getPath(0, 0, 100)
        const pathData = path.commands.map(({ type, x, y, x1, y1, x2, y2 }) =>
          [type, x1, y1, x2, y2, x, y].filter(notEmpty)
        )
        glyphsInfo.set(glyphKey, {
          key: glyphKey,
          path,
          glyph,
          pathData,
        })
      }
    }

    // Process all fonts...
    for (const [index, itemConfig] of allWordItems.entries()) {
      if (index % 50 === 0) {
        this.store.visualizingProgress =
          index / (allWordItems.length + allIconItems.length)
        for (let i = 0; i < PROGRESS_REPORT_RAF_WAIT_COUNT; ++i) {
          await waitAnimationFrame()
        }
      }

      // Process items...
      const font = this.fontsInfo.get(itemConfig.fontId)!.font

      const fontInfo = this.fontsInfo.get(itemConfig.fontId)!
      const item = new EditorItemWord(
        this.editorItemIdGen.get(),
        this.canvas,
        itemConfig,
        fontInfo.font,
        paths.get(`${font.id}:${itemConfig.text}`)!,
        pathDatas.get(`${font.id}:${itemConfig.text}`)!,
        wordPathObjs.get(`${font.id}:${itemConfig.text}`)!,
        pathBounds.get(`${font.id}:${itemConfig.text}`)!,
        itemConfig.wordConfigId
      )
      item.setSelectable(this.itemsSelection)

      items.push(item)
      itemsById.set(item.id, item)
      fabricObjToItem.set(item.fabricObj, item)
    }

    // Process icon items...
    const shapesById = new Map<
      ShapeId,
      {
        shapeObj: fabric.Object
      }
    >()
    for (const [index, itemConfig] of allIconItems.entries()) {
      const { shapeId } = itemConfig
      if (shapesById.has(shapeId)) {
        continue
      }
      const shapeConf = this.store.getIconShapeConfById(itemConfig.shapeId)
      if (shapeConf?.kind === 'icon' || shapeConf?.kind === 'clipart:svg') {
        const shapeObj = await loadObjFromSvgUrl(shapeConf.url)
        shapeObj.scale(100 / shapeObj.getBoundingRect().height)
        shapeObj.setCoords()
        shapesById.set(shapeId, {
          shapeObj,
        })
      }
    }

    for (const [index, itemConfig] of allIconItems.entries()) {
      if (index % 50 === 0) {
        this.store.visualizingProgress =
          index / (allWordItems.length + allIconItems.length)
        for (let i = 0; i < PROGRESS_REPORT_RAF_WAIT_COUNT; ++i) {
          await waitAnimationFrame()
        }
      }

      let shapeObj: fabric.Object | undefined
      const shapeConf = this.store.getIconShapeConfById(itemConfig.shapeId)
      if (shapeConf?.kind === 'icon' || shapeConf?.kind === 'clipart:svg') {
        shapeObj = shapesById.get(itemConfig.shapeId)!.shapeObj
      }

      if (!shapeObj) {
        continue
      }

      const shapeObjCopy = await cloneObj(shapeObj)
      const item = new EditorItemShape(
        this.editorItemIdGen.get(),
        this.canvas,
        itemConfig,
        shapeObjCopy
      )
      item.setSelectable(this.itemsSelection)

      items.push(item)
      itemsById.set(item.id, item)
      fabricObjToItem.set(item.fabricObj, item)
    }

    this.store.visualizingProgress = 1

    return {
      items,
      fabricObjToItem,
      itemsById,
    }
  }

  fetchFonts = async (fontIds: FontId[]): Promise<Font[]> => {
    return Promise.all(
      fontIds.map(async (fontId) => {
        if (this.fontsInfo.has(fontId)) {
          return this.fontsInfo.get(fontId)!.font
        }
        const { style } = this.store.getFontConfigById(fontId)!
        const font: Font = {
          otFont: await loadFont(style.url)!,
          id: fontId,
          isCustom: false,
        }
        this.fontsInfo.set(fontId, { font, glyphs: new Map() })
        return font
      })
    )
  }

  /** Converts WordListEntry[] into FillShapeTaskWordConfig[], doing some validation and error checking */
  processWordList = (params: {
    wordConfigs: WordListEntry[]
    defaultFonts: Font[]
    defaultAngles: number[]
  }): {
    processedWordList: FillShapeTaskWordConfig[]
    langCheckErrors: LangProcessingError[]
  } => {
    const processedWordList: FillShapeTaskWordConfig[] = []
    const errors: LangProcessingError[] = []

    for (const wc of params.wordConfigs) {
      const { fontId } = wc

      const text = wc.text.trim()
      if (text.length === 0) {
        continue
      }

      const fonts = fontId
        ? [this.fontsInfo.get(fontId)!.font]
        : params.defaultFonts
      const supportedFonts: Font[] = []

      for (const font of fonts) {
        let isSupported = true
        for (const char of text) {
          if (
            !font.otFont.hasChar(char) ||
            font.otFont.charToGlyphIndex(char) === 0
          ) {
            isSupported = false
            break
          }
        }

        if (isSupported) {
          supportedFonts.push(font)
        }
      }

      if (supportedFonts.length === 0) {
        errors.push({ word: text })
      } else {
        processedWordList.push({
          wordConfigId: wc.id,
          text,
          angles: wc.angle != null ? [wc.angle] : params.defaultAngles,
          fonts: supportedFonts,
          repeats: wc.repeats ?? -1,
        })
      }
    }

    return {
      processedWordList,
      langCheckErrors: errors,
    }
  }
}

type LangProcessingError = {
  word: string
}

export type TargetKind = 'shape' | 'bg'
