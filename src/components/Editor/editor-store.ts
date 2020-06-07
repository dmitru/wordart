import {
  defaultBgStyleOptions,
  defaultShapeStyleOptions,
} from 'components/Editor/default-style-options'
import {
  Editor,
  EditorInitParams,
  TargetKind,
} from 'components/Editor/lib/editor'
import { EditorItemConfigWord } from 'components/Editor/lib/editor-item-word'
import {
  applyTransformToObj,
  cloneObj,
  objAsCanvasElement,
  getObjTransformMatrix,
} from 'components/Editor/lib/fabric-utils'
import { Font } from 'components/Editor/lib/generator'
import { Shape, SvgShapeColorsMapEntry } from 'components/Editor/shape'
import {
  ShapeConf,
  ShapeId,
  ShapeRasterConf,
  ShapeTextConf,
} from 'components/Editor/shape-config'
import {
  getAnglesForPreset,
  mkBgStyleConfFromOptions,
  mkShapeStyleConfFromOptions,
} from 'components/Editor/style'
import {
  BgFill,
  BgStyleOptions,
  ItemsColoringColorConf,
  ItemsColoringGradientConf,
  ItemsColoringShapeConf,
  ShapeStyleOptions,
  WordListEntry,
  ColorString,
} from 'components/Editor/style-options'
import { FontConfig, fonts, FontStyleConfig, FontId } from 'data/fonts'
import { shapes } from 'data/shapes'
import { loadFont } from 'lib/wordart/fonts'
import { sortBy, uniq, uniqBy, cloneDeep } from 'lodash'
import { action, observable, set } from 'mobx'
import paper from 'paper'
import {
  MatrixSerialized,
  PersistedItemV1,
  PersistedItemWordV1,
  PersistedShapeConfV1,
  PersistedWordV1,
  PersistedItemShapeV1,
} from 'services/api/persisted/v1'
import { EditorPersistedData } from 'services/api/types'
import { RootStore } from 'services/root-store'
import { consoleLoggers } from 'utils/console-logger'
import { UninqIdGenerator as UniqIdGenerator } from 'utils/ids'
import { notEmpty } from 'utils/not-empty'
import { roundFloat } from 'utils/round-float'
import { exhaustiveCheck } from 'utils/type-utils'
import { waitAnimationFrame } from 'utils/async'
import {
  EditorItemId,
  EditorItem,
  EditorItemConfig,
} from 'components/Editor/lib/editor-item'
import { EditorItemConfigShape } from 'components/Editor/lib/editor-item-icon'
import { createCanvas } from 'lib/wordart/canvas-utils'

export type EditorMode = 'view' | 'edit items'

export type EditorStoreInitParams = Pick<
  EditorInitParams,
  'aspectRatio' | 'canvas' | 'canvasWrapperEl' | 'serialized'
>

export class EditorStore {
  logger = consoleLoggers.editorStore
  @observable lifecycleState: 'initializing' | 'initialized' | 'destroyed' =
    'initializing'

  rootStore: RootStore
  editor: Editor | null = null
  @observable renderKey = 1

  @observable isVisualizing = false
  @observable visualizingProgress = null as number | null

  @observable mode: EditorMode = 'view'

  /** Ui state of the various settings of the editor */
  @observable styleOptions = {
    bg: defaultBgStyleOptions,
    shape: defaultShapeStyleOptions,
  }

  @observable pageSize: PageSize = {
    kind: 'preset',
    preset: pageSizePresets[1],
  }

  @observable hasItemChanges = false
  @observable availableShapes: ShapeConf[] = shapes
  @observable selectedShapeId: ShapeId = shapes[4].id

  wordIdGen = new UniqIdGenerator(3)
  customImgIdGen = new UniqIdGenerator(3)

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
  }

  @observable selectedItemData: {
    id: EditorItemId
    locked: boolean
    color: string
    customColor: string | undefined
    customText: string | undefined
  } | null = null
  selectedItem: EditorItem | null = null

  @action initEditor = async (params: EditorStoreInitParams) => {
    this.logger.debug('initEditor', params)

    this.editor = new Editor({
      ...params,
      store: this,
      onItemSelected: (item) => {
        this.selectedItem = item
        this.selectedItemData = {
          id: item.id,
          locked: item.locked,
          color: item.color,
          customColor: item.customColor,
          customText: item.kind === 'word' ? item.customText : '',
        }
      },
      onItemSelectionCleared: () => {
        this.selectedItemData = null
        this.selectedItem = null
      },
      onItemUpdated: (item) => {
        this.hasItemChanges = true
        this.selectedItem = item
        this.selectedItemData = {
          id: item.id,
          locked: item.locked,
          color: item.color,
          customColor: item.customColor,
          customText: item.kind === 'word' ? item.customText : '',
        }
      },
    })
    this.editor.setBgColor(mkBgStyleConfFromOptions(this.styleOptions.bg).fill)
    // @ts-ignore
    window['editor'] = this.editor

    if (params.serialized) {
      await this.loadSerialized(params.serialized)
    } else {
      await this.selectShape(shapes[5].id)
    }

    this.enterViewMode('shape')

    this.lifecycleState = 'initialized'
  }

  setItemLock = (lockValue: boolean) => {
    if (!this.selectedItem || !this.selectedItemData) {
      return
    }
    this.selectedItem.setLocked(lockValue)
    this.selectedItemData.locked = lockValue
    this.editor?.canvas.requestRenderAll()
  }

  // TODO
  resetAllItems = () => {
    this.hasItemChanges = false
  }

  setItemCustomColor = (color: string) => {
    if (!this.selectedItem || !this.selectedItemData) {
      return
    }
    this.hasItemChanges = true
    this.selectedItem.setCustomColor(color)
    this.selectedItem.setLocked(true)
    this.selectedItemData.customColor = color
    this.selectedItemData.locked = true
    this.editor?.canvas.requestRenderAll()
  }

  resetItemCustomColor = () => {
    if (!this.selectedItem || !this.selectedItemData) {
      return
    }
    this.selectedItem.clearCustomColor()
    this.selectedItemData.customColor = undefined
    this.editor?.canvas.requestRenderAll()
  }

  @action enterEditItemsMode = (target: TargetKind) => {
    this.mode = 'edit items'
    if (!this.editor) {
      return
    }
    this.editor.showLockBorders()
    this.editor.enableItemsSelection(target)
    this.editor.enableSelectionMode()
  }

  @action enterViewMode = (target: TargetKind) => {
    this.mode = 'view'
    if (!this.editor) {
      return
    }
    this.selectedItemData = null
    this.selectedItem = null
    this.editor.hideLockBorders()
    this.editor.disableItemsSelection(target)
    this.editor.disableSelectionMode()
  }

  @action private loadSerialized = async (serialized: EditorPersistedData) => {
    this.logger.debug('loadSerialized', serialized)
    if (!this.editor) {
      throw new Error('editor is not initialized')
    }

    const { data } = serialized
    this.editor.setAspectRatio(
      serialized.data.sceneSize.w / serialized.data.sceneSize.h
    )
    this.availableShapes = this.availableShapes.filter((s) => !s.isCustom)

    if (data.shape.kind === 'custom-raster') {
      const customImgId = this.addCustomShapeImg({
        kind: 'raster',
        title: 'Custom',
        url: data.shape.url,
        isCustom: true,
        thumbnailUrl: data.shape.url,
        processedThumbnailUrl: data.shape.url,
        processing: data.shape.processing,
      })
      await this.selectShape(customImgId, false)
    } else if (data.shape.kind === 'custom-text') {
      const customImgId = this.addCustomShapeText({
        kind: 'text',
        title: 'Custom',
        isCustom: true,
        thumbnailUrl: '',
        processedThumbnailUrl: '', // TODO
        text: data.shape.text,
        textStyle: data.shape.textStyle,
      })
      await this.selectShape(customImgId, false)
    } else if (
      (data.shape.kind === 'raster' || data.shape.kind === 'svg') &&
      data.shape.shapeId != null
    ) {
      await this.selectShape(data.shape.shapeId, false)
    }

    const shape = this.editor.shape
    if (data.shape.transform && shape) {
      applyTransformToObj(shape.obj, data.shape.transform)
      if (shape.kind === 'svg') {
        applyTransformToObj(shape.objOriginalColors, data.shape.transform)
      }
    }

    if (
      shape?.kind === 'svg' &&
      data.shape.kind === 'svg' &&
      data.shape.processing
    ) {
      shape.config.processing = data.shape.processing
    } else if (
      shape?.kind === 'raster' &&
      data.shape.kind === 'raster' &&
      data.shape.processing
    ) {
      shape.config.processing = data.shape.processing
    }

    const sceneSize = this.editor.getSceneBounds(0)
    const scale = sceneSize.width / serialized.data.sceneSize.w

    // Restore BG style options
    if (data.bgStyle.fill.kind === 'color') {
      this.styleOptions.bg.fill.color = data.bgStyle.fill
    } else if (data.bgStyle.fill.kind === 'transparent') {
      this.styleOptions.bg.fill.kind = 'transparent'
    }

    const bgStyle = this.styleOptions.bg
    bgStyle.items.dimSmallerItems = data.bgStyle.items.dimSmallerItems
    bgStyle.items.opacity = data.bgStyle.items.opacity
    bgStyle.items.placement = data.bgStyle.items.placement
    bgStyle.items.icons.iconList = data.bgStyle.items.icons.iconList
    bgStyle.items.words.customAngles = data.bgStyle.items.words.angles
    bgStyle.items.words.wordList = data.bgStyle.items.words.wordList
    bgStyle.items.words.fontIds = data.bgStyle.items.words.fontIds

    if (data.bgStyle.items.coloring.kind === 'color') {
      bgStyle.items.coloring.kind = 'color'
      bgStyle.items.coloring.color = data.bgStyle.items.coloring
    } else if (data.bgStyle.items.coloring.kind === 'gradient') {
      bgStyle.items.coloring.kind = 'gradient'
      bgStyle.items.coloring.gradient = data.bgStyle.items.coloring
    }

    // Restore Shape style options
    const shapeStyle = this.styleOptions.shape

    shapeStyle.items.dimSmallerItems = data.shapeStyle.items.dimSmallerItems
    shapeStyle.items.opacity = data.shapeStyle.items.opacity
    shapeStyle.items.placement = data.shapeStyle.items.placement
    shapeStyle.items.icons.iconList = data.shapeStyle.items.icons.iconList
    shapeStyle.items.words.customAngles = data.shapeStyle.items.words.angles
    shapeStyle.items.words.wordList = data.shapeStyle.items.words.wordList
    shapeStyle.items.words.fontIds = data.shapeStyle.items.words.fontIds
    shapeStyle.opacity = data.shapeStyle.opacity

    if (data.shapeStyle.items.coloring.kind === 'color') {
      shapeStyle.items.coloring.kind = 'color'
      shapeStyle.items.coloring.color = data.shapeStyle.items.coloring
    } else if (data.shapeStyle.items.coloring.kind === 'gradient') {
      shapeStyle.items.coloring.kind = 'gradient'
      shapeStyle.items.coloring.gradient = data.shapeStyle.items.coloring
    } else if (data.shapeStyle.items.coloring.kind === 'shape') {
      shapeStyle.items.coloring.kind = 'shape'
      shapeStyle.items.coloring.shape = data.shapeStyle.items.coloring
    }

    const deserializeItems = async ({
      items,
      words,
      fontIds,
    }: {
      items: PersistedItemV1[]
      words: PersistedWordV1[]
      fontIds: FontId[]
    }): Promise<EditorItemConfig[]> => {
      console.log('deserializeItems: ', { words, items, fontIds })

      // Fetch all required Fonts
      const fontsById = new Map<FontId, Font>()
      for (const fontId of fontIds) {
        const font = await this.fetchFontById(fontId)
        if (!font) {
          throw new Error(`no font ${fontId}`)
        }
        fontsById.set(fontId, { otFont: font, id: fontId, isCustom: false })
      }

      const wordsInfoMap = new Map<
        string,
        { fontId: FontId; text: string; wordConfigId?: WordConfigId }
      >()

      const result: EditorItemConfig[] = []
      for (const [index, item] of items.entries()) {
        if (item.k === 'w') {
          const word = words[item.wi]
          const fontId = fontIds[word.fontIndex]
          const fontEntry = fontsById.get(fontId)
          if (!fontEntry) {
            console.error(`No font entry for fontId ${fontId}`)
            continue
          }
          const wordInfoId = `${fontId}-${word.text}`
          if (!wordsInfoMap.has(wordInfoId)) {
            wordsInfoMap.set(wordInfoId, {
              text: word.text,
              fontId,
              wordConfigId: undefined,
            })
          }

          const { text, wordConfigId } = wordsInfoMap.get(wordInfoId)!
          const wordItem: EditorItemConfigWord = {
            index: index,
            color: item.c,
            customColor: item.cc,
            locked: item.l || false,
            shapeColor: item.sc,
            kind: 'word',
            transform: new paper.Matrix(item.t).prepend(
              new paper.Matrix().scale(scale, new paper.Point(0, 0))
            ),
            fontId,
            text,
            wordConfigId,
          }

          result.push(wordItem)
        }

        if (item.k === 's') {
          const shapeItem: EditorItemConfigShape = {
            index: index,
            color: item.c,
            customColor: item.cc,
            locked: item.l || false,
            shapeColor: item.sc,
            kind: 'shape',
            transform: new paper.Matrix(item.t).prepend(
              new paper.Matrix().scale(scale, new paper.Point(0, 0))
            ),
            shapeId: item.sId,
          }

          result.push(shapeItem)
        }
      }

      return result
    }

    const [shapeItems, bgItems] = await Promise.all([
      deserializeItems({
        items: data.shapeItems.items,
        fontIds: data.shapeItems.fontIds,
        words: data.shapeItems.words,
      }),
      deserializeItems({
        items: data.bgItems.items,
        fontIds: data.bgItems.fontIds,
        words: data.bgItems.words,
      }),
    ])
    this.editor.setShapeOpacity(shapeStyle.opacity)
    await this.editor.setShapeItems(shapeItems)
    await this.editor.setBgItems(bgItems)

    this.editor.setBgColor(mkBgStyleConfFromOptions(this.styleOptions.bg).fill)
    const shapeConf = this.getShapeConfById(this.selectedShapeId)!
    await this.editor.updateShapeColors(shapeConf)

    await this.editor.setShapeItemsStyle(
      mkShapeStyleConfFromOptions(this.styleOptions.shape).items
    )
    await this.editor.setBgItemsStyle(
      mkBgStyleConfFromOptions(this.styleOptions.bg).items
    )

    await this.updateShapeThumbnail()
    for (let i = 0; i < 10; ++i) {
      await waitAnimationFrame()
    }
  }

  updateShapeThumbnail = async () => {
    if (!this.editor || !this.editor.shape) {
      return
    }
    const currentShapeConf = this.getSelectedShapeConf()
    const shape = await cloneObj(this.editor.shape.obj)
    applyTransformToObj(shape, this.editor.shape.originalTransform)

    shape.set({ opacity: 1 })
    const canvas = objAsCanvasElement(shape)
    if (!currentShapeConf.thumbnailUrl) {
      currentShapeConf.thumbnailUrl = canvas.toDataURL()
    }
    currentShapeConf.processedThumbnailUrl = canvas.toDataURL()
  }

  serialize = (): EditorPersistedData => {
    this.logger.debug('serialize')
    if (!this.editor) {
      throw new Error('editor is not initialized')
    }

    const serializeMatrix = (
      t: paper.Matrix,
      precision = 3
    ): MatrixSerialized => [
      roundFloat(t.a, precision),
      roundFloat(t.b, precision),
      roundFloat(t.c, precision),
      roundFloat(t.d, precision),
      roundFloat(t.tx, precision),
      roundFloat(t.ty, precision),
    ]

    const serializeItems = (
      items: EditorItem[]
    ): {
      fontIds: FontId[]
      words: PersistedWordV1[]
      items: PersistedItemV1[]
    } => {
      const fontIds: FontId[] = uniq(
        items
          .map((item) => {
            if (item.kind !== 'word') {
              return null
            }
            return item.font.id
          })
          .filter(notEmpty)
      )

      const words: PersistedWordV1[] = items
        .map((item) => {
          if (item.kind !== 'word') {
            return null
          }
          const fontIndex = fontIds.findIndex((fId) => fId === item.font.id)
          return {
            fontIndex,
            text: item.customText || item.defaultText,
          }
        })
        .filter(notEmpty)
      const uniqWords: PersistedWordV1[] = uniqBy(
        words,
        (w) => `${w.fontIndex}.${w.text}`
      )

      return {
        fontIds,
        words: uniqWords,
        items: items
          .map((item, index) => {
            if (item.kind === 'word') {
              return {
                id: item.id,
                k: 'w',
                c: item.color,
                cc: item.customColor,
                t: serializeMatrix(item.transform),
                wcId: item.wordConfigId,
                sc: item.shapeColor,
                l: item.locked,
                wi: uniqWords.findIndex(
                  (uw) =>
                    uw.fontIndex === words[index].fontIndex &&
                    uw.text === words[index].text
                ),
              } as PersistedItemWordV1
            }
            if (item.kind === 'shape') {
              return {
                k: 's',
                id: item.id,
                t: serializeMatrix(item.transform),
                sId: item.shapeId,
                sc: item.shapeColor,
                l: item.locked,
                c: item.color,
                cc: item.customColor,
              } as PersistedItemShapeV1
            }

            return null
          })
          .filter(notEmpty),
      }
    }

    const serializeShape = (shape: Shape): PersistedShapeConfV1 => {
      const transform = getObjTransformMatrix(this.getShape()!.obj)

      if (shape.kind === 'raster') {
        if (shape.isCustom) {
          return {
            kind: 'custom-raster',
            transform,
            url: shape.url,
            processing: shape.config.processing || {},
          }
        } else {
          return {
            kind: 'raster',
            transform,
            shapeId: shape.id,
            processing: shape.config.processing || {},
          }
        }
      } else if (shape.kind === 'svg') {
        if (shape.isCustom) {
          return {
            kind: 'custom-svg',
            transform,
            url: shape.url,
            processing: shape.config.processing || {},
          }
        } else {
          return {
            kind: 'svg',
            transform,
            shapeId: shape.id,
            processing: shape.config.processing || {},
          }
        }
      } else if (shape.kind === 'text') {
        return {
          kind: 'custom-text',
          text: shape.config.text,
          textStyle: shape.config.textStyle,
          transform,
        }
      } else {
        exhaustiveCheck(shape)
      }
    }

    const serializeShapeItemsColoring = (
      coloring: ShapeStyleOptions['items']['coloring']
    ):
      | ItemsColoringColorConf
      | ItemsColoringGradientConf
      | ItemsColoringShapeConf => {
      if (coloring.kind === 'color') {
        return coloring.color
      }
      if (coloring.kind === 'gradient') {
        return coloring.gradient
      }
      if (coloring.kind === 'shape') {
        return coloring.shape
      }
      exhaustiveCheck(coloring.kind)
    }

    const serializeBgItemsColoring = (
      coloring: BgStyleOptions['items']['coloring']
    ): ItemsColoringColorConf | ItemsColoringGradientConf => {
      if (coloring.kind === 'color') {
        return coloring.color
      }
      if (coloring.kind === 'gradient') {
        return coloring.gradient
      }

      exhaustiveCheck(coloring.kind)
    }

    const serializeBgFill = (fill: BgStyleOptions['fill']): BgFill => {
      if (fill.kind === 'color') {
        return fill.color
      }
      if (fill.kind === 'transparent') {
        return { kind: 'transparent' }
      }
      exhaustiveCheck(fill.kind)
    }

    const serializedData: EditorPersistedData = {
      version: 1,
      data: {
        sceneSize: {
          w: roundFloat(this.editor.getSceneBounds(0).width, 3),
          h: roundFloat(this.editor.getSceneBounds(0).height, 3),
        },
        shapeStyle: {
          opacity: this.styleOptions.shape.opacity,
          items: {
            ...this.styleOptions.shape.items,
            coloring: serializeShapeItemsColoring(
              this.styleOptions.shape.items.coloring
            ),
            words: {
              angles:
                this.styleOptions.shape.items.words.anglesPreset === 'custom'
                  ? this.styleOptions.shape.items.words.customAngles
                  : getAnglesForPreset(
                      this.styleOptions.shape.items.words.anglesPreset
                    ),
              fontIds: this.styleOptions.shape.items.words.fontIds,
              wordList: this.styleOptions.shape.items.words.wordList,
            },
          },
        },
        bgStyle: {
          items: {
            ...this.styleOptions.bg.items,
            coloring: serializeBgItemsColoring(
              this.styleOptions.bg.items.coloring
            ),
            words: {
              angles:
                this.styleOptions.shape.items.words.anglesPreset === 'custom'
                  ? this.styleOptions.shape.items.words.customAngles
                  : getAnglesForPreset(
                      this.styleOptions.shape.items.words.anglesPreset
                    ),
              fontIds: this.styleOptions.shape.items.words.fontIds,
              wordList: this.styleOptions.shape.items.words.wordList,
            },
          },
          fill: serializeBgFill(this.styleOptions.bg.fill),
        },
        shape: serializeShape(this.getShape()!),
        bgItems: serializeItems(this.editor.getItemsSorted('bg')),
        shapeItems: serializeItems(this.editor.getItemsSorted('shape')),
      },
    }

    this.logger.debug('serialized: ', serializedData)

    return serializedData
  }

  @action destroyEditor = () => {
    this.logger.debug('destroyEditor')
    this.editor?.destroy()
    this.lifecycleState = 'destroyed'
    this.availableShapes = this.availableShapes.filter((s) => !s.isCustom)
    this.styleOptions.shape = cloneDeep(defaultShapeStyleOptions)
    this.styleOptions.bg = cloneDeep(defaultBgStyleOptions)
  }

  addCustomShapeImg = (shape: Omit<ShapeRasterConf, 'id'>) => {
    const id = this.customImgIdGen.get()

    this.availableShapes.push({
      ...shape,
      id,
    } as ShapeConf)

    return id
  }

  addCustomShapeText = (shape: Omit<ShapeTextConf, 'id'>) => {
    const id = this.customImgIdGen.get()
    this.availableShapes.push({
      ...shape,
      id,
    } as ShapeConf)
    return id
  }

  getAvailableShapes = (): ShapeConf[] =>
    sortBy(
      this.availableShapes,
      (s) => (s.isCustom ? -1 : 1),
      (s) => s.title
    )
  getShapeConfById = (shapeId: ShapeId): ShapeConf | undefined =>
    this.availableShapes.find((s) => s.id === shapeId)
  getShape = (): Shape | undefined => {
    const { selectedShapeId } = this
    return this.editor?.shape || undefined
  }
  getShapeConf = (): ShapeConf | undefined => this.getShape()?.config

  getAvailableFonts = (): { font: FontConfig; style: FontStyleConfig }[] => {
    const result: { font: FontConfig; style: FontStyleConfig }[] = []
    for (const font of fonts) {
      for (const style of font.styles) {
        result.push({ font, style })
      }
    }
    return result
  }
  getFontById = (
    fontId: FontId
  ): { font: FontConfig; style: FontStyleConfig } | undefined => {
    for (const font of fonts) {
      for (const style of font.styles) {
        if (style.fontId === fontId) {
          return { font, style }
        }
      }
    }
    return undefined
  }
  fetchFontById = (fontId: FontId) =>
    this.getFontById(fontId)
      ? loadFont(this.getFontById(fontId)!.style.url)
      : Promise.resolve(null)

  getSelectedShapeConf = () =>
    this.availableShapes.find((s) => s.id === this.selectedShapeId)!

  @action selectShape = async (shapeId: ShapeId, updateShapeColors = true) => {
    if (!this.editor) {
      return
    }

    const shapeConfig = this.getShapeConfById(shapeId)!

    await this.editor.setShape({
      shapeConfig,
      bgFillStyle: mkBgStyleConfFromOptions(this.styleOptions.bg).fill,
      shapeStyle: mkShapeStyleConfFromOptions(this.styleOptions.shape),
      clear: true,
      updateShapeColors,
    })

    if (this.editor.shape?.kind === 'svg') {
      if (!this.styleOptions.shape.colors.colorMaps.get(this.editor.shape.id)) {
        this.styleOptions.shape.colors.colorMaps.set(
          this.editor.shape.id,
          this.editor.shape.originalColors
        )
      }
    }

    this.selectedShapeId = shapeId

    this.updateShapeThumbnail()
  }

  updateShape = async () => {
    if (!this.editor) {
      return
    }

    const shape = this.getShapeConfById(this.selectedShapeId)!
    await this.editor.setShape({
      shapeConfig: shape,
      bgFillStyle: mkBgStyleConfFromOptions(this.styleOptions.bg).fill,
      shapeStyle: mkShapeStyleConfFromOptions(this.styleOptions.shape),
      clear: false,
    })
    if (this.styleOptions.shape.items.coloring.kind === 'shape') {
      await this.editor.setShapeItemsStyle(
        mkShapeStyleConfFromOptions(this.styleOptions.shape).items
      )
    }
  }

  @action deleteWord = (target: TargetKind, wordId: WordConfigId) => {
    const style = this.styleOptions[target]
    style.items.words.wordList = style.items.words.wordList.filter(
      (w) => w.id !== wordId
    )
  }

  @action clearWords = (target: TargetKind) => {
    const style = this.styleOptions[target]
    const ids = style.items.words.wordList.map((w) => w.id)
    this.wordIdGen.removeIds(ids)
    this.wordIdGen.resetLen()
    style.items.words.wordList = []
  }

  @action addWord = (target: TargetKind, text = '') => {
    const style = this.styleOptions[target]
    style.items.words.wordList.push({
      id: this.wordIdGen.get(),
      text,
    })
  }

  @action updateWord = (
    target: TargetKind,
    wordId: WordConfigId,
    update: Partial<Omit<WordListEntry, 'id'>>
  ) => {
    const style = this.styleOptions[target]
    const word = style.items.words.wordList.find((w) => w.id === wordId)
    if (!word) {
      throw new Error(`missing word, id = ${wordId}`)
    }
    set(word, update)
  }

  @action setPageSize = (pageSize: PageSize) => {
    this.pageSize = pageSize
    if (!this.editor) {
      return
    }
    const aspect =
      pageSize.kind === 'preset'
        ? pageSize.preset.aspect
        : pageSize.width / pageSize.height
    this.editor.setAspectRatio(aspect)
  }
}

export type WordConfigId = string

export type PageSize =
  | {
      kind: 'preset'
      preset: PageSizePreset
    }
  | {
      kind: 'custom'
      width: number
      height: number
    }

export type PageSizePreset = {
  id: string
  title: string
  aspect: number
}

export const pageSizePresets: PageSizePreset[] = [
  {
    id: 'square',
    title: 'Square',
    aspect: 1,
  },
  {
    id: '4:3',
    title: 'Landscape',
    aspect: 4 / 3,
  },
  {
    id: '3:4',
    title: 'Portrait',
    aspect: 3 / 4,
  },
]
