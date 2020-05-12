import { EditorPageStore } from 'components/pages/EditorPage/editor-page-store'
import {
  fetchImage,
  removeLightPixels,
  invertImageMask,
  createCanvas,
} from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import { Generator, ItemId, Item } from 'components/pages/EditorPage/generator'
import chroma from 'chroma-js'
import paper from 'paper'
import { loadFont } from 'lib/wordart/fonts'
import { Path } from 'opentype.js'
import { max, min, groupBy, sortBy, flatten } from 'lodash'
import seedrandom from 'seedrandom'
import {
  ShapeConfig,
  ColorString,
  ShapeStyleConfig,
  ItemsColoring,
  BackgroundStyleConfig,
} from 'components/pages/EditorPage/style'
import {
  findNamedChildren,
  getFillColor,
  getStrokeColor,
} from 'components/pages/EditorPage/paper-utils'
import { toJS } from 'mobx'

export type EditorInitParams = {
  canvas: HTMLCanvasElement
  store: EditorPageStore
}

export class Editor {
  logger = consoleLoggers.editor

  private params: EditorInitParams
  private store: EditorPageStore
  private generator: Generator

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

  paperItems: {
    /** Background color */
    bgRect?: paper.Path
    /** Generated items of the background */
    bgItemsGroup?: paper.Group
    /** Generated items of the shape */
    shapeItemsGroup?: paper.Group

    /** Rendered shape */
    shape?: paper.Item
    /** Shape with the original coloring preserved */
    originalShape?: paper.Item
  }

  generatedItems: {
    shape: {
      items: Item[]
      itemIdToPaperItem: Map<number, paper.Item>
    }
    bg: {
      items: Item[]
      itemIdToPaperItem: Map<number, paper.Item>
    }
  }

  constructor(params: EditorInitParams) {
    this.params = params
    this.store = params.store
    this.generator = new Generator()

    paper.setup(params.canvas)
    // @ts-ignore
    window['paper'] = paper

    this.logger.debug(
      `Editor: init, ${params.canvas.width} x ${params.canvas.height}`
    )

    this.paperItems = {}

    this.generatedItems = {
      shape: { items: [], itemIdToPaperItem: new Map() },
      bg: { items: [], itemIdToPaperItem: new Map() },
    }
  }

  setBgColor = (config: BgFillColorsConfig) => {
    this.logger.debug('setBgColor', toJS(config, { recurseEverything: true }))

    const bgRect = new paper.Path.Rectangle(
      new paper.Point(0, 0),
      new paper.Point(this.params.canvas.width, this.params.canvas.height)
    )
    bgRect.fillColor = new paper.Color(config.color)
    bgRect.opacity = config.kind === 'transparent' ? 0 : 1

    this.paperItems.bgRect?.remove()
    paper.project.activeLayer.insertChild(0, bgRect)
    this.paperItems.bgRect = bgRect
  }

  setShapeFillColors = (config: ShapeFillColorsConfig) => {
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

    if (!this.paperItems.shape || !this.paperItems.originalShape) {
      return
    }

    if (config.kind === 'color-map') {
      const shape = this.paperItems.originalShape.clone() as paper.Group
      const colorsMap = computeColorsMap(shape)

      this.logger.debug('>  Using color map', colorsMap)
      colorsMap.colors.forEach((colorEntry, entryIndex) => {
        this.logger.debug(
          `>    Setting color to ${config.colorMap[entryIndex]}, ${colorEntry.color} for ${colorEntry.paperItems.length} items...`
        )
        colorEntry.paperItems.forEach((item) => {
          const color = config.colorMap[entryIndex] || colorEntry.color
          if (colorEntry.fill) {
            item.fillColor = new paper.Color(color)
          }
          if (colorEntry.stroke) {
            item.strokeColor = new paper.Color(color)
          }
        })
      })

      this.paperItems.shape.remove()
      paper.project.activeLayer.insertChild(1, shape)

      this.currentShape.colorsMap = colorsMap
      this.paperItems.shape = shape
    } else {
      this.logger.debug('>  Using single color')

      const shape = this.paperItems.originalShape.clone()
      const color = new paper.Color(config.color)
      shape.fillColor = color
      shape.strokeColor = color

      this.paperItems.shape.remove()
      paper.project.activeLayer.insertChild(1, shape)

      this.paperItems.shape = shape
    }

    this.setShapeFillOpacity(config.opacity)
  }

  setShapeFillOpacity = (opacity: number) => {
    this.logger.debug('setShapeFillOpacity', opacity)
    if (!this.paperItems.shape) {
      return
    }
    this.paperItems.shape.opacity = opacity
  }

  setItemsColor = (target: TargetKind, coloring: ItemsColoring) => {
    const { items, itemIdToPaperItem } = this.generatedItems[target]
    this.logger.debug(
      'setItemsColor',
      target,
      coloring,
      `${items.length} items`
    )

    let paperColors: paper.Color[] = []

    if (coloring.kind === 'gradient' || coloring.kind === 'single-color') {
      let colors: string[] = []
      if (coloring.kind === 'single-color') {
        colors = [coloring.color]
      } else if (coloring.kind === 'gradient') {
        const scale = chroma.scale([coloring.colorFrom, coloring.colorTo])
        colors = scale.colors(10)
      }
      paperColors = colors.map((color) => new paper.Color(color))
    }

    const itemAreas = items.map((item) => {
      if (item.kind === 'word') {
        const wordPathBb = item.wordPathBounds
        const scaling = item.transform.scaling
        const wordH = (wordPathBb.y2 - wordPathBb.y1) * scaling.y
        const wordW = (wordPathBb.x2 - wordPathBb.x1) * scaling.x
        const wordArea = Math.sqrt(wordH * wordW)
        return wordArea
      }

      if (item.kind === 'symbol') {
        const bounds = item.symbolDef.item.bounds
        const w = bounds.width * item.transform.scaling.x
        const h = bounds.height * item.transform.scaling.y
        return Math.sqrt(w * h)
      }

      return 0
    })

    const maxArea = max(itemAreas)!
    const minArea = min(itemAreas)!

    const rng = seedrandom('fill color')
    let shapeRaster: paper.Raster | undefined
    let shapeRasterImgData: ImageData | undefined

    const dimSmallerFactor = coloring.dimSmallerItems / 100

    if ((!shapeRaster || !shapeRasterImgData) && this.paperItems.shape) {
      const shapeItemClone = this.paperItems.shape.clone({ insert: false })
      shapeItemClone.opacity = 1
      shapeRaster = shapeItemClone.rasterize(undefined, false)
      shapeRasterImgData = shapeRaster.getImageData(
        new paper.Rectangle(0, 0, shapeRaster!.width, shapeRaster!.height)
      )
      shapeItemClone.remove()
    }

    // const canvas = shapeRaster!.getSubCanvas(
    //   new paper.Rectangle(0, 0, shapeRaster!.width, shapeRaster!.height)
    // )
    // const ctx = canvas.getContext('2d')!

    for (let i = 0; i < items.length; ++i) {
      const item = items[i]
      const area = itemAreas[i]
      const path = itemIdToPaperItem.get(item.id)
      if (!path) {
        continue
      }
      if (item.kind !== 'word' && item.kind !== 'symbol') {
        continue
      }

      if (coloring.kind === 'gradient' || coloring.kind === 'single-color') {
        const index = Math.floor(rng() * paperColors.length)
        path.fillColor = paperColors[index]
        path.strokeColor = path.fillColor
      } else {
        if (!shapeRaster || !shapeRasterImgData) {
          shapeRaster = this.paperItems.shape?.rasterize(undefined, false)
          shapeRasterImgData = shapeRaster!.getImageData(
            new paper.Rectangle(0, 0, shapeRaster!.width, shapeRaster!.height)
          )
        }

        const imgDataPos = path.position
          .subtract(shapeRaster!.bounds.topLeft)
          .multiply(shapeRasterImgData.width / shapeRaster!.bounds.width)
        imgDataPos.x = Math.round(imgDataPos.x)
        imgDataPos.y = Math.round(imgDataPos.y)

        // ctx.fillStyle = 'red'
        // ctx.fillRect(imgDataPos.x, imgDataPos.y, 10, 10)

        const r =
          shapeRasterImgData.data[
            4 * (imgDataPos.x + imgDataPos.y * shapeRasterImgData.width)
          ] / 255
        const g =
          shapeRasterImgData.data[
            4 * (imgDataPos.x + imgDataPos.y * shapeRasterImgData.width) + 1
          ] / 255
        const b =
          shapeRasterImgData.data[
            4 * (imgDataPos.x + imgDataPos.y * shapeRasterImgData.width) + 2
          ] / 255

        // console.log(
        //   'shapeRasterImgData',
        //   shapeRasterImgData.width,
        //   shapeRasterImgData.height,
        //   imgDataPos.x,
        //   imgDataPos.y,
        //   r,
        //   g,
        //   b
        // )

        path.fillColor = new paper.Color(r, g, b, 1)
        path.strokeColor = path.fillColor
      }
      path.opacity =
        (dimSmallerFactor * (area - minArea)) / (maxArea - minArea) +
        (1 - dimSmallerFactor)
    }

    // console.screenshot(ctx.canvas, 0.3)
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

    // Process the shape...
    if (shape.kind === 'svg') {
      const shapeItemGroup: paper.Group = await new Promise<paper.Group>(
        (resolve) =>
          new paper.Item().importSVG(shape.url, (item: paper.Item) => {
            item.remove()
            resolve(item as paper.Group)
          })
      )

      colorsMap = computeColorsMap(shapeItemGroup)

      shapeItem = shapeItemGroup
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

    // TODO: configure these
    const w = shapeItem.bounds.width
    const h = shapeItem.bounds.height
    const padding = 20

    const sceneBounds = this.getSceneBounds(padding)
    if (Math.max(w, h) !== Math.max(sceneBounds.width, sceneBounds.height)) {
      const scale = Math.min(sceneBounds.width / w, sceneBounds.height / h)
      shapeItem.scale(scale)
    }

    this.clear()

    this.setBgColor(bgColors)
    shapeItem.position = sceneBounds.center

    this.paperItems.shape = shapeItem
    this.paperItems.originalShape = shapeItem.clone({ insert: false })

    shapeItem.opacity = shapeColors.opacity
    this.paperItems.shape?.remove()
    shapeItem.insertAbove(this.paperItems.bgRect!)

    this.paperItems.shapeItemsGroup?.remove()
    this.paperItems.shapeItemsGroup = undefined
    this.paperItems.bgItemsGroup?.remove()
    this.paperItems.bgItemsGroup = undefined

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
    }
    this.setShapeFillColors(shapeColors)
    return { colorsMap }
  }

  getSceneBounds = (pad = 20): paper.Rectangle =>
    new paper.Rectangle({
      x: pad,
      y: pad,
      width: paper.view.bounds.width - pad * 2,
      height: paper.view.bounds.height - pad * 2,
    })

  generateBgItems = async (params: { style: BackgroundStyleConfig }) => {
    const { style } = params
    const coloring = getItemsColoring(style)

    this.logger.debug('generateShapeItems')

    if (!this.paperItems.shape) {
      console.error('No paperItems.shape')
      return
    }
    if (!this.paperItems.originalShape) {
      console.error('No paperItemsoriginal')
      return
    }

    this.store.isVisualizing = true

    await this.generator.init()

    const shapeItem = this.paperItems.originalShape.clone({ insert: false })
    shapeItem.opacity = 1

    let shapeRaster: paper.Raster | undefined = shapeItem.rasterize(
      this.paperItems.shape.view.resolution / paper.project.view.pixelRatio,
      false
    )
    shapeRaster.remove()

    const shapeCanvas = shapeRaster.getSubCanvas(
      new paper.Rectangle(0, 0, shapeRaster.width, shapeRaster.height)
    )

    const sceneBounds = this.getSceneBounds(0)
    const sceneCanvas = createCanvas({
      w: sceneBounds.width,
      h: sceneBounds.height,
    })

    sceneCanvas
      .getContext('2d')!
      .drawImage(shapeCanvas, shapeRaster.bounds.left, shapeRaster.bounds.top)

    shapeRaster = undefined

    const wordFonts = await Promise.all(
      style.words.fonts.map((fontId) => {
        const { style } = this.store.getFontById(fontId)!
        return loadFont(style.url)
      })
    )

    const shapeConfig = this.store.getSelectedShape()

    const result = await this.generator.fillShape(
      {
        shape: {
          canvas: sceneCanvas,
          bounds: sceneBounds,
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
              enabled: false,
              blur: 0,
              lowThreshold: 30,
              highThreshold: 100,
            },
            invert: {
              enabled: true,
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

    const addedItems: paper.Item[] = []
    let img: HTMLImageElement | null = null

    let wordIdToSymbolDef = new Map<string, paper.SymbolDefinition>()
    let itemIdToPaperItem = new Map<ItemId, paper.Item>()

    for (const item of result.placedItems) {
      if (item.kind === 'symbol') {
        const itemInstance = item.symbolDef.item.clone()
        // itemInstance.fillColor = new paper.Color('red')
        itemInstance.transform(item.transform)
        addedItems.push(itemInstance)
        itemIdToPaperItem.set(item.id, itemInstance)
      } else if (item.kind === 'img') {
        if (!img) {
          const imgUri = item.ctx.canvas.toDataURL()
          img = await fetchImage(imgUri)
        }
        const itemImg = new paper.Raster(img)
        itemImg.scale(item.transform.a)
        const w = itemImg.bounds.width
        const h = itemImg.bounds.height
        itemImg.position = new paper.Point(
          item.transform.tx + w / 2,
          item.transform.ty + h / 2
        )
        addedItems.push(itemImg)
        itemIdToPaperItem.set(item.id, itemImg)
      } else if (item.kind === 'word') {
        const wordId = item.word.id

        if (!wordIdToSymbolDef.has(wordId)) {
          const paths = item.word.font.getPaths(
            item.word.text,
            0,
            0,
            item.word.fontSize
          )

          const pathItems = paths.map((path: Path) => {
            let pathData = path.toPathData(3)
            const item = paper.Path.create(pathData)
            item.fillColor = new paper.Color(style.itemsColoring.color)
            item.fillRule = 'evenodd'
            return item
          })
          const pathItemsGroup = new paper.Group(pathItems)
          const symbolDef = new paper.SymbolDefinition(pathItemsGroup, true)
          wordIdToSymbolDef.set(wordId, symbolDef)
        }

        const symbolDef = wordIdToSymbolDef.get(wordId)!

        const wordItem = symbolDef.item.clone()

        wordItem.rotate(
          (item.word.angle / Math.PI) * 180,
          new paper.Point(0, 0)
        )
        wordItem.transform(item.transform)
        addedItems.push(wordItem)

        itemIdToPaperItem.set(item.id, wordItem)
      }
    }

    this.paperItems.bgItemsGroup?.remove()
    const bgItemsGroup = new paper.Group([
      // this.paperItems.shape.clone(),
      ...addedItems,
    ])

    // shapeItemsGroup.clipped = true
    this.paperItems.bgItemsGroup = bgItemsGroup
    this.paperItems.bgItemsGroup.insertAbove(this.paperItems.bgRect!)

    this.generatedItems.bg = {
      itemIdToPaperItem,
      items: result.placedItems,
    }
    this.setItemsColor('bg', coloring)

    this.store.isVisualizing = false
  }

  generateShapeItems = async (params: { style: ShapeStyleConfig }) => {
    const { style } = params
    const coloring = getItemsColoring(style)

    this.logger.debug('generateShapeItems')

    if (!this.paperItems.shape) {
      console.error('No paperItems.shape')
      return
    }
    if (!this.paperItems.originalShape) {
      console.error('No paperItemsoriginal')
      return
    }

    this.store.isVisualizing = true

    await this.generator.init()

    const shapeItem = this.paperItems.originalShape.clone({ insert: false })
    if (style.fill.kind === 'single-color') {
      shapeItem.fillColor = new paper.Color('black')
      shapeItem.strokeColor = new paper.Color('black')
    }
    shapeItem.opacity = 1

    let shapeRaster: paper.Raster | undefined = shapeItem.rasterize(
      this.paperItems.shape.view.resolution,
      false
    )
    shapeRaster.remove()

    const shapeCanvas = shapeRaster.getSubCanvas(
      new paper.Rectangle(0, 0, shapeRaster.width, shapeRaster.height)
    )
    const shapeRasterBounds = shapeRaster.bounds

    shapeRaster = undefined

    const wordFonts = await Promise.all(
      style.words.fonts.map((fontId) => {
        const { style } = this.store.getFontById(fontId)!
        return loadFont(style.url)
      })
    )

    const shapeConfig = this.store.getSelectedShape()

    const result = await this.generator.fillShape(
      {
        shape: {
          canvas: shapeCanvas,
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

    const addedItems: paper.Item[] = []
    let img: HTMLImageElement | null = null

    let wordIdToSymbolDef = new Map<string, paper.SymbolDefinition>()
    let itemIdToPaperItem = new Map<ItemId, paper.Item>()

    for (const item of result.placedItems) {
      if (item.kind === 'symbol') {
        const itemInstance = item.symbolDef.item.clone()
        // itemInstance.fillColor = new paper.Color('red')
        itemInstance.transform(item.transform)
        addedItems.push(itemInstance)
        itemIdToPaperItem.set(item.id, itemInstance)
      } else if (item.kind === 'img') {
        if (!img) {
          const imgUri = item.ctx.canvas.toDataURL()
          img = await fetchImage(imgUri)
        }
        const itemImg = new paper.Raster(img)
        itemImg.scale(item.transform.a)
        const w = itemImg.bounds.width
        const h = itemImg.bounds.height
        itemImg.position = new paper.Point(
          item.transform.tx + w / 2,
          item.transform.ty + h / 2
        )
        addedItems.push(itemImg)
        itemIdToPaperItem.set(item.id, itemImg)
      } else if (item.kind === 'word') {
        const wordId = item.word.id

        if (!wordIdToSymbolDef.has(wordId)) {
          const paths = item.word.font.getPaths(
            item.word.text,
            0,
            0,
            item.word.fontSize
          )

          const pathItems = paths.map((path: Path) => {
            let pathData = path.toPathData(3)
            const item = paper.Path.create(pathData)
            item.fillColor = new paper.Color(style.itemsColoring.color)
            item.fillRule = 'evenodd'
            return item
          })
          const pathItemsGroup = new paper.Group(pathItems)
          const symbolDef = new paper.SymbolDefinition(pathItemsGroup, true)
          wordIdToSymbolDef.set(wordId, symbolDef)
        }

        const symbolDef = wordIdToSymbolDef.get(wordId)!

        const wordItem = symbolDef.item.clone()

        wordItem.rotate(
          (item.word.angle / Math.PI) * 180,
          new paper.Point(0, 0)
        )
        wordItem.transform(item.transform)
        addedItems.push(wordItem)

        itemIdToPaperItem.set(item.id, wordItem)
      }
    }

    this.paperItems.shapeItemsGroup?.remove()
    const shapeItemsGroup = new paper.Group([
      // this.paperItems.shape.clone(),
      ...addedItems,
    ])

    // shapeItemsGroup.clipped = true
    this.paperItems.shapeItemsGroup = shapeItemsGroup
    this.paperItems.shapeItemsGroup.insertAbove(this.paperItems.shape)

    this.generatedItems.shape = {
      itemIdToPaperItem,
      items: result.placedItems,
    }
    this.setItemsColor('shape', coloring)

    this.store.isVisualizing = false
  }

  clear = async () => {
    this.logger.debug('Editor: clear')
    paper.project.clear()
    this.paperItems = {}
  }

  destroy = () => {}
}

export type SvgShapeColorsMap = {
  colors: SvgShapeColorsMapEntry[]
}

export type SvgShapeColorsMapEntry = {
  stroke: boolean
  fill: boolean
  color: ColorString
  paperItems: paper.Item[]
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
  }
}

export const computeColorsMap = (
  shapeItemGroup: paper.Group
): SvgShapeColorsMap => {
  const namedChildren = sortBy(findNamedChildren(shapeItemGroup), (c) => c.name)
  const namedChildrenByColor = groupBy(
    namedChildren,
    (ch) => ch.name.split('_')[0]
  )

  let colorEntries: SvgShapeColorsMapEntry[] = []
  if (Object.keys(namedChildrenByColor).length > 0) {
    Object.keys(namedChildrenByColor).forEach((colorKey) => {
      const children = namedChildrenByColor[colorKey]
      const fillColor = (
        getFillColor(children.map((c) => c.item)) || new paper.Color('black')
      ).toCSS(true)
      const strokeColor = (
        getStrokeColor(children.map((c) => c.item)) || new paper.Color('black')
      ).toCSS(true)

      if (fillColor !== strokeColor) {
        colorEntries.push({
          paperItems: children.map((c) => c.item),
          color: fillColor,
          fill: true,
          stroke: false,
        })
        colorEntries.push({
          paperItems: children.map((c) => c.item),
          color: strokeColor,
          fill: false,
          stroke: true,
        })
      } else {
        colorEntries.push({
          paperItems: children.map((c) => c.item),
          color: strokeColor,
          fill: true,
          stroke: true,
        })
      }
    })
  } else {
    colorEntries.push({
      paperItems: [shapeItemGroup],
      color: '#333',
      stroke: true,
      fill: true,
    })
  }

  // Deduplicate color entries
  const colorEntriesGrouped = groupBy(
    colorEntries,
    (e) => `${e.color}:${e.fill}:${e.stroke}`
  )
  colorEntries = Object.values(colorEntriesGrouped).map((ceGroup) => {
    const ce = ceGroup[0]
    return {
      fill: ce.fill,
      stroke: ce.stroke,
      color: ce.color,
      paperItems: flatten(ceGroup.map((ce) => ce.paperItems)),
    } as SvgShapeColorsMapEntry
  })

  // Sort color entries
  colorEntries = sortBy(
    colorEntries,
    (ce) => -(10 * (ce.fill ? 1 : 0) + (ce.stroke ? 1 : 0))
  )

  const colorsMap: SvgShapeColorsMap = { colors: colorEntries }
  return colorsMap
}
