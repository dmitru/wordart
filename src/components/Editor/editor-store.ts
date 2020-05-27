import { shapes } from 'components/Editor/icons'
import {
  Editor,
  EditorInitParams,
  getItemsColoring,
  TargetKind,
  EditorItemId,
  EditorItem,
  EditorItemConfig,
  EditorItemConfigWord,
} from 'components/Editor/lib/editor'
import { applyTransformToObj } from 'components/Editor/lib/fabric-utils'
import { Font } from 'components/Editor/lib/generator'
import {
  defaultBackgroundStyle,
  defaultShapeStyle,
  ShapeConfig,
  ShapeId,
  WordStyleConfig,
  ShapeConfigImg,
} from 'components/Editor/style'
import { FontConfig, FontId, fonts, FontStyleConfig } from 'data/fonts'
import { loadFont } from 'lib/wordart/fonts'
import { uniq, uniqBy, sortBy } from 'lodash'
import { action, observable, set, toJS } from 'mobx'
import paper from 'paper'
import {
  EditorPersistedItemV1,
  EditorPersistedItemWordV1,
  EditorPersistedWordV1,
  MatrixSerialized,
} from 'services/api/persisted/v1'
import { EditorPersistedData } from 'services/api/types'
import { RootStore } from 'services/root-store'
import { consoleLoggers } from 'utils/console-logger'
import { notEmpty } from 'utils/not-empty'
import { roundFloat } from 'utils/round-float'
import { nanoid } from 'nanoid/non-secure'
import { UninqIdGenerator as UniqIdGenerator } from 'utils/ids'
import {
  loadImageUrlToCanvasCtx,
  loadImageUrlToCanvasCtxWithMaxSize,
  removeLightPixels,
  invertImageMask,
  processImg,
} from 'lib/wordart/canvas-utils'

export type EditorMode = 'view' | 'edit items'

export type EditorStoreInitParams = Pick<
  EditorInitParams,
  'aspectRatio' | 'canvas' | 'canvasWrapperEl' | 'serialized'
>

export class EditorStore {
  logger = consoleLoggers.editorStore

  rootStore: RootStore
  editor: Editor | null = null

  @observable isVisualizing = false
  @observable visualizingProgress = null as number | null

  // TODO
  @observable mode: EditorMode = 'view'

  @observable state: 'initializing' | 'initialized' | 'destroyed' =
    'initializing'

  @observable styles = {
    bg: defaultBackgroundStyle,
    shape: defaultShapeStyle,
  }

  @observable pageSize: PageSize = {
    kind: 'preset',
    preset: pageSizePresets[1],
  }

  @observable hasItemChanges = false
  @observable availableShapes: ShapeConfig[] = shapes
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
          customText: item.customText,
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
          customText: item.customText,
        }
      },
    })
    this.editor.setBgColor(this.styles.bg.fill)
    // @ts-ignore
    window['editor'] = this.editor

    if (params.serialized) {
      await this.loadSerialized(params.serialized)
    } else {
      await this.selectShape(shapes[5].id)
    }

    this.enterViewMode()

    this.state = 'initialized'
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

  @action enterEditItemsMode = () => {
    this.mode = 'edit items'
    if (!this.editor) {
      return
    }
    this.editor.showLockBorders()
    this.editor.enableItemsSelection()
    this.editor.enableSelectionMode()
  }

  @action enterViewMode = () => {
    this.mode = 'view'
    if (!this.editor) {
      return
    }
    this.selectedItemData = null
    this.selectedItem = null
    this.editor.hideLockBorders()
    this.editor.disableItemsSelection()
    this.editor.disableSelectionMode()
  }

  @action private loadSerialized = async (serialized: EditorPersistedData) => {
    this.logger.debug('loadSerialized', serialized)
    if (!this.editor) {
      throw new Error('editor is not initialized')
    }

    const { data } = serialized
    this.editor.setAspectRatio(
      serialized.data.editor.sceneSize.w / serialized.data.editor.sceneSize.h
    )

    if (data.editor.shape.kind === 'custom' && data.editor.shape.custom) {
      const customImgId = this.addCustomShapeImg({
        kind: 'img',
        title: 'Custom',
        url: data.editor.shape.custom.url,
        isCustom: true,
        thumbnailUrl: undefined,
        processing: data.editor.shape.custom.processing,
      })
      await this.selectShape(customImgId)
    } else if (
      data.editor.shape.kind === 'builtin' &&
      data.editor.shape.shapeId != null
    ) {
      await this.selectShape(data.editor.shape.shapeId)
    }

    this.updateShapeThumbnail()

    const { shape, shapeOriginalColors } = this.editor.fabricObjects
    if (data.editor.shape.transform && shape && shapeOriginalColors) {
      applyTransformToObj(shape, data.editor.shape.transform)
      applyTransformToObj(shapeOriginalColors, data.editor.shape.transform)
    }

    const sceneSize = this.editor.getSceneBounds(0)
    const scale = sceneSize.width / serialized.data.editor.sceneSize.w

    this.styles.shape = data.editor.shape.style
    this.styles.bg = data.editor.bg.style

    const deserializeItems = async ({
      items,
      words,
      fontIds,
    }: {
      items: EditorPersistedItemV1[]
      words: EditorPersistedWordV1[]
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
        // TODO
      }

      return result
    }

    const [shapeItems, bgItems] = await Promise.all([
      deserializeItems({
        items: data.generated.shape.items,
        fontIds: data.generated.shape.fontIds,
        words: data.generated.shape.words,
      }),
      deserializeItems({
        items: data.generated.bg.items,
        fontIds: data.generated.bg.fontIds,
        words: data.generated.bg.words,
      }),
    ])
    await this.editor.setShapeItems(shapeItems)
    await this.editor.setBgItems(bgItems)

    this.editor.setBgColor(this.styles.bg.fill)
    await this.editor.setShapeFillColors(this.styles.shape.fill)
    await this.editor.setItemsColor('bg', getItemsColoring(this.styles.bg))
    await this.editor.setItemsColor(
      'shape',
      getItemsColoring(this.styles.shape)
    )
  }

  updateShapeThumbnail = async () => {
    if (!this.editor) {
      return
    }
    const currentShapeConfig = this.getSelectedShape()
    const shape = await new Promise<fabric.Object>((r) =>
      this.editor!.fabricObjects.shape!.clone((copy: fabric.Object) => r(copy))
    )
    shape.set({ opacity: 1 })
    const canvas = (shape.toCanvasElement() as any) as HTMLCanvasElement
    currentShapeConfig.thumbnailUrl = canvas.toDataURL()
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
      words: EditorPersistedWordV1[]
      items: EditorPersistedItemV1[]
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

      const words: EditorPersistedWordV1[] = items
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
      const uniqWords: EditorPersistedWordV1[] = uniqBy(
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
              } as EditorPersistedItemWordV1
            }
            // if (item.kind === 'symbol') {
            //   return {
            //     k: 's',
            //     id: item.index,
            //     t: serializeMatrix(item.transform),
            //     sId: item.shapeId,
            //   } as EditorPersistedSymbolV1
            // }

            return null
          })
          .filter(notEmpty),
      }
    }

    const shapeTransform = (
      this.editor.fabricObjects.shape?.calcTransformMatrix() || []
    ).map((n: number) => roundFloat(n, 3)) as MatrixSerialized

    const serializedData: EditorPersistedData = {
      version: 1,
      data: {
        editor: {
          sceneSize: {
            w: roundFloat(this.editor.getSceneBounds(0).width, 3),
            h: roundFloat(this.editor.getSceneBounds(0).height, 3),
          },
          bg: {
            style: toJS(this.styles.bg, { recurseEverything: true }),
          },
          shape: {
            transform: shapeTransform || null,
            shapeId: this.editor.currentShapeInfo?.shapeConfig.id || null,
            style: toJS(this.styles.shape, { recurseEverything: true }),
            kind: this.editor.currentShapeInfo?.shapeConfig
              ? this.editor.currentShapeInfo.shapeConfig.isCustom
                ? 'custom'
                : 'builtin'
              : 'empty',
            custom: this.editor.currentShapeInfo?.shapeConfig.isCustom
              ? {
                  url: this.editor.currentShapeInfo.shapeConfig.url,
                  processing: this.editor.currentShapeInfo.shapeConfig
                    .processing,
                }
              : null,
          },
        },
        generated: {
          bg: serializeItems(this.editor.getItemsSorted('bg')),
          shape: serializeItems(this.editor.getItemsSorted('shape')),
        },
      },
    }

    this.logger.debug('serialized: ', serializedData)

    return serializedData
  }

  @action destroyEditor = () => {
    this.logger.debug('destroyEditor')
    this.editor?.destroy()
    this.state = 'destroyed'
  }

  addCustomShapeImg = (shape: Omit<ShapeConfigImg, 'id'>) => {
    const id = this.customImgIdGen.get()
    this.availableShapes.push({
      ...shape,
      id,
    } as ShapeConfig)
    return id
  }

  getAvailableShapes = (): ShapeConfig[] =>
    sortBy(
      this.availableShapes,
      (s) => (s.isCustom ? -1 : 1),
      (s) => s.title
    )
  getShapeById = (shapeId: ShapeId): ShapeConfig | undefined =>
    this.availableShapes.find((s) => s.id === shapeId)

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

  getSelectedShape = () =>
    this.availableShapes.find((s) => s.id === this.selectedShapeId)!

  @action selectShape = async (shapeId: ShapeId) => {
    if (!this.editor) {
      return
    }

    this.selectedShapeId = shapeId
    const shape = this.getShapeById(shapeId)!

    await this.editor.setShape({
      shapeConfig: shape,
      bgColors: this.styles.bg.fill,
      shapeColors: this.styles.shape.fill,
      clear: true,
    })
  }

  updateShape = async () => {
    if (!this.editor) {
      return
    }

    const shape = this.getShapeById(this.selectedShapeId)!
    await this.editor.setShape({
      shapeConfig: shape,
      bgColors: this.styles.bg.fill,
      shapeColors: this.styles.shape.fill,
      clear: false,
    })
    if (this.styles.shape.itemsColoring.kind === 'shape') {
      await this.editor.setItemsColor(
        'shape',
        getItemsColoring(this.styles.shape)
      )
    }
  }

  @action deleteWord = (target: TargetKind, wordId: WordConfigId) => {
    const style = this.styles[target]
    style.words.wordList = style.words.wordList.filter((w) => w.id !== wordId)
  }

  @action clearWords = (target: TargetKind) => {
    const style = this.styles[target]
    const ids = style.words.wordList.map((w) => w.id)
    this.wordIdGen.removeIds(ids)
    this.wordIdGen.resetLen()
    style.words.wordList = []
  }

  @action addWord = (target: TargetKind, text = '') => {
    const style = this.styles[target]
    style.words.wordList.push({
      id: this.wordIdGen.get(),
      text,
    })
  }

  @action updateWord = (
    target: TargetKind,
    wordId: WordConfigId,
    update: Partial<Omit<WordStyleConfig, 'id'>>
  ) => {
    const style = this.styles[target]
    const word = style.words.wordList.find((w) => w.id === wordId)
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
