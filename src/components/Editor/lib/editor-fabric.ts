import { EditorPageStore } from 'components/Editor/editor-page-store'
import {
  fetchImage,
  removeLightPixels,
  createCanvas,
  Dimensions,
} from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import {
  Generator,
  ItemId,
  GeneratedItem,
  WordInfoId,
  Font,
  WordGeneratedItem,
} from 'components/Editor/lib/generator'
import chroma from 'chroma-js'
import { loadFont } from 'lib/wordart/fonts'
import { Path, Glyph } from 'opentype.js'
import { max, min, groupBy, sortBy, flatten } from 'lodash'
import seedrandom from 'seedrandom'
import {
  ShapeConfig,
  ColorString,
  ShapeStyleConfig,
  ItemsColoring,
  BackgroundStyleConfig,
} from 'components/Editor/style'

import { toJS } from 'mobx'
import { EditorPersistedData } from 'services/api/types'
import { fabric } from 'fabric'
import paper from 'paper'
import { FontId } from 'data/fonts'

export type EditorInitParams = {
  canvas: HTMLCanvasElement
  canvasWrapperEl: HTMLElement
  aspectRatio: number
  store: EditorPageStore
  serialized?: EditorPersistedData
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

  fabricObjects: {
    shapeItems?: fabric.Object[]
    shape?: fabric.Object
    originalShape?: fabric.Object
  } = {}

  // paperItems: {
  //   /** Background color */
  //   bgRect?: paper.Path
  //   /** Generated items of the background */
  //   bgItemsGroup?: paper.Group
  //   /** Generated items of the shape */
  //   shapeItemsGroup?: paper.Group

  //   /** Rendered shape */
  //   shape?: paper.Item
  //   /** Shape with the original coloring preserved */
  //   originalShape?: paper.Item
  // }

  generatedItems: {
    shape: {
      items: GeneratedItem[]
      fabricObjects: Map<number, fabric.Object>
      wordItemsInfo: Map<
        ItemId,
        { path: opentype.Path; pathBounds: opentype.BoundingBox }
      >
    }
    bg: {
      items: GeneratedItem[]
      fabricObjects: Map<number, fabric.Object>
      wordItemsInfo: Map<
        ItemId,
        { path: opentype.Path; pathBounds: opentype.BoundingBox }
      >
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

  constructor(params: EditorInitParams) {
    this.params = params
    this.store = params.store
    this.generator = new Generator()

    paper.setup(new paper.Size({ width: 1, height: 1 }))
    this.canvas = new fabric.Canvas(params.canvas.id)
    this.canvas.renderOnAddRemove = false
    // @ts-ignore
    window['canvas'] = this.canvas

    this.projectBounds = new paper.Rectangle({
      x: 0,
      y: 0,
      width: 1000,
      height: 1000 / params.aspectRatio,
    })

    this.logger.debug(
      `Editor: init, ${params.canvas.width} x ${params.canvas.height}`
    )

    // this.paperItems = {}

    this.generatedItems = {
      shape: { items: [], fabricObjects: new Map(), wordItemsInfo: new Map() },
      bg: { items: [], fabricObjects: new Map(), wordItemsInfo: new Map() },
    }

    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  }

  handleResize = () => {
    const wrapperBounds = this.params.canvasWrapperEl.getBoundingClientRect()
    wrapperBounds.width -= 40
    wrapperBounds.height -= 40

    // Update view size
    if (wrapperBounds.width / wrapperBounds.height > this.params.aspectRatio) {
      this.canvas.setWidth(this.params.aspectRatio * wrapperBounds.height)
      this.canvas.setHeight(wrapperBounds.height)
    } else {
      this.canvas.setWidth(wrapperBounds.width)
      this.canvas.setHeight(wrapperBounds.width / this.params.aspectRatio)
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

    if (!this.fabricObjects.shape || !this.fabricObjects.originalShape) {
      return
    }

    const shape = await new Promise<fabric.Object>((r) =>
      this.fabricObjects.originalShape!.clone(
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
      this.fabricObjects.shape = shape
    } else {
      this.logger.debug('>  Using single color')
      const color = config.color

      const objects =
        shape instanceof fabric.Group ? shape.getObjects() : [shape]
      objects.forEach((obj) => obj.set({ fill: color, stroke: color }))

      this.canvas.remove(this.fabricObjects.shape)
      this.canvas.insertAt(shape, 0, false)

      this.fabricObjects.shape = shape
    }

    this.setShapeFillOpacity(config.opacity)
    this.canvas.requestRenderAll()
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
    const { items, fabricObjects, wordItemsInfo } = this.generatedItems[target]
    this.logger.debug(
      'setItemsColor',
      target,
      coloring,
      `${items.length} items`
    )

    let colors: string[] = []

    if (coloring.kind === 'gradient' || coloring.kind === 'single-color') {
      if (coloring.kind === 'single-color') {
        colors = [coloring.color]
      } else if (coloring.kind === 'gradient') {
        const scale = chroma.scale([coloring.colorFrom, coloring.colorTo])
        colors = scale.colors(10)
      }
    } else if (coloring.kind === 'shape' && coloring.shapeStyleFill) {
      if (coloring.shapeStyleFill.kind === 'single-color') {
        colors = [coloring.shapeStyleFill.color]
      } else {
        colors = coloring.shapeStyleFill.colorMap
      }
    }

    const itemAreas = items.map((item) => {
      if (item.kind === 'word') {
        const entry = wordItemsInfo.get(item.id)
        if (!entry) {
          console.error('No word info for item id ', item.id)
          return 0
        }
        const wordPathBb = entry.pathBounds
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
    let shapeRaster: fabric.Image | undefined
    let shapeRasterImgData: ImageData | undefined

    const dimSmallerFactor = coloring.dimSmallerItems / 100

    if ((!shapeRaster || !shapeRasterImgData) && this.fabricObjects.shape) {
      shapeRaster = await new Promise<fabric.Image>((r) =>
        this.fabricObjects.shape!.cloneAsImage((copy: fabric.Image) => r(copy))
      )
    }

    for (let i = 0; i < items.length; ++i) {
      const item = items[i]
      const area = itemAreas[i]
      const obj = fabricObjects.get(item.id)

      if (!obj) {
        continue
      }
      if (item.kind !== 'word' && item.kind !== 'symbol') {
        continue
      }

      const objects = obj instanceof fabric.Group ? obj.getObjects() : [obj]

      if (coloring.kind === 'gradient' || coloring.kind === 'single-color') {
        const index = Math.floor(rng() * colors.length)
        objects.forEach((o) =>
          o.set({ fill: colors[index], stroke: colors[index] })
        )
      } else if (coloring.shapeStyleFill) {
        if (coloring.shapeStyleFill.kind === 'single-color') {
          const shapeColor = new paper.Color(coloring.shapeStyleFill.color)
          let color = chroma.rgb(
            255 * shapeColor.red,
            255 * shapeColor.green,
            255 * shapeColor.blue
          )
          if (coloring.shapeBrightness != 0) {
            color = color.brighten(coloring.shapeBrightness / 100)
          }
          const hex = color.hex()
          objects.forEach((o) => o.set({ fill: hex, stroke: hex }))
        } else if (coloring.shapeStyleFill.kind === 'color-map') {
          const colorMapSorted = sortBy(
            coloring.shapeStyleFill.defaultColorMap.map((color, index) => ({
              color,
              index,
            })),
            ({ color }) => chroma.distance(color, item.shapeColor, 'rgb')
          )

          const shapeColorStringIndex = colorMapSorted[0].index
          const shapeColorString =
            coloring.shapeStyleFill.colorMap[shapeColorStringIndex]

          const shapeColor = new paper.Color(shapeColorString)

          let color = chroma.rgb(
            255 * shapeColor.red,
            255 * shapeColor.green,
            255 * shapeColor.blue
          )
          if (coloring.shapeBrightness != 0) {
            color = color.brighten(coloring.shapeBrightness / 100)
          }
          const hex = color.hex()
          objects.forEach((o) => o.set({ fill: hex, stroke: hex }))
        }
      }
      obj.opacity =
        (dimSmallerFactor * (area - minArea)) / (maxArea - minArea) +
        (1 - dimSmallerFactor)
    }

    this.canvas.requestRenderAll()
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
    shapeObj.set({ opacity: shapeColors.opacity })
    this.canvas.add(shapeObj)
    this.canvas.requestRenderAll()
    this.fabricObjects.shape = shapeObj
    this.fabricObjects.originalShape = shapeCopy

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
    // const { style } = params

    // this.logger.debug('generateShapeItems')

    // if (!this.paperItems.shape) {
    //   console.error('No paperItems.shape')
    //   return
    // }
    // if (!this.paperItems.originalShape) {
    //   console.error('No paperItemsoriginal')
    //   return
    // }

    // this.store.isVisualizing = true

    // await this.generator.init()

    // const shapeItem = this.paperItems.originalShape.clone({ insert: false })
    // shapeItem.opacity = 1

    // let shapeRaster: paper.Raster | undefined = shapeItem.rasterize(
    //   this.paperItems.shape.view.resolution / paper.project.view.pixelRatio,
    //   false
    // )
    // shapeRaster.remove()

    // const shapeCanvas = shapeRaster.getSubCanvas(
    //   new paper.Rectangle(0, 0, shapeRaster.width, shapeRaster.height)
    // )

    // const sceneBounds = this.getSceneBounds(0)
    // const sceneCanvas = createCanvas({
    //   w: sceneBounds.width,
    //   h: sceneBounds.height,
    // })

    // sceneCanvas
    //   .getContext('2d')!
    //   .drawImage(shapeCanvas, shapeRaster.bounds.left, shapeRaster.bounds.top)

    // shapeRaster = undefined

    // const wordFonts: Font[] = await Promise.all(
    //   style.words.fonts.map(async (fontId) => {
    //     const { style } = this.store.getFontById(fontId)!
    //     return { font: await loadFont(style.url), id: fontId, isCustom: false }
    //   })
    // )

    // const shapeConfig = this.store.getSelectedShape()

    // const result = await this.generator.fillShape(
    //   {
    //     shape: {
    //       canvas: sceneCanvas,
    //       bounds: sceneBounds,
    //       processing: {
    //         removeWhiteBg: {
    //           enabled: shapeConfig.kind === 'img',
    //           lightnessThreshold: 98,
    //         },
    //         shrink: {
    //           enabled: style.layout.shapePadding > 0,
    //           amount: style.layout.shapePadding,
    //         },
    //         edges: {
    //           enabled: false,
    //           blur: 0,
    //           lowThreshold: 30,
    //           highThreshold: 100,
    //         },
    //         invert: {
    //           enabled: true,
    //         },
    //       },
    //     },
    //     itemPadding: Math.max(1, 100 - style.layout.itemDensity),
    //     // Words
    //     wordsMaxSize: style.layout.wordsMaxSize,
    //     words: style.words.wordList.map((wc) => ({
    //       wordConfigId: wc.id,
    //       text: wc.text,
    //       angles: style.words.angles.angles,
    //       fillColors: ['red'],
    //       // fonts: [fonts[0], fonts[1], fonts[2]],
    //       fonts: wordFonts,
    //     })),
    //     // Icons
    //     icons: style.icons.iconList.map((shape) => ({
    //       shape: this.store.getShapeById(shape.shapeId)!,
    //     })),
    //     iconsMaxSize: style.layout.iconsMaxSize,
    //     iconProbability: style.layout.iconsProportion / 100,
    //   },
    //   (progressPercent) => {
    //     this.store.visualizingProgress = progressPercent
    //   }
    // )

    // await this.setBgItems(result.generatedItems)
    // this.setItemsColor('bg', getItemsColoring(style))

    // this.store.isVisualizing = false
  }

  setBgItems = async (items: GeneratedItem[]) => {
    // const {
    //   addedItems,
    //   itemIdToPaperItem,
    // } = await this.convertItemsToPaperItems(items)
    // this.paperItems.bgItemsGroup?.remove()
    // const bgItemsGroup = new paper.Group([
    //   // this.paperItems.shape.clone(),
    //   ...addedItems,
    // ])
    // // shapeItemsGroup.clipped = true
    // this.paperItems.bgItemsGroup = bgItemsGroup
    // this.paperItems.bgItemsGroup.insertAbove(this.paperItems.bgRect!)
    // this.generatedItems.bg = {
    //   paperItems: itemIdToPaperItem,
    //   items,
    // }
  }

  setShapeItems = async (items: GeneratedItem[]) => {
    if (!this.fabricObjects.shape) {
      console.error('No shape')
      return
    }
    const {
      addedItems,
      itemIdToFabricObject,
      wordItemsInfo,
    } = await this.convertItemsToFabricItems(items)

    if (this.fabricObjects.shapeItems) {
      this.canvas.remove(...this.fabricObjects.shapeItems)
    }
    this.canvas.add(...addedItems)
    this.canvas.requestRenderAll()

    this.fabricObjects.shapeItems = addedItems
    this.generatedItems.shape = {
      fabricObjects: itemIdToFabricObject,
      items,
      wordItemsInfo,
    }
  }

  convertItemsToFabricItems = async (items: GeneratedItem[]) => {
    const addedItems: fabric.Object[] = []
    const wordItemsInfo: Map<
      ItemId,
      { path: opentype.Path; pathBounds: opentype.BoundingBox }
    > = new Map()
    let img: HTMLImageElement | null = null

    let wordIdToSymbolDef = new Map<WordInfoId, fabric.Path>()
    let itemIdToFabricObject = new Map<ItemId, fabric.Object>()

    const allWordItems = items.filter(
      (item) => item.kind === 'word'
    ) as WordGeneratedItem[]
    const wordItemsByFont = groupBy(allWordItems, 'fontId')
    const uniqFontIds = Object.keys(wordItemsByFont)
    await this.fetchFonts(uniqFontIds)

    // Process all fonts...
    for (const [fontId, wordItems] of Object.entries(wordItemsByFont)) {
      const fontInfo = this.fontsInfo.get(fontId)!
      // Process all glyphs...
      const uniqGlyphs = [
        ...new Set(
          flatten(
            wordItems.map((wi) => fontInfo.font.otFont.stringToGlyphs(wi.text))
          )
        ),
      ]
      for (const glyph of uniqGlyphs) {
        if (fontInfo.glyphs.has(glyph.name)) {
          continue
        }
        const path = glyph.getPath(0, 0, 100)
        fontInfo.glyphs.set(glyph.name, {
          glyph,
          path,
          pathData: path.toPathData(3),
        })
      }

      // Process items...
      for (const item of wordItems) {
        // let glyphs: Glyph[] = []
        // let glyphXs: number[] = []
        // let glyphYs: number[] = []
        // fontInfo.font.otFont.forEachGlyph(
        //   item.text,
        //   0,
        //   0,
        //   100,
        //   undefined,
        //   (glyph, gx, gy) => {
        //     glyphs.push(glyph)
        //     glyphXs.push(gx)
        //     glyphYs.push(0)
        //   }
        // )
        // const glyphPaths = fontInfo.font.otFont.getPaths(item.text, 0, 0, 100)
        // const glyphPathData = glyphs.map(
        //   (gl) => fontInfo.glyphs.get(gl.name)!.pathData
        // )

        // const pathItems = glyphPaths.map((path, index) => {
        //   const pathData = glyphPathData[index]
        //   const item = new fabric.Path(pathData)
        //   item.set({
        //     left: glyphXs[index],
        //     // top: glyphYs[index],
        //   })
        //   item.set({ fill: 'black', fillRule: 'evenodd' })
        //   return item
        // })

        // TODO: optimize it with glyph-based paths
        const wordPath = fontInfo.font.otFont.getPath(item.text, 0, 0, 100)
        const wordBounds = wordPath.getBoundingBox()

        // console.log('wordBounds', wordBounds)

        const wordGroup = new fabric.Group()
        // wordGroup.addWithUpdate(
        //   new fabric.Circle({
        //     top: 0,
        //     left: 0,
        //     radius: 5,
        //     fill: 'red',
        //     originX: 'left',
        //     originY: 'top',
        //   })
        // )
        wordGroup.addWithUpdate(
          // new fabric.Rect({
          //   left: -wordBounds.x1,
          //   top: -wordBounds.y1,
          //   height: wordBounds.y2 - wordBounds.y1,
          //   width: wordBounds.x2 - wordBounds.x1,
          //   fill: 'red',
          //   opacity: 0.5,
          //   originX: 'left',
          //   originY: 'bottom',
          // })
          new fabric.Path(wordPath.toPathData(3)).set({
            originX: 'left',
            originY: 'top',
          })
        )
        const wordObj = wordGroup.item(0)

        // console.log(
        //   'wordGroup = ',
        //   wordGroup.left,
        //   wordGroup.top,
        //   wordGroup.width,
        //   wordGroup.height
        // )

        wordItemsInfo.set(item.id, {
          path: wordPath,
          pathBounds: wordPath.getBoundingBox(),
        })
        wordObj.set({ fill: 'black' })

        // const wordItem = new fabric.Group(pathItems)
        wordGroup.set({
          selectable: true,
        })
        const t = item.transform
        const m = [t.a, t.b, t.c, t.d, t.tx, t.ty]
        const md = fabric.util.qrDecompose(m)

        const dy = wordBounds.y1 * md.scaleY
        const dx = wordBounds.x1 * md.scaleX
        // wordObj.set({ top: wordBounds.y1, left: wordBounds.x1 })
        wordObj.setCoords()
        wordGroup.setObjectsCoords()
        wordGroup.setCoords()

        // this.canvas.getContext().save()
        // this.canvas.getContext().resetTransform()
        // // @ts-ignore
        // this.canvas.getContext().setTransform(...m)
        // wordGroup._render(this.canvas.getContext())
        // this.canvas.getContext().restore()

        // debugger

        // TODO: fix rotation
        wordGroup.set({
          flipX: false,
          flipY: false,
          centeredRotation: false,
          originX: 'left',
          // @ts-ignore
          originY: -wordBounds.y1 / (wordBounds.y2 - wordBounds.y1),
        })
        wordGroup.set({ scaleX: md.scaleX, scaleY: md.scaleY })
        // wordGroup.setCoords()
        // wordGroup.set({
        //   left: dx,
        //   top: dy,
        // })
        wordGroup.setCoords()
        wordGroup.set({
          angle: md.angle,
        })
        // wordGroup.set({
        //   left: dx,
        //   top: dy,
        // })
        wordGroup.setCoords()
        wordGroup.set({
          left: md.translateX,
          top: md.translateY,
        })
        // wordGroup.setPositionByOrigin(
        //   new fabric.Point(md.translateX, md.translateY),
        //   'left',
        //   // @ts-ignore
        //   -wordBounds.y1 / (wordBounds.y2 - wordBounds.y1)
        // )
        wordGroup.setCoords()

        // wordItem.set({
        //   scaleX: item.transform.scaling.x,
        //   scaleY: item.transform.scaling.y,
        // })
        // wordItem.setCoords()
        // wordItem.rotate(item.transform.rotation)
        // wordItem.setCoords()
        // console.log(
        //   fontInfo.font.otFont.unitsPerEm * item.transform.scaling.y,
        //   item.transform.scaling.y
        // )
        // wordItem.set({
        //   left: item.transform.translation.x,
        //   top: item.transform.translation.y,
        // })
        //
        // const t = item.transform.inverted()
        // wordItem.set({
        //   transformMatrix: [t.a, t.b, t.c, t.d, t.tx, t.ty],
        // })

        // left: item.transform.translation.x,
        // top: item.transform.translation.y,
        // scaleX: item.transform.scaling.x,
        // scaleY: item.transform.scaling.y,
        // })
        wordGroup.setCoords()

        itemIdToFabricObject.set(item.id, wordGroup)
        addedItems.push(wordGroup)
      }
    }

    for (const item of items) {
      if (item.kind === 'symbol') {
        // const itemInstance = item.symbolDef.item.clone()
        // // itemInstance.fillColor = new paper.Color('red')
        // itemInstance.transform(item.transform)
        // addedItems.push(itemInstance)
        // itemIdToPaperItem.set(item.id, itemInstance)
      } else if (item.kind === 'img') {
        // if (!img) {
        //   const imgUri = item.ctx.canvas.toDataURL()
        //   img = await fetchImage(imgUri)
        // }
        // const itemImg = new paper.Raster(img)
        // itemImg.scale(item.transform.a)
        // const w = itemImg.bounds.width
        // const h = itemImg.bounds.height
        // itemImg.position = new paper.Point(
        //   item.transform.tx + w / 2,
        //   item.transform.ty + h / 2
        // )
        // addedItems.push(itemImg)
        // itemIdToPaperItem.set(item.id, itemImg)
      } else if (item.kind === 'word') {
        // These have been processed...
      }
    }

    return { addedItems, itemIdToFabricObject, wordItemsInfo }
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
    if (!this.fabricObjects.originalShape) {
      console.error('No paperItemsoriginal')
      return
    }
    this.store.isVisualizing = true
    await this.generator.init()
    const shapeClone = await new Promise<fabric.Object>((r) =>
      this.fabricObjects.shape!.clone((obj: fabric.Object) => r(obj))
    )
    shapeClone.set({ opacity: 1 })
    const shapeImage = await new Promise<fabric.Image>((r) =>
      shapeClone.cloneAsImage((obj: fabric.Image) => r(obj))
    )

    // const shapeOriginalImage = await new Promise<fabric.Image>((r) =>
    //   this.fabricObjects.originalShape!.cloneAsImage((obj: fabric.Image) =>
    //     r(obj)
    //   )
    // )
    // if (style.fill.kind === 'single-color') {
    //   shapeItem.fillColor = new paper.Color('black')
    //   shapeItem.strokeColor = new paper.Color('black')
    // }
    // shapeItem.opacity = 1
    // let shapeRaster: paper.Raster | undefined = shapeItem.rasterize(
    //   this.paperItems.shape.view.resolution,
    //   false
    // )
    // shapeRaster.remove()
    const shapeCanvas = (shapeImage.toCanvasElement() as any) as HTMLCanvasElement
    const shapeCanvasOriginalColors = (this.fabricObjects.originalShape.toCanvasElement() as any) as HTMLCanvasElement

    const shapeRasterBounds = new paper.Rectangle(
      this.fabricObjects.originalShape.left || 0,
      this.fabricObjects.originalShape.top || 0,
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
    await this.setShapeItems(result.generatedItems)
    await this.setItemsColor('shape', coloring)
    this.store.isVisualizing = false
  }

  clear = async () => {
    this.logger.debug('Editor: clear')
    this.canvas.clear()
  }

  destroy = () => {
    window.removeEventListener('resize', this.handleResize)
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

export const findNamedChildren = (
  item: fabric.Object,
  level = 0,
  maxLevel = 6
): { name: string; item: fabric.Object }[] => {
  const objects = item instanceof fabric.Group ? item.getObjects() : [item]
  const namedChildren = objects.filter((obj) => (obj as any).id != null)
  if (namedChildren.length > 0) {
    return namedChildren.map((child) => ({
      name: (child as any).id,
      item: child,
    }))
  }

  return []
}

/** Recursively finds all fill colors used (ignoring pure black) */
export const getFillColor = (items: fabric.Object[]): string | undefined => {
  for (let item of items) {
    if (typeof item.fill === 'string') {
      return item.fill
    }
  }
  return undefined
}

/** Recursively finds all stroke colors used */
export const getStrokeColor = (items: fabric.Object[]): string | undefined => {
  for (let item of items) {
    if (typeof item.stroke === 'string') {
      return item.stroke
    }
  }
  return undefined
}

export const computeColorsMap = (object: fabric.Object): SvgShapeColorsMap => {
  const namedChildren = sortBy(findNamedChildren(object), (c) => c.name)
  const namedChildrenByColor = groupBy(
    namedChildren,
    (ch) => ch.name.split('_')[0]
  )
  console.log('computeColorsMap', object, namedChildren)

  let colorEntries: SvgShapeColorsMapEntry[] = []
  if (Object.keys(namedChildrenByColor).length > 0) {
    Object.keys(namedChildrenByColor).forEach((colorKey) => {
      const children = namedChildrenByColor[colorKey]
      const fillColor = getFillColor(children.map((c) => c.item))
      const strokeColor = getStrokeColor(children.map((c) => c.item))

      if (fillColor !== strokeColor) {
        if (fillColor) {
          colorEntries.push({
            fabricItems: children.map((c) => c.item),
            color: fillColor,
            fill: true,
            stroke: false,
          })
        }
        if (strokeColor) {
          colorEntries.push({
            fabricItems: children.map((c) => c.item),
            color: strokeColor,
            fill: false,
            stroke: true,
          })
        }
      } else {
        if (strokeColor) {
          colorEntries.push({
            fabricItems: children.map((c) => c.item),
            color: strokeColor,
            fill: true,
            stroke: true,
          })
        }
      }
    })
  } else {
    colorEntries.push({
      fabricItems:
        object instanceof fabric.Group ? object.getObjects() : [object],
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
      fabricItems: flatten(ceGroup.map((ce) => ce.fabricItems)),
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
