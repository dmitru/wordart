import chroma from 'chroma-js'
import { EditorStore } from 'components/Editor/editor-store'
import { computeColorsMap } from 'components/Editor/lib/colormap'
import {
  EditorItem,
  EditorItemConfig,
  EditorItemConfigWord,
  EditorItemId,
  EditorItemWord,
} from 'components/Editor/lib/editor-item'
import {
  applyTransformToObj,
  cloneObj,
  cloneObjAsImage,
  createMultilineFabricTextGroup,
  loadObjFromImg,
  loadObjFromSvg,
  objAsCanvasElement,
} from 'components/Editor/lib/fabric-utils'
import { Font, Generator } from 'components/Editor/lib/generator'
import { Shape, SvgShapeColorsMapEntry } from 'components/Editor/shape'
import {
  ShapeConf,
  ShapeRasterConf,
  ShapeSvgConf,
  ShapeTextConf,
} from 'components/Editor/shape-config'
import { BgStyleConf, ShapeStyleConf } from 'components/Editor/style'
import { FontId } from 'data/fonts'
import { fabric } from 'fabric'
import {
  canvasToImgElement,
  createCanvas,
  processRasterImg,
} from 'lib/wordart/canvas-utils'
import { loadFont } from 'lib/wordart/fonts'
import { flatten, groupBy, keyBy, max, min } from 'lodash'
import { toJS } from 'mobx'
import { Glyph } from 'opentype.js'
import paper from 'paper'
import seedrandom from 'seedrandom'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { EditorPersistedData } from 'services/api/types'
import { waitAnimationFrame } from 'utils/async'
import { consoleLoggers } from 'utils/console-logger'
import { UninqIdGenerator } from 'utils/ids'
import { notEmpty } from 'utils/not-empty'

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

type FontInfo = {
  font: Font
  glyphs: Map<string, { glyph: Glyph; path: opentype.Path; pathData: string }>
}

export class Editor {
  logger = consoleLoggers.editor

  private params: EditorInitParams
  private store: EditorStore
  private generator: Generator

  private aspectRatio: number
  private editorItemIdGen = new UninqIdGenerator(3)

  /** Info about the current shape */
  shape: null | Shape = null

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
      if (!target) {
        return
      }

      if (
        target === this.shape?.obj &&
        this.shape.kind === 'svg' &&
        this.shape.objOriginalColors
      ) {
        applyTransformToObj(
          this.shape.objOriginalColors,
          this.shape.obj.calcTransformMatrix() as MatrixSerialized
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

  setBgColor = (config: BgStyleConf['fill']) => {
    this.logger.debug('setBgColor', toJS(config, { recurseEverything: true }))
    this.canvas.backgroundColor =
      config.kind === 'transparent' ? 'transparent' : config.color
    this.canvas.requestRenderAll()
  }

  updateRasterShapeColors = (config: ShapeRasterConf) => {
    if (this.shape?.kind !== 'raster') {
      console.error(
        `Unexpected shape type: expected raster, got ${this.shape?.kind}, shape id: ${this.shape?.id}`
      )
      return
    }
  }

  updateTextShapeColors = async (config: ShapeTextConf) => {
    if (this.shape?.kind !== 'text') {
      console.error(
        `Unexpected shape type: expected text, got ${this.shape?.kind}, shape id: ${this.shape?.id}`
      )
      return
    }

    if (!this.shape.obj) {
      return
    }

    const shapeObj = this.shape.obj
    const objects =
      shapeObj instanceof fabric.Group ? shapeObj.getObjects() : [shapeObj]
    objects.forEach((obj) => obj.set({ fill: config.textStyle.color }))
    this.canvas.requestRenderAll()
  }

  updateSvgShapeColors = async (config: ShapeSvgConf) => {
    if (this.shape?.kind !== 'svg') {
      console.error(
        `Unexpected shape type: expected svg, got ${this.shape?.kind}, shape id: ${this.shape?.id}`
      )
      return
    }

    if (!this.shape.obj || !this.shape.objOriginalColors) {
      return
    }

    let shapeObj = await cloneObj(this.shape.objOriginalColors)
    shapeObj.selectable = false
    shapeObj.opacity = this.shape.obj.opacity || 1
    const { colors } = config.processing

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
      const color = colors.color

      const objects =
        shapeObj instanceof fabric.Group ? shapeObj.getObjects() : [shapeObj]
      objects.forEach((obj) => {
        obj.set({ fill: color })
        if (obj.stroke) {
          obj.set({ stroke: color })
        }
      })
    }

    this.canvas.remove(this.shape.obj)
    this.canvas.insertAt(shapeObj, 0, false)

    this.shape.obj = shapeObj

    this.canvas.requestRenderAll()
  }

  updateShapeColors = async (config: ShapeConf) => {
    this.logger.debug(
      'updateShapeColors',
      toJS(config, { recurseEverything: true })
    )
    if (!this.shape) {
      this.logger.debug('>  No current shape, early exit')
      return
    }
    if (config.kind === 'raster' && this.shape.kind === 'raster') {
      return this.updateRasterShapeColors(config)
    }
    if (config.kind === 'svg' && this.shape.kind === 'svg') {
      return this.updateSvgShapeColors(config)
    }
    if (config.kind === 'text' && this.shape.kind === 'text') {
      return this.updateTextShapeColors(config)
    }
  }

  setShapeObj = (shape: fabric.Object) => {
    if (!this.shape) {
      throw new Error('no shape')
    }
    shape.set({ selectable: this.shapeSelection })
    this.shape.obj = shape
  }

  setShapeOpacity = (opacity: number) => {
    this.logger.debug('setShapeOpacity', opacity)
    if (!this.shape) {
      return
    }
    this.shape.obj.set({ opacity })
    this.canvas.requestRenderAll()
  }

  setShapeItemsStyle = async (style: ShapeStyleConf['items']) => {
    const { coloring, dimSmallerItems } = style
    const { items } = this.items.shape
    this.logger.debug(
      'setItemsColor',
      toJS(coloring, { recurseEverything: true }),
      `${items.length} items`
    )

    let colors: string[] = []
    if (coloring.kind === 'gradient' || coloring.kind === 'color') {
      if (coloring.kind === 'color') {
        colors = [coloring.color]
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
      return 0
    })
    const maxArea = max(itemAreas)!
    const minArea = min(itemAreas)!
    const rng = seedrandom('fill color')
    let shapeRaster: fabric.Image | undefined
    let shapeRasterImgData: ImageData | undefined
    const dimSmallerFactor = dimSmallerItems / 100
    if ((!shapeRaster || !shapeRasterImgData) && this.shape?.obj) {
      shapeRaster = await cloneObjAsImage(this.shape.obj)
    }

    for (let i = 0; i < items.length; ++i) {
      const item = items[i]
      const area = itemAreas[i]

      if (item.kind !== 'word' && item.kind !== 'symbol') {
        continue
      }

      if (coloring.kind === 'gradient' || coloring.kind === 'color') {
        const index = Math.floor(rng() * colors.length)
        item.setColor(colors[index])
      } else if (coloring.kind === 'shape') {
        // TODO: Original shape color
        //
        // if (coloring.shapeStyleFill.kind === 'color') {
        //   const shapeColor = new paper.Color(coloring.shapeStyleFill.color)
        //   let color = chroma.rgb(
        //     255 * shapeColor.red,
        //     255 * shapeColor.green,
        //     255 * shapeColor.blue
        //   )
        //   if (coloring.shapeBrightness != 0) {
        //     color = color.brighten(coloring.shapeBrightness / 100)
        //   }
        //   const hex = color.hex()
        //   item.setColor(hex)
        // } else if (coloring.shapeStyleFill.kind === 'color-map') {
        //   if (this.shape?.kind === 'svg') {
        //     const colorMapSorted = sortBy(
        //       coloring.shapeStyleFill.defaultColorMap.map((color, index) => ({
        //         color,
        //         index,
        //       })),
        //       ({ color }) => chroma.distance(color, item.shapeColor, 'rgb')
        //     )
        //     const shapeColorStringIndex = colorMapSorted[0].index
        //     const shapeColorString =
        //       coloring.shapeStyleFill.colorMap[shapeColorStringIndex]
        //     const shapeColor = new paper.Color(shapeColorString)
        //     let color = chroma.rgb(
        //       255 * shapeColor.red,
        //       255 * shapeColor.green,
        //       255 * shapeColor.blue
        //     )
        //     if (coloring.shapeBrightness != 0) {
        //       color = color.brighten(coloring.shapeBrightness / 100)
        //     }
        //     const hex = color.hex()
        //     item.setColor(hex)
        //   } else if (this.shape?.kind === 'raster') {
        //     let color = chroma(item.shapeColor)
        //     if (coloring.shapeBrightness != 0) {
        //       color = color.brighten(coloring.shapeBrightness / 100)
        //     }
        //     item.setColor(color.hex())
        //   }
        // } else if (coloring.shapeStyleFill.kind === 'original') {
        //   const shape = this.shape?.shapeConfig
        //   let colorString = item.shapeColor
        //   if (shape?.kind === 'raster' && shape?.processing?.invert.enabled) {
        //     colorString = shape.processing.invert.color
        //   }
        //   let color = chroma(colorString)
        //   if (coloring.shapeBrightness != 0) {
        //     color = color.brighten(coloring.shapeBrightness / 100)
        //   }
        //   item.setColor(color.hex())
        // } else {
        //   exhaustiveCheck(coloring.kind)
        // }
      }
      item.setOpacity(
        (dimSmallerFactor * (area - minArea)) / (maxArea - minArea) +
          (1 - dimSmallerFactor)
      )
    }
    this.canvas.requestRenderAll()
  }

  /** Sets the shape, clearing the project */
  setShape = async (params: {
    shapeConfig: ShapeConf
    bgFillStyle: BgStyleConf['fill']
    shapeStyle: ShapeStyleConf
    clear: boolean
  }) => {
    console.log('setShape', params)
    const { shapeConfig } = params

    if (!shapeConfig) {
      throw new Error('Missing shape config')
    }
    this.logger.debug('setShape', toJS(params, { recurseEverything: true }))

    let colorMap: SvgShapeColorsMapEntry[] | undefined
    let shapeObj: fabric.Object | undefined
    let shape: Shape | undefined

    // Process the shape...
    if (shapeConfig.kind === 'svg') {
      shapeObj = await loadObjFromSvg(shapeConfig.url)

      colorMap = computeColorsMap(shapeObj as fabric.Group)

      shape = {
        config: shapeConfig,
        kind: 'svg',
        id: shapeConfig.id,
        isCustom: shapeConfig.isCustom || false,
        obj: shapeObj,
        objOriginalColors: shapeObj,
        originalColors: colorMap.map((c) => c.color),
        transform: new paper.Matrix().values as MatrixSerialized,
        url: shapeConfig.url,
        colorMap,
      }
    } else if (shapeConfig.kind === 'raster') {
      shapeObj = await loadObjFromImg(shapeConfig.url)
      const originalCanvas = objAsCanvasElement(shapeObj)
      const processedCanvas = objAsCanvasElement(shapeObj)

      if (shapeConfig.processing) {
        processRasterImg(processedCanvas, shapeConfig.processing)
      }
      shapeObj = new fabric.Image(canvasToImgElement(processedCanvas))

      shape = {
        config: shapeConfig,
        kind: 'raster',
        id: shapeConfig.id,
        isCustom: shapeConfig.isCustom || false,
        obj: shapeObj,
        transform: new paper.Matrix().values as MatrixSerialized,
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
        id: shapeConfig.id,
        isCustom: shapeConfig.isCustom || false,
        transform: new paper.Matrix().values as MatrixSerialized,
        obj: shapeObj,
      }
    }

    if (!shapeObj) {
      throw new Error('no shape obj')
    }

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

    if (params.clear) {
      this.clear()
    }

    const { shapeStyle, bgFillStyle } = params

    this.setBgColor(bgFillStyle)
    shapeObj.setPositionByOrigin(
      new fabric.Point(
        defaultPadding + sceneBounds.width / 2,
        defaultPadding + sceneBounds.height / 2
      ),
      'center',
      'center'
    )

    shapeObj.set({
      opacity: shapeStyle.opacity,
      selectable: false,
    })
    if (this.shape?.obj) {
      this.canvas.remove(this.shape.obj)
    }
    this.canvas.add(shapeObj)

    if (shape?.kind === 'svg') {
      const shapeCopyObj = await cloneObj(shapeObj)
      shapeCopyObj.set({ selectable: false })
      shape.objOriginalColors = shapeCopyObj
    }

    this.shape = shape!

    this.updateShapeColors(this.shape.config)

    // if (shapeConfig.kind === 'raster') {
    //   shapeStyle.kind = 'original'
    // } else if (colorMap) {
    //   shapeColors.colorMap = colorMap?.colors.map((c) => c.color)
    //   shapeColors.defaultColorMap = colorMap?.colors.map((c) => c.color)
    //   shapeColors.kind = 'color-map'
    //   console.log('setting default color map', shapeColors, colorMap)
    // }
    // await this.updateShapeColors(shapeColors)
    this.canvas.requestRenderAll()
    return { colorsMap: colorMap }
  }

  getSceneBounds = (pad = 20): paper.Rectangle =>
    new paper.Rectangle({
      x: pad,
      y: pad,
      width: this.projectBounds.width - pad * 2,
      height: this.projectBounds.height - pad * 2,
    })

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

  addShapeItems = async (itemConfigs: EditorItemConfig[]) => {
    let { items, itemsById, fabricObjToItem } = await this.convertToEditorItems(
      itemConfigs
    )
    const oldItemsToKeep = [...this.items.shape.items]
    for (const item of oldItemsToKeep) {
      itemsById.set(item.id, item)
      fabricObjToItem.set(item.fabricObj, item)
    }

    const objs = items.map((item) => item.fabricObj)
    this.canvas.add(...objs)
    this.canvas.requestRenderAll()

    this.items.shape = {
      items: [...oldItemsToKeep, ...items],
      itemsById,
      fabricObjToItem,
    }
  }

  setShapeItems = async (itemConfigs: EditorItemConfig[]) => {
    if (!this.shape?.obj) {
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
      items,
      itemsById,
      fabricObjToItem,
    }
  }

  generateBgItems = async (params: { style: BgStyleConf }) => {
    return
  }

  generateShapeItems = async (params: { style: ShapeStyleConf }) => {
    const { style } = params
    const { coloring } = style.items
    this.logger.debug('generateShapeItems')
    if (!this.shape?.obj) {
      console.error('No shape obj')
      return
    }
    const shapeObj = this.shape.obj
    const shapeOriginalColorsObj =
      this.shape.kind === 'svg' ? this.shape.objOriginalColors : this.shape.obj
    if (!shapeOriginalColorsObj) {
      console.error('No shapeOriginalColorsObj')
      return
    }

    this.store.visualizingProgress = 0
    this.store.isVisualizing = true
    for (let i = 0; i < 10; ++i) {
      await waitAnimationFrame()
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
    // shapeRaster = undefined
    const wordFonts: Font[] = await this.fetchFonts(style.items.words.fontIds)

    const shapeConfig = this.store.getSelectedShapeConf()
    const wordConfigsById = keyBy(style.items.words.wordList, 'id')

    let addedFirstBatch = false

    const result = await this.generator.fillShape(
      {
        shape: {
          canvas: shapeCanvas,
          canvasSubtract,
          shapeCanvasOriginalColors,
          bounds: shapeRasterBounds,
          processing: {
            removeWhiteBg: {
              enabled: shapeConfig.kind === 'raster',
              lightnessThreshold: 98,
            },
            shrink: {
              enabled: style.items.placement.shapePadding > 0,
              amount: style.items.placement.shapePadding,
            },
            edges: {
              enabled:
                this.shape.kind === 'raster' || this.shape.kind === 'svg'
                  ? this.shape.config.processing?.edges != null
                  : false,
              blur:
                17 *
                (1 -
                  ((this.shape.kind === 'raster' ||
                    this.shape.kind === 'svg') &&
                  this.shape.config.processing?.edges
                    ? this.shape.config.processing?.edges.amount
                    : 0) /
                    100),
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
        words: style.items.words.wordList.map((wc) => ({
          wordConfigId: wc.id,
          text: wc.text,
          angles: style.items.words.angles,
          fillColors: ['red'],
          // fonts: [fonts[0], fonts[1], fonts[2]],
          fonts: wordFonts,
        })),
        // Icons
        icons: style.items.icons.iconList.map((shape) => ({
          shape: this.store.getShapeConfById(shape.shapeId)!,
        })),
        iconsMaxSize: style.items.placement.iconsMaxSize,
        iconProbability: style.items.placement.iconsProportion / 100,
      },
      async (batch, progressPercent) => {
        // if (!addedFirstBatch) {
        //   await this.deleteNonLockedShapeItems()
        //   addedFirstBatch = true
        // }
        // const items: EditorItemConfig[] = []

        // for (const genItem of batch) {
        //   if (genItem.kind === 'word') {
        //     const wordConfig = wordConfigsById[genItem.wordConfigId]
        //     items.push({
        //       ...genItem,
        //       color: 'black',
        //       locked: false,
        //       text: wordConfig.text,
        //       customColor: wordConfig.color,
        //     })
        //   }
        // }
        // await this.addShapeItems(items)
        // console.log(
        //   'this.store.visualizingProgress=',
        //   this.store.visualizingProgress
        // )
        this.store.visualizingProgress = progressPercent
        // await this.setShapeItemsStyle(style.items)
        await waitAnimationFrame()
      }
    )

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
    await this.setShapeItemsStyle(style.items)
    this.store.isVisualizing = false
  }

  clear = async () => {
    this.logger.debug('Editor: clear')
    this.canvas.clear()

    this.shape = null

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
    this.shapeSelection = false
    this.shape.obj.selectable = false
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
}

export type TargetKind = 'shape' | 'bg'
