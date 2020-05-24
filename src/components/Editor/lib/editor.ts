import { EditorStore, WordConfigId } from 'components/Editor/editor-store'
import { computeColorsMap } from 'components/Editor/lib/colormap'
import { applyTransformToObj } from 'components/Editor/lib/fabric-utils'
import { Font, Generator } from 'components/Editor/lib/generator'
import {
  BackgroundStyleConfig,
  ColorString,
  ItemsColoring,
  ShapeConfig,
  ShapeStyleConfig,
} from 'components/Editor/style'
import { FontId } from 'data/fonts'
import { fabric } from 'fabric'
import { removeLightPixels } from 'lib/wordart/canvas-utils'
import { loadFont } from 'lib/wordart/fonts'
import { flatten, groupBy, keyBy, sortBy } from 'lodash'
import { toJS } from 'mobx'
import { Glyph } from 'opentype.js'
import paper from 'paper'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { EditorPersistedData } from 'services/api/types'
import { waitAnimationFrame } from 'utils/async'
import { consoleLoggers } from 'utils/console-logger'
import { UninqIdGenerator } from 'utils/ids'
import { notEmpty } from 'utils/not-empty'

export type EditorItemConfig = EditorItemConfigWord

export type EditorItemConfigWord = {
  kind: 'word'
  index: number
  locked: boolean
  text: string
  fontId: FontId
  transform: paper.Matrix
  wordConfigId?: WordConfigId
  customColor?: string
  /** Default color of the item, determined by the coloring style */
  color: string
  /** Color of the shape at the location where item was placed */
  shapeColor: string
}

export type EditorItemId = string
export type EditorItem = EditorItemWord

export class EditorItemWord {
  kind = 'word' as 'word'
  font: Font
  id: EditorItemId
  wordConfigId?: WordConfigId
  defaultText = ''
  customText?: string

  /** When was the item placed by the generation algorithm */
  placedIndex = -1

  /** Transform produced by the generator algorithm */
  generatedTransform = new paper.Matrix()
  /** Current transform of the item */
  transform = new paper.Matrix()
  /** Is position locked? */
  locked = false

  /** Color of the shape where the item was auto-placed */
  shapeColor = 'black'
  /** Custom color of the item */
  customColor?: string
  /** Default color of the item, determined by the coloring style */
  color: string

  fabricObj: fabric.Group
  wordObj: fabric.Object
  canvas: fabric.Canvas

  path?: opentype.Path
  pathBounds?: opentype.BoundingBox
  lockBorder: fabric.Group

  isShowingLockBorder = false

  constructor(
    id: EditorItemId,
    canvas: fabric.Canvas,
    conf: EditorItemConfigWord,
    font: Font
  ) {
    this.id = id
    this.canvas = canvas
    this.font = font

    const wordPath = font.otFont.getPath(conf.text, 0, 0, 100)
    const pathBounds = wordPath.getBoundingBox()
    const pw = pathBounds.x2 - pathBounds.x1
    const ph = pathBounds.y2 - pathBounds.y1

    const wordGroup = new fabric.Group([
      new fabric.Rect().set({
        originX: 'center',
        originY: 'center',
        left: pathBounds.x1,
        top: pathBounds.y1,
        width: pw,
        height: ph,
        strokeWidth: 1,
        stroke: 'black',
        fill: 'rgba(255,255,255,0.3)',
        opacity: 0,
      }),
      new fabric.Path(wordPath.toPathData(3)).set({
        originX: 'center',
        originY: 'center',
      }),
    ])

    this.customColor = conf.customColor
    this.color = conf.color || 'black'

    this.fabricObj = wordGroup
    this.wordObj = wordGroup.item(1)
    this.lockBorder = wordGroup.item(0)
    this.wordObj.set({ fill: this.color })

    this.transform = conf.transform
    this.generatedTransform = conf.transform
    this.defaultText = conf.text
    this.shapeColor = conf.shapeColor
    this.path = wordPath
    this.pathBounds = pathBounds
    this.placedIndex = conf.index
    this.wordConfigId = conf.wordConfigId

    this.setLocked(conf.locked)

    wordGroup.on('modified', () => {
      this.transform = new paper.Matrix(wordGroup.calcOwnMatrix())
    })
    wordGroup.on('selected', () => {
      this.fabricObj.bringToFront()
      this.canvas.requestRenderAll()
    })

    this._updateColor(this.customColor || this.color)

    applyTransformToObj(wordGroup, conf.transform.values as MatrixSerialized)
  }

  setSelectable = (value: boolean) => {
    this.fabricObj.selectable = value
  }

  private _updateColor = (color: string) => {
    this.fabricObj.cornerStrokeColor = color
    this.wordObj.set({ fill: color })
    this.lockBorder.set({ stroke: color })
  }

  setCustomColor = (color: string) => {
    this.customColor = color
    this._updateColor(this.customColor)
  }

  clearCustomColor = () => {
    this.customColor = undefined
    this._updateColor(this.color)
  }

  setLockBorderVisibility = (value: boolean) => {
    this.isShowingLockBorder = value
    this.lockBorder.set({
      opacity: this.locked && value ? 1 : 0,
    })
  }

  setLocked = (value: boolean) => {
    this.locked = value
    this.lockBorder.set({ opacity: value && this.isShowingLockBorder ? 1 : 0 })
  }
}

export type EditorInitParams = {
  canvas: HTMLCanvasElement
  canvasWrapperEl: HTMLElement
  aspectRatio: number
  store: EditorStore
  serialized?: EditorPersistedData

  onItemUpdated: (item: EditorItem) => void
  onItemSelected: (item: EditorItem) => void
  onItemSelectionCleared: () => void
}

export class Editor {
  logger = consoleLoggers.editor

  private params: EditorInitParams
  private store: EditorStore
  private generator: Generator

  private aspectRatio: number
  private editorItemIdGen = new UninqIdGenerator(3)

  /** Info about the current shape */
  currentShape:
    | null
    | {
        kind: 'svg'
        shapeConfig: ShapeConfig
        colorsMap: SvgShapeColorsMap
      }
    | {
        kind: 'img'
        shapeConfig: ShapeConfig
      } = null

  fabricObjects: {
    shape?: fabric.Object
    shapeOriginalColors?: fabric.Object
  } = {}

  items: {
    shape: {
      itemsById: Map<EditorItemId, EditorItem>
      fabricObjToItem: Map<fabric.Object, EditorItem>
    }
    bg: {
      itemsById: Map<EditorItemId, EditorItem>
      fabricObjToItem: Map<fabric.Object, EditorItem>
    }
  }
  /** Size of the scene in project coordinates */
  projectBounds: paper.Rectangle
  canvas: fabric.Canvas
  fontsInfo: Map<
    FontId,
    {
      font: Font
      glyphs: Map<
        string,
        { glyph: Glyph; path: opentype.Path; pathData: string }
      >
    }
  > = new Map()

  itemsSelection = false
  shapeSelection = false

  constructor(params: EditorInitParams) {
    this.params = params
    this.store = params.store
    this.generator = new Generator()

    paper.setup(new paper.Size({ width: 1, height: 1 }))
    this.canvas = new fabric.Canvas(params.canvas.id)
    this.aspectRatio = this.params.aspectRatio

    this.canvas.on('selection:created', () => {
      const target = this.canvas.getActiveObject()
      const item = this.items.shape.fabricObjToItem.get(target)
      if (item) {
        params.onItemSelected(item)
      }
    })

    this.canvas.on('selection:updated', () => {
      const target = this.canvas.getActiveObject()
      const item = this.items.shape.fabricObjToItem.get(target)
      if (item) {
        params.onItemSelected(item)
      }
    })

    this.canvas.on('selection:cleared', () => {
      params.onItemSelectionCleared()
    })

    this.canvas.on('object:moving', (evt) => {
      const target = evt.target
      if (!target) {
        return
      }

      if (target === this.fabricObjects.shape) {
        this.clearItems('shape')
        this.clearItems('bg')
      }
    })
    this.canvas.on('object:rotating', (evt) => {
      const target = evt.target
      if (!target) {
        return
      }

      if (target === this.fabricObjects.shape) {
        this.clearItems('shape')
        this.clearItems('bg')
      }
    })
    this.canvas.on('object:scaling', (evt) => {
      const target = evt.target
      if (!target) {
        return
      }

      if (target === this.fabricObjects.shape) {
        this.clearItems('shape')
        this.clearItems('bg')
      }
    })

    this.canvas.on('object:modified', (evt) => {
      const target = evt.target
      if (!target) {
        return
      }

      if (
        target === this.fabricObjects.shape &&
        this.fabricObjects.shapeOriginalColors
      ) {
        applyTransformToObj(
          this.fabricObjects.shapeOriginalColors,
          this.fabricObjects.shape.calcTransformMatrix() as MatrixSerialized
        )

        this.canvas.requestRenderAll()
      } else {
        const item = this.items.shape.fabricObjToItem.get(target)
        if (item) {
          item.setLocked(true)
          params.onItemUpdated(item)
        }
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
        itemsById: new Map(),
        fabricObjToItem: new Map(),
      },
      bg: {
        itemsById: new Map(),
        fabricObjToItem: new Map(),
      },
    }

    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  }

  showLockBorders = () => {
    console.log('showLockBorders')
    for (const [, item] of this.items.shape.itemsById) {
      item.setLockBorderVisibility(true)
    }
    this.canvas.requestRenderAll()
  }

  hideLockBorders = () => {
    console.log('hideLockBorders')
    for (const [, item] of this.items.shape.itemsById) {
      item.setLockBorderVisibility(false)
    }
    this.canvas.requestRenderAll()
  }

  enableItemsSelection = () => {
    this.itemsSelection = true
    for (const [, item] of this.items.shape.itemsById) {
      if (item.fabricObj) {
        item.fabricObj.selectable = true
      }
    }
    this.enableSelectionMode()
    this.canvas.requestRenderAll()
  }
  disableItemsSelection = () => {
    this.itemsSelection = false
    for (const [, item] of this.items.shape.itemsById) {
      if (item.fabricObj) {
        item.fabricObj.selectable = false
      }
    }
    this.deselectAll()
  }

  setAspectRatio = (aspect: number) => {
    this.aspectRatio = aspect
    this.projectBounds = new paper.Rectangle({
      x: 0,
      y: 0,
      width: 1000,
      height: 1000 / this.aspectRatio,
    })
    this.handleResize()
  }

  handleResize = () => {
    const wrapperBounds = this.params.canvasWrapperEl.getBoundingClientRect()
    wrapperBounds.width -= 40
    wrapperBounds.height -= 40

    // Update view size
    if (wrapperBounds.width / wrapperBounds.height > this.aspectRatio) {
      this.canvas.setWidth(this.aspectRatio * wrapperBounds.height)
      this.canvas.setHeight(wrapperBounds.height)
    } else {
      this.canvas.setWidth(wrapperBounds.width)
      this.canvas.setHeight(wrapperBounds.width / this.aspectRatio)
    }

    // // Update view transform to make sure the viewport includes the entire project bounds
    this.canvas.setZoom(this.canvas.getWidth() / this.projectBounds.width)
  }

  setBgColor = (config: BgFillColorsConfig) => {
    this.logger.debug('setBgColor', toJS(config, { recurseEverything: true }))
    this.canvas.backgroundColor = config.color
    this.canvas.requestRenderAll()
  }

  setShapeFillColors = async (config: ShapeFillColorsConfig) => {
    this.logger.debug(
      'setShapeFillColors',
      toJS(config, { recurseEverything: true })
    )

    if (!this.currentShape) {
      this.logger.debug('>  No current shape, early exit')
      return
    }

    if (this.currentShape.kind === 'img') {
      return
    }

    if (!this.fabricObjects.shape || !this.fabricObjects.shapeOriginalColors) {
      return
    }

    const shape = await new Promise<fabric.Object>((r) =>
      this.fabricObjects.shapeOriginalColors!.clone(
        (copy: fabric.Object) => r(copy),
        ['id']
      )
    )

    if (config.kind === 'color-map') {
      const colorsMap = computeColorsMap(shape)

      this.logger.debug('>  Using color map', colorsMap)
      colorsMap.colors.forEach((colorEntry, entryIndex) => {
        this.logger.debug(
          `>    Setting color to ${config.colorMap[entryIndex]}, ${colorEntry.color} for ${colorEntry.fabricItems.length} items...`
        )
        colorEntry.fabricItems.forEach((item) => {
          const color = config.colorMap[entryIndex] || colorEntry.color
          if (colorEntry.fill) {
            item.set({ fill: color })
          }
          if (colorEntry.stroke) {
            item.set({ stroke: color })
          }
        })
      })

      this.canvas.remove(this.fabricObjects.shape)
      this.canvas.insertAt(shape, 0, false)

      this.currentShape.colorsMap = colorsMap
      this.setShapeObj(shape)
    } else {
      this.logger.debug('>  Using single color')
      const color = config.color

      const objects =
        shape instanceof fabric.Group ? shape.getObjects() : [shape]
      objects.forEach((obj) => obj.set({ fill: color, stroke: color }))

      this.canvas.remove(this.fabricObjects.shape)
      this.canvas.insertAt(shape, 0, false)

      this.setShapeObj(shape)
    }

    this.setShapeFillOpacity(config.opacity)
    this.canvas.requestRenderAll()
  }

  setShapeObj = (shape: fabric.Object) => {
    shape.set({ selectable: this.shapeSelection })
    this.fabricObjects.shape = shape
  }

  setShapeFillOpacity = (opacity: number) => {
    this.logger.debug('setShapeFillOpacity', opacity)
    if (!this.fabricObjects.shape) {
      return
    }
    this.fabricObjects.shape.set({ opacity })
    this.canvas.requestRenderAll()
  }

  setItemsColor = async (target: TargetKind, coloring: ItemsColoring) => {
    // const { items } = this.items[target]
    // this.logger.debug(
    //   'setItemsColor',
    //   target,
    //   coloring,
    //   `${items.length} items`
    // )
    // let colors: string[] = []
    // if (coloring.kind === 'gradient' || coloring.kind === 'single-color') {
    //   if (coloring.kind === 'single-color') {
    //     colors = [coloring.color]
    //   } else if (coloring.kind === 'gradient') {
    //     const scale = chroma.scale([coloring.colorFrom, coloring.colorTo])
    //     colors = scale.colors(10)
    //   }
    // } else if (coloring.kind === 'shape' && coloring.shapeStyleFill) {
    //   if (coloring.shapeStyleFill.kind === 'single-color') {
    //     colors = [coloring.shapeStyleFill.color]
    //   } else {
    //     colors = coloring.shapeStyleFill.colorMap
    //   }
    // }
    // const itemAreas = items.map((item) => {
    //   if (item.kind === 'word') {
    //     const wordPathBb = item.pathBounds!
    //     const scaling = item.transform.scaling
    //     const wordH = (wordPathBb.y2 - wordPathBb.y1) * scaling.y
    //     const wordW = (wordPathBb.x2 - wordPathBb.x1) * scaling.x
    //     const wordArea = Math.sqrt(wordH * wordW)
    //     return wordArea
    //   }
    //   // if (item.kind === 'symbol') {
    //   //   const bounds = item.symbolDef.item.bounds
    //   //   const w = bounds.width * item.transform.scaling.x
    //   //   const h = bounds.height * item.transform.scaling.y
    //   //   return Math.sqrt(w * h)
    //   // }
    //   return 0
    // })
    // const maxArea = max(itemAreas)!
    // const minArea = min(itemAreas)!
    // const rng = seedrandom('fill color')
    // let shapeRaster: fabric.Image | undefined
    // let shapeRasterImgData: ImageData | undefined
    // const dimSmallerFactor = coloring.dimSmallerItems / 100
    // if ((!shapeRaster || !shapeRasterImgData) && this.fabricObjects.shape) {
    //   shapeRaster = await new Promise<fabric.Image>((r) =>
    //     this.fabricObjects.shape!.cloneAsImage((copy: fabric.Image) => r(copy))
    //   )
    // }
    // for (let i = 0; i < items.length; ++i) {
    //   const item = items[i]
    //   const area = itemAreas[i]
    //   const obj = item.fabricObj
    //   if (!obj) {
    //     continue
    //   }
    //   if (item.kind !== 'word' && item.kind !== 'symbol') {
    //     continue
    //   }
    //   const objects = obj instanceof fabric.Group ? obj.getObjects() : [obj]
    //   if (coloring.kind === 'gradient' || coloring.kind === 'single-color') {
    //     const index = Math.floor(rng() * colors.length)
    //     objects.forEach((o) =>
    //       o.set({ fill: colors[index], stroke: colors[index] })
    //     )
    //   } else if (coloring.shapeStyleFill) {
    //     if (coloring.shapeStyleFill.kind === 'single-color') {
    //       const shapeColor = new paper.Color(coloring.shapeStyleFill.color)
    //       let color = chroma.rgb(
    //         255 * shapeColor.red,
    //         255 * shapeColor.green,
    //         255 * shapeColor.blue
    //       )
    //       if (coloring.shapeBrightness != 0) {
    //         color = color.brighten(coloring.shapeBrightness / 100)
    //       }
    //       const hex = color.hex()
    //       objects.forEach((o) => o.set({ fill: hex, stroke: hex }))
    //     } else if (coloring.shapeStyleFill.kind === 'color-map') {
    //       const colorMapSorted = sortBy(
    //         coloring.shapeStyleFill.defaultColorMap.map((color, index) => ({
    //           color,
    //           index,
    //         })),
    //         ({ color }) => chroma.distance(color, item.shapeColor, 'rgb')
    //       )
    //       const shapeColorStringIndex = colorMapSorted[0].index
    //       const shapeColorString =
    //         coloring.shapeStyleFill.colorMap[shapeColorStringIndex]
    //       const shapeColor = new paper.Color(shapeColorString)
    //       let color = chroma.rgb(
    //         255 * shapeColor.red,
    //         255 * shapeColor.green,
    //         255 * shapeColor.blue
    //       )
    //       if (coloring.shapeBrightness != 0) {
    //         color = color.brighten(coloring.shapeBrightness / 100)
    //       }
    //       const hex = color.hex()
    //       objects.forEach((o) => o.set({ fill: hex, stroke: hex }))
    //     }
    //   }
    //   obj.opacity =
    //     (dimSmallerFactor * (area - minArea)) / (maxArea - minArea) +
    //     (1 - dimSmallerFactor)
    // }
    // this.canvas.requestRenderAll()
  }

  /** Sets the shape, clearing the project */
  setShape = async (params: {
    shape: ShapeConfig
    bgColors: BgFillColorsConfig
    shapeColors: ShapeFillColorsConfig
  }): Promise<{ colorsMap?: SvgShapeColorsMap }> => {
    const { shape, shapeColors, bgColors } = params

    if (!shape) {
      throw new Error('Missing shape config')
    }
    this.logger.debug('setShape', toJS(params, { recurseEverything: true }))

    let shapeItem: paper.Item | undefined
    let colorsMap: SvgShapeColorsMap | undefined

    let shapeObj: fabric.Object | undefined

    // Process the shape...
    if (shape.kind === 'svg') {
      shapeObj = await new Promise<fabric.Object>((resolve) =>
        fabric.loadSVGFromURL(shape.url, (objects, options) => {
          var obj = fabric.util.groupSVGElements(objects, options)
          resolve(obj)
        })
      )
      // const shapeItemGroup: paper.Group = await new Promise<paper.Group>(
      //   (resolve) =>
      //     new paper.Item().importSVG(shape.url, (item: paper.Item) => {
      //       item.remove()
      //       resolve(item as paper.Group)
      //     })
      // )

      colorsMap = computeColorsMap(shapeObj as fabric.Group)

      // shapeItem = shapeItemGroup
    } else {
      const shapeItemRaster: paper.Raster = await new Promise<paper.Raster>(
        (resolve) => {
          const raster = new paper.Raster(shape.url)
          raster.remove()
          raster.onLoad = () => {
            resolve(raster)
          }
        }
      )
      const canvas = shapeItemRaster.getSubCanvas(
        new paper.Rectangle(0, 0, shapeItemRaster.width, shapeItemRaster.height)
      )
      removeLightPixels(canvas, 0.95)
      const imgData = canvas
        .getContext('2d')!
        .getImageData(0, 0, shapeItemRaster.width, shapeItemRaster.height)
      shapeItemRaster.setImageData(imgData, new paper.Point(0, 0))
      shapeItem = shapeItemRaster
    }

    if (!shapeObj) {
      throw new Error('no shape obj')
    }

    // TODO: configure these
    const w = shapeObj.getBoundingRect().width
    const h = shapeObj.getBoundingRect().height
    const defaultPadding = 50

    const sceneBounds = this.getSceneBounds(defaultPadding)
    if (Math.max(w, h) !== Math.max(sceneBounds.width, sceneBounds.height)) {
      const scale = Math.min(sceneBounds.width / w, sceneBounds.height / h)
      shapeObj.set({ scaleX: scale, scaleY: scale })
    }

    this.clear()

    this.setBgColor(bgColors)
    shapeObj.setPositionByOrigin(
      new fabric.Point(
        defaultPadding + sceneBounds.width / 2,
        defaultPadding + sceneBounds.height / 2
      ),
      'center',
      'center'
    )

    if (this.fabricObjects.shape) {
      this.canvas.remove(this.fabricObjects.shape)
    }
    const shapeCopy = await new Promise<fabric.Object>((r) =>
      shapeObj!.clone((copy: fabric.Object) => r(copy), ['id'])
    )
    shapeCopy.set({
      selectable: false,
    })
    shapeObj.set({
      opacity: shapeColors.opacity,
      selectable: false,
    })
    this.canvas.add(shapeObj)
    this.canvas.requestRenderAll()
    this.setShapeObj(shapeObj)
    this.fabricObjects.shapeOriginalColors = shapeCopy

    if (shape.kind === 'svg') {
      this.currentShape = {
        kind: shape.kind,
        shapeConfig: shape,
        colorsMap: colorsMap!,
      }
    } else {
      this.currentShape = {
        kind: shape.kind,
        shapeConfig: shape,
      }
    }

    if (colorsMap) {
      shapeColors.colorMap = colorsMap?.colors.map((c) => c.color)
      shapeColors.defaultColorMap = colorsMap?.colors.map((c) => c.color)
      console.log('setting default color map', shapeColors, colorsMap)
    }
    this.setShapeFillColors(shapeColors)
    return { colorsMap }
  }

  getSceneBounds = (pad = 20): paper.Rectangle =>
    new paper.Rectangle({
      x: pad,
      y: pad,
      width: this.projectBounds.width - pad * 2,
      height: this.projectBounds.height - pad * 2,
    })

  generateBgItems = async (params: { style: BackgroundStyleConfig }) => {
    return
  }

  setBgItems = async (items: EditorItemConfig[]) => {
    return
  }

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

  setShapeItems = async (itemConfigs: EditorItemConfig[]) => {
    if (!this.fabricObjects.shape) {
      console.error('No shape')
      return
    }
    const {
      items,
      itemsById,
      fabricObjToItem,
    } = await this.convertToEditorItems(itemConfigs)

    const oldItemsToDelete = [...this.items.shape.itemsById.values()].filter(
      (item) => !item.locked
    )
    const oldItemsToKeep = [...this.items.shape.itemsById.values()].filter(
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
    this.canvas.requestRenderAll()

    this.items.shape = {
      itemsById,
      fabricObjToItem,
    }
  }

  // TODO: optimize performance
  // TODO: rename to "convert to EditorItems"
  convertToEditorItems = async (
    itemConfigs: EditorItemConfig[]
  ): Promise<{
    items: EditorItem[]
    itemsById: Map<EditorItemId, EditorItem>
    fabricObjToItem: Map<fabric.Object, EditorItem>
  }> => {
    const items: EditorItem[] = []
    const itemsById: Map<EditorItemId, EditorItem> = new Map()
    const fabricObjToItem: Map<fabric.Object, EditorItem> = new Map()

    const allWordItems = itemConfigs.filter(
      (item) => item.kind === 'word'
    ) as EditorItemConfigWord[]
    const wordItemsByFont = groupBy(allWordItems, 'fontId')
    const uniqFontIds = Object.keys(wordItemsByFont)
    await this.fetchFonts(uniqFontIds)

    // Process all fonts...
    for (const itemConfig of allWordItems) {
      // Process all glyphs...
      // const uniqGlyphs = [
      //   ...new Set(
      //     flatten(
      //       wordItemConfigs.map((wi) =>
      //         fontInfo.font.otFont.stringToGlyphs(wi.text)
      //       )
      //     )
      //   ),
      // ]
      // for (const glyph of uniqGlyphs) {
      //   if (fontInfo.glyphs.has(glyph.name)) {
      //     continue
      //   }
      //   const path = glyph.getPath(0, 0, 100)
      //   fontInfo.glyphs.set(glyph.name, {
      //     glyph,
      //     path,
      //     pathData: path.toPathData(3),
      //   })
      // }

      // Process items...

      // TODO: optimize it with glyph-based paths

      const fontInfo = this.fontsInfo.get(itemConfig.fontId)!
      const item = new EditorItemWord(
        this.editorItemIdGen.get(),
        this.canvas,
        itemConfig,
        fontInfo.font
      )
      item.setSelectable(this.itemsSelection)

      items.push(item)
      itemsById.set(item.id, item)
      fabricObjToItem.set(item.fabricObj, item)
    }

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
        const { style } = this.store.getFontById(fontId)!
        const font: Font = {
          otFont: await loadFont(style.url),
          id: fontId,
          isCustom: false,
        }
        this.fontsInfo.set(fontId, { font, glyphs: new Map() })
        return font
      })
    )
  }

  generateShapeItems = async (params: { style: ShapeStyleConfig }) => {
    const { style } = params
    const coloring = getItemsColoring(style)
    this.logger.debug('generateShapeItems')
    if (!this.fabricObjects.shape) {
      console.error('No paperItems.shape')
      return
    }
    if (!this.fabricObjects.shapeOriginalColors) {
      console.error('No paperItemsoriginal')
      return
    }
    this.store.isVisualizing = true
    for (let i = 0; i < 10; ++i) {
      await waitAnimationFrame()
    }
    await this.generator.init()

    const shapeClone = await new Promise<fabric.Object>((r) =>
      this.fabricObjects.shape!.clone((obj: fabric.Object) => r(obj))
    )
    shapeClone.set({ opacity: 1 })
    const shapeImage = await new Promise<fabric.Image>((r) =>
      shapeClone.cloneAsImage((obj: fabric.Image) => r(obj))
    )

    const shapeCanvas = (shapeImage.toCanvasElement() as any) as HTMLCanvasElement
    const shapeCanvasOriginalColors = (this.fabricObjects.shapeOriginalColors.toCanvasElement() as any) as HTMLCanvasElement

    const shapeRasterBounds = new paper.Rectangle(
      this.fabricObjects.shape.getBoundingRect(true).left || 0,
      this.fabricObjects.shape.getBoundingRect(true).top || 0,
      shapeCanvas.width,
      shapeCanvas.height
    )
    // shapeRaster = undefined
    const wordFonts: Font[] = await this.fetchFonts(style.words.fontIds)

    const shapeConfig = this.store.getSelectedShape()
    const result = await this.generator.fillShape(
      {
        shape: {
          canvas: shapeCanvas,
          shapeCanvasOriginalColors,
          bounds: shapeRasterBounds,
          processing: {
            removeWhiteBg: {
              enabled: shapeConfig.kind === 'img',
              lightnessThreshold: 98,
            },
            shrink: {
              enabled: style.layout.shapePadding > 0,
              amount: style.layout.shapePadding,
            },
            edges: {
              enabled: style.processing.edges.enabled,
              blur: 17 * (1 - style.processing.edges.amount / 100),
              lowThreshold: 30,
              highThreshold: 100,
            },
            invert: {
              enabled: style.processing.invert.enabled,
            },
          },
        },
        itemPadding: Math.max(1, 100 - style.layout.itemDensity),
        // Words
        wordsMaxSize: style.layout.wordsMaxSize,
        words: style.words.wordList.map((wc) => ({
          wordConfigId: wc.id,
          text: wc.text,
          angles: style.words.angles.angles,
          fillColors: ['red'],
          // fonts: [fonts[0], fonts[1], fonts[2]],
          fonts: wordFonts,
        })),
        // Icons
        icons: style.icons.iconList.map((shape) => ({
          shape: this.store.getShapeById(shape.shapeId)!,
        })),
        iconsMaxSize: style.layout.iconsMaxSize,
        iconProbability: style.layout.iconsProportion / 100,
      },
      (progressPercent) => {
        this.store.visualizingProgress = progressPercent
      }
    )

    const wordConfigsById = keyBy(style.words.wordList, 'id')
    const items: EditorItemConfig[] = []

    for (const genItem of result.generatedItems) {
      if (genItem.kind === 'word') {
        const wordConfig = wordConfigsById[genItem.wordConfigId]
        items.push({
          ...genItem,
          color: 'black',
          locked: false,
          text: wordConfig.text,
          customColor: wordConfig.color,
        })
      }
    }

    await this.setShapeItems(items)
    await this.setItemsColor('shape', coloring)
    this.store.isVisualizing = false
  }

  clear = async () => {
    this.logger.debug('Editor: clear')
    this.canvas.clear()

    this.fabricObjects.shape = undefined
    this.fabricObjects.shapeOriginalColors = undefined

    this.items.bg.fabricObjToItem.clear()
    this.items.bg.itemsById.clear()
    this.items.shape.fabricObjToItem.clear()
    this.items.shape.itemsById.clear()
  }

  clearItems = (target: TargetKind) => {
    if (target === 'shape') {
      const nonLockedItems = [...this.items.shape.itemsById.values()].filter(
        (item) => !item.locked
      )

      const fabricObjs = nonLockedItems.map((i) => i.fabricObj).filter(notEmpty)
      this.canvas.remove(...fabricObjs)

      fabricObjs.forEach((obj) => this.items.shape.fabricObjToItem.delete(obj))
      nonLockedItems.forEach((item) =>
        this.items.shape.itemsById.delete(item.id)
      )

      this.editorItemIdGen.removeIds(nonLockedItems.map((i) => i.id))
      this.editorItemIdGen.resetLen()

      this.canvas.requestRenderAll()
    } else {
      // TODO
    }
  }

  destroy = () => {
    window.removeEventListener('resize', this.handleResize)
  }

  selectShape = () => {
    this.logger.debug('selectShape')
    if (!this.fabricObjects.shape) {
      return
    }
    this.shapeSelection = true
    this.fabricObjects.shape.selectable = true
    this.enableSelectionMode()
    this.canvas.setActiveObject(this.fabricObjects.shape)
    this.canvas.requestRenderAll()
  }

  deselectShape = () => {
    this.logger.debug('deselectShape')
    if (!this.fabricObjects.shape) {
      return
    }
    this.shapeSelection = false
    this.fabricObjects.shape.selectable = false
    this.deselectAll()
  }

  disableSelectionMode = () => {
    this.canvas.skipTargetFind = true
    this.canvas.selection = false
    this.canvas.requestRenderAll()
  }

  enableSelectionMode = () => {
    this.canvas.skipTargetFind = false
    this.canvas.selection = true
    this.canvas.requestRenderAll()
  }

  deselectAll = () => {
    this.canvas.discardActiveObject()
    this.canvas.requestRenderAll()
  }
}

export type SvgShapeColorsMap = {
  colors: SvgShapeColorsMapEntry[]
}

export type SvgShapeColorsMapEntry = {
  stroke: boolean
  fill: boolean
  color: ColorString
  fabricItems: fabric.Object[]
}

export type ShapeFillColorsConfig = ShapeStyleConfig['fill']
export type BgFillColorsConfig = BackgroundStyleConfig['fill']

export type TargetKind = 'shape' | 'bg'

export const getItemsColoring = (
  style: BackgroundStyleConfig | ShapeStyleConfig
): ItemsColoring => {
  const coloring = style.itemsColoring

  if (coloring.kind === 'color') {
    return {
      kind: 'single-color',
      color: coloring.color,
      dimSmallerItems: coloring.dimSmallerItems,
    }
  } else if (coloring.kind === 'gradient') {
    return {
      kind: 'gradient',
      colorFrom: coloring.gradient.from,
      colorTo: coloring.gradient.to,
      assignColorBy: coloring.gradient.assignBy,
      dimSmallerItems: coloring.dimSmallerItems,
    }
  }
  return {
    kind: 'shape',
    dimSmallerItems: coloring.dimSmallerItems,
    shapeBrightness: coloring.shapeBrightness,
    shapeStyleFill: style.kind === 'shape' ? style.fill : undefined,
  }
}
