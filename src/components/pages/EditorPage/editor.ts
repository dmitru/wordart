import {
  EditorPageStore,
  ItemsColoring,
  ShapeId,
} from 'components/pages/EditorPage/editor-page-store'
import { fetchImage } from 'lib/wordart/canvas-utils'
import { consoleLoggers } from 'utils/console-logger'
import { ShapeWasm } from 'lib/wordart/wasm/image-processor-wasm'
import { Generator, ItemId, Item } from 'components/pages/EditorPage/generator'
import chroma from 'chroma-js'
import paper from 'paper'
import { loadFont } from 'lib/wordart/fonts'
import { Path } from 'opentype.js'
import { max, min, flatten, groupBy, sortBy } from 'lodash'
import seedrandom from 'seedrandom'

export type EditorInitParams = {
  canvas: HTMLCanvasElement
  store: EditorPageStore
}

export class Editor {
  logger = consoleLoggers.editor

  params: EditorInitParams
  store: EditorPageStore
  generator: Generator
  shapes?: ShapeWasm[]

  paperItems: {
    bgRect?: paper.Path
    bgItemsGroup?: paper.Group
    bgWordIdToSymbolDef: Map<string, paper.SymbolDefinition>
    shape?: paper.Item
    shapeHbounds?: paper.Group
    shapeWordIdToSymbolDef: Map<string, paper.SymbolDefinition>
    shapeItemsGroup?: paper.Group
  }
  itemsShape: Item[] = []
  itemIdToPaperItem: Map<number, paper.Item> = new Map()
  shapeColorsMap: SvgShapeColorsMap | null = null

  constructor(params: EditorInitParams) {
    this.params = params
    this.store = params.store

    this.generator = new Generator()

    paper.setup(params.canvas)

    this.logger.debug(
      `Editor: init, ${params.canvas.width} x ${params.canvas.height}`
    )

    // @ts-ignore
    window['paper'] = paper

    this.paperItems = {
      bgWordIdToSymbolDef: new Map(),
      shapeWordIdToSymbolDef: new Map(),
    }

    this.setBackgroundColor(this.store.backgroundStyle.bgColors[0])

    // params.canvas.add
  }

  setBackgroundColor = (color: string) => {
    this.paperItems.bgRect?.remove()
    const bgRect = new paper.Path.Rectangle(
      new paper.Point(0, 0),
      new paper.Point(this.params.canvas.width, this.params.canvas.height)
    )
    bgRect.fillColor = new paper.Color(color)
    this.paperItems.bgRect = bgRect
  }

  setShapeFillColors = (colors: string[]) => {
    console.log('setShapeFillColors', colors, this.shapeColorsMap)

    const shapeConfig = this.store.getSelectedShape()
    if (shapeConfig.kind === 'img') {
      return
    }
    if (this.paperItems.shape) {
      if (this.shapeColorsMap) {
        this.shapeColorsMap.colors.forEach((colorEntry, entryIndex) => {
          console.log(
            `Setting color to ${colors[entryIndex]} for ${colorEntry.paperItems.length} items...`
          )
          colorEntry.paperItems.forEach((item) => {
            item.fillColor = new paper.Color(
              colors[entryIndex] || colorEntry.originalColor
            )
            item.strokeColor = item.fillColor
          })
        })
      } else {
        this.paperItems.shape.fillColor = new paper.Color(colors[0])
      }
    }
  }

  setShapeFillOpacity = (opacity: number) => {
    if (this.paperItems.shape) {
      this.paperItems.shape.opacity = opacity
    }
  }

  setItemsColor = (type: 'shape' | 'background', coloring: ItemsColoring) => {
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

    const itemAreas = this.itemsShape.map((item) => {
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

    const dimSmallerFactor = coloring.dimSmallerItems / 100
    for (let i = 0; i < this.itemsShape.length; ++i) {
      const item = this.itemsShape[i]
      const area = itemAreas[i]
      const path = this.itemIdToPaperItem.get(item.id)
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
        if (!shapeRaster) {
          shapeRaster = this.paperItems.shape?.rasterize(undefined, false)
        }
        path.fillColor = shapeRaster!.getAverageColor(path.position)
        path.strokeColor = path.fillColor
      }
      path.opacity =
        (dimSmallerFactor * (area - minArea)) / (maxArea - minArea) +
        (1 - dimSmallerFactor)
    }
  }

  setBgShape = async (
    shapeId: ShapeId
  ): Promise<{ colorsMap?: SvgShapeColorsMap }> => {
    const shapeConfig = this.store.getShapeById(shapeId)
    if (!shapeConfig) {
      throw new Error('Missing shape config')
    }
    this.paperItems.shape?.remove()
    this.paperItems.shapeHbounds?.remove()

    let shapeItem: paper.Item | undefined
    let colorsMap: SvgShapeColorsMap | undefined

    if (shapeConfig.kind === 'svg') {
      const shapeItemGroup: paper.Group = await new Promise<paper.Group>(
        (resolve) =>
          new paper.Item().importSVG(shapeConfig.url, (item: paper.Item) =>
            resolve(item as paper.Group)
          )
      )

      const findNamedChildren = (
        item: paper.Item,
        level = 0,
        maxLevel = 6
      ): { name: string; item: paper.Item }[] => {
        const namedChildren = (item as any)._namedChildren as
          | { [key: string]: paper.Item[] }
          | undefined
        if (namedChildren && Object.keys(namedChildren).length > 0) {
          return Object.keys(namedChildren).map((name) => ({
            name,
            item: namedChildren[name][0],
          }))
        }
        if (item.children && level < maxLevel) {
          const resultsForChildren = item.children.map((i) =>
            findNamedChildren(i, level + 1)
          )
          return flatten(resultsForChildren)
        }

        return []
      }

      const namedChildren = sortBy(
        findNamedChildren(shapeItemGroup),
        (c) => c.name
      )
      const namedChildrenByColor = groupBy(
        namedChildren,
        (ch) => ch.name.split('_')[0]
      )

      const getFillColor = (
        items: paper.Item[],
        level = 0,
        maxLevel = 6
      ): paper.Color | undefined => {
        for (let item of items) {
          if (item.fillColor) {
            return item.fillColor
          }
          if (item.children && level < maxLevel) {
            const color = getFillColor(item.children, level + 1)
            if (color && color.red * color.green * color.blue > 0) {
              return color
            }
          }
        }
        return undefined
      }

      const colorEntries: SvgShapeColorsMapEntry[] = []
      if (Object.keys(namedChildrenByColor).length > 0) {
        Object.keys(namedChildrenByColor).forEach((colorKey) => {
          const children = namedChildrenByColor[colorKey]
          const color = (
            getFillColor(children.map((c) => c.item)) ||
            new paper.Color('black')
          ).toCSS(true)
          colorEntries.push({
            paperItems: children.map((c) => c.item),
            color,
            originalColor: color,
          })
        })
      } else {
        colorEntries.push({
          paperItems: [shapeItemGroup],
          originalColor: 'black',
          color: 'black',
        })
      }

      colorsMap = { colors: colorEntries }

      shapeItem = shapeItemGroup
    } else {
      const shapeItemRaster: paper.Raster = await new Promise<paper.Raster>(
        (resolve) => {
          const raster = new paper.Raster(shapeConfig.url)
          raster.onLoad = () => {
            resolve(raster)
          }
        }
      )
      shapeItem = shapeItemRaster
    }

    const w = shapeItem.bounds.width
    const h = shapeItem.bounds.height

    const padding = 20
    const sceneBounds = this.getSceneBounds(padding)
    if (Math.max(w, h) !== Math.max(sceneBounds.width, sceneBounds.height)) {
      const scale = Math.min(sceneBounds.width / w, sceneBounds.height / h)
      shapeItem.scale(scale)
    }

    paper.project.clear()
    this.setBackgroundColor(this.store.backgroundStyle.bgColors[0])
    shapeItem.position = sceneBounds.center

    shapeItem.opacity = this.store.shapeStyle.bgOpacity
    shapeItem.insertAbove(this.paperItems.bgRect!)
    this.paperItems.shape = shapeItem

    this.paperItems.shapeItemsGroup?.remove()
    this.paperItems.shapeItemsGroup = undefined
    this.paperItems.bgItemsGroup?.remove()
    this.paperItems.bgItemsGroup = undefined

    this.shapes = undefined

    this.shapeColorsMap = colorsMap || null
    if (colorsMap) {
      this.setShapeFillColors(colorsMap.colors.map((c) => c.originalColor))
    }

    return { colorsMap }
  }

  getSceneBounds = (pad = 20): paper.Rectangle =>
    new paper.Rectangle({
      x: pad,
      y: pad,
      width: paper.view.bounds.width - pad * 2,
      height: paper.view.bounds.height - pad * 2,
    })

  generateItems = async (type: 'shape' | 'background') => {
    this.store.isVisualizing = true

    const isBackground = type === 'background'
    const style = isBackground
      ? this.store.backgroundStyle
      : this.store.shapeStyle

    this.logger.debug('Editor: generate')

    if (!this.paperItems.shape) {
      return
    }
    await this.generator.init()

    if (!this.paperItems.shape) {
      return
    }

    this.paperItems.shape?.insertAbove(this.paperItems.bgRect!)

    const shapeItem = this.paperItems.shape.clone({ insert: false })
    shapeItem.opacity = 1
    // shapeItem.fillColor = new paper.Color('black')
    const shapeRaster = shapeItem.rasterize(
      this.paperItems.shape.view.resolution,
      false
    )

    const shapeCanvas = shapeRaster.getSubCanvas(
      new paper.Rectangle(0, 0, shapeRaster.width, shapeRaster.height)
    )
    shapeRaster.remove()

    const wordFonts = await Promise.all(
      style.wordFonts.map((fontId) => {
        const { style } = this.store.getFontById(fontId)!
        return loadFont(style.url)
      })
    )

    const shapeConfig = this.store.getSelectedShape()

    const result = await this.generator.fillShape({
      shape: {
        canvas: shapeCanvas,
        bounds: shapeRaster.bounds,
        processing: {
          removeWhiteBg: {
            enabled: shapeConfig.kind === 'img',
            lightnessThreshold: 98,
          },
          shrink: {
            enabled: style.shapePadding > 0,
            amount: style.shapePadding,
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
      itemPadding: Math.max(1, 100 - style.itemDensity),
      wordsMaxSize: style.wordsMaxSize,
      iconsMaxSize: style.iconsMaxSize,
      words: style.words.map((wc) => ({
        wordConfigId: wc.id,
        text: wc.text,
        angles: style.angles,
        fillColors: ['red'],
        // fonts: [fonts[0], fonts[1], fonts[2]],
        fonts: wordFonts,
      })),
      icons: style.icons.map((shape) => ({
        shape: this.store.getShapeById(shape.shapeId)!,
      })),
      iconProbability: style.iconsProportion / 100,
    })

    this.itemsShape = result.placedItems

    const addedItems: paper.Item[] = []
    let img: HTMLImageElement | null = null

    let wordIdToSymbolDef = new Map<string, paper.SymbolDefinition>()
    let itemIdToPaperItem = new Map<ItemId, paper.Item>()

    const coloring = this.store.getItemColoring(type)

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
            item.fillColor = new paper.Color(style.itemsColor)
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
    this.paperItems.shapeWordIdToSymbolDef = wordIdToSymbolDef

    this.itemIdToPaperItem = itemIdToPaperItem
    this.setItemsColor(type, coloring)

    this.store.isVisualizing = false
  }

  clear = async (render = true) => {
    this.logger.debug('Editor: clear')
    this.paperItems.shape?.remove()
    this.paperItems.shapeHbounds?.remove()
    this.paperItems.shapeItemsGroup?.remove()
    this.paperItems.bgItemsGroup?.remove()
  }

  destroy = () => {}
}

export type SvgShapeColorsMap = {
  colors: SvgShapeColorsMapEntry[]
}

export type SvgShapeColorsMapEntry = {
  color: string
  originalColor: string
  paperItems: paper.Item[]
}
