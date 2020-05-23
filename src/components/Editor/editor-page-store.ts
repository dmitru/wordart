import { shapes } from 'components/Editor/icons'
import {
  Editor,
  EditorInitParams,
  getItemsColoring,
  TargetKind,
} from 'components/Editor/lib/editor'
import { applyTransformToObj } from 'components/Editor/lib/fabric-utils'
import {
  Font,
  GeneratedItem,
  WordGeneratedItem,
} from 'components/Editor/lib/generator'
import {
  defaultBackgroundStyle,
  defaultShapeStyle,
  ShapeConfig,
  ShapeId,
  WordStyleConfig,
} from 'components/Editor/style'
import { FontConfig, FontId, fonts, FontStyleConfig } from 'data/fonts'
import { loadFont } from 'lib/wordart/fonts'
import { uniq, uniqBy } from 'lodash'
import { action, observable, set, toJS } from 'mobx'
import paper from 'paper'
import {
  EditorPersistedItemV1,
  EditorPersistedItemWordV1,
  EditorPersistedSymbolV1,
  EditorPersistedWordV1,
  MatrixSerialized,
} from 'services/api/persisted/v1'
import { EditorPersistedData } from 'services/api/types'
import { RootStore } from 'services/root-store'
import { consoleLoggers } from 'utils/console-logger'
import { notEmpty } from 'utils/not-empty'
import { roundFloat } from 'utils/round-float'
import { nanoid } from 'nanoid/non-secure'

export class EditorPageStore {
  logger = consoleLoggers.editorStore

  rootStore: RootStore
  editor: Editor | null = null

  private nextWordId =
    defaultBackgroundStyle.words.wordList.length +
    defaultShapeStyle.words.wordList.length

  @observable isVisualizing = false
  @observable visualizingProgress = null as number | null

  @observable state: 'initializing' | 'initialized' | 'destroyed' =
    'initializing'

  @observable styles = {
    bg: defaultBackgroundStyle,
    shape: defaultShapeStyle,
  }

  @observable availableShapes: ShapeConfig[] = shapes
  @observable selectedShapeId: ShapeId = shapes[4].id

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
  }

  @action initEditor = async (params: EditorInitParams) => {
    this.logger.debug('initEditor', params)

    this.editor = new Editor(params)
    this.editor.setBgColor(this.styles.bg.fill)
    // @ts-ignore
    window['editor'] = this.editor

    if (params.serialized) {
      await this.loadSerialized(params.serialized)
    } else {
      await this.selectShape(shapes[5].id)
    }

    this.state = 'initialized'
  }

  @action private loadSerialized = async (serialized: EditorPersistedData) => {
    this.logger.debug('loadSerialized', serialized)
    if (!this.editor) {
      throw new Error('editor is not initialized')
    }

    const { data } = serialized

    if (data.shape.shapeId != null) {
      await this.selectShape(data.shape.shapeId)

      const { shape, shapeOriginalColors } = this.editor.fabricObjects
      if (data.shape.transform && shape && shapeOriginalColors) {
        applyTransformToObj(shape, data.shape.transform)
        applyTransformToObj(shapeOriginalColors, data.shape.transform)
      }
    }

    const sceneSize = this.editor.getSceneBounds(0)
    const scale = sceneSize.width / serialized.data.sceneSize.w
    console.log('sceneSize', scale, sceneSize, serialized.data.sceneSize)

    this.styles.shape = data.shape.style
    this.styles.bg = data.bg.style

    const deserializeItems = async ({
      items,
      words,
      fontIds,
    }: {
      items: EditorPersistedItemV1[]
      words: EditorPersistedWordV1[]
      fontIds: FontId[]
    }): Promise<GeneratedItem[]> => {
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

      const result: GeneratedItem[] = []
      for (const item of items) {
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
          const wordItem: WordGeneratedItem = {
            id: item.id,
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
        items: data.shape.items,
        fontIds: data.shape.fontIds,
        words: data.shape.words,
      }),
      deserializeItems({
        items: data.bg.items,
        fontIds: data.bg.fontIds,
        words: data.bg.words,
      }),
    ])
    await this.editor.setShapeItems(shapeItems)
    await this.editor.setBgItems(bgItems)

    this.editor.setBgColor(this.styles.bg.fill)
    this.editor.setShapeFillColors(this.styles.shape.fill)
    this.editor.setItemsColor('bg', getItemsColoring(this.styles.bg))
    this.editor.setItemsColor('shape', getItemsColoring(this.styles.shape))
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
      items: GeneratedItem[]
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
            return item.fontId
          })
          .filter(notEmpty)
      )

      const words: EditorPersistedWordV1[] = items
        .map((item) => {
          if (item.kind !== 'word') {
            return null
          }
          const fontIndex = fontIds.findIndex((fId) => fId === item.fontId)
          return {
            fontIndex,
            text: item.text,
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
                k: 'w',
                id: item.id,
                t: serializeMatrix(item.transform),
                wcId: item.wordConfigId,
                sc: item.shapeColor,
                wi: uniqWords.findIndex(
                  (uw) =>
                    uw.fontIndex === words[index].fontIndex &&
                    uw.text === words[index].text
                ),
              } as EditorPersistedItemWordV1
            }
            if (item.kind === 'symbol') {
              return {
                k: 's',
                id: item.id,
                t: serializeMatrix(item.transform),
                sId: item.shapeId,
              } as EditorPersistedSymbolV1
            }

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
        sceneSize: {
          w: roundFloat(this.editor.getSceneBounds(0).width, 3),
          h: roundFloat(this.editor.getSceneBounds(0).height, 3),
        },
        bg: {
          style: toJS(this.styles.bg, { recurseEverything: true }),
          ...serializeItems(this.editor.generatedItems.bg.items),
        },
        shape: {
          transform: shapeTransform || null,
          shapeId: this.editor.currentShape?.shapeConfig.id || null,
          style: toJS(this.styles.shape, { recurseEverything: true }),
          ...serializeItems(this.editor.generatedItems.shape.items),
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

  getAvailableShapes = (): ShapeConfig[] => this.availableShapes
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
      shape: shape,
      bgColors: this.styles.bg.fill,
      shapeColors: this.styles.shape.fill,
    })
  }

  @action deleteWord = (target: TargetKind, wordId: WordConfigId) => {
    const style = this.styles[target]
    style.words.wordList = style.words.wordList.filter((w) => w.id !== wordId)
  }

  @action clearWords = (target: TargetKind) => {
    const style = this.styles[target]
    style.words.wordList = []
  }

  @action addEmptyWord = (target: TargetKind) => {
    const style = this.styles[target]
    style.words.wordList.push({
      id: this.getUniqWordId(target),
      text: '',
    })
  }

  getUniqWordId = (target: TargetKind) => {
    const style = this.styles[target]
    const wordIds = new Set(style.words.wordList.map((wl) => wl.id))
    let candidate = nanoid(6)
    while (wordIds.has(candidate)) {
      candidate = nanoid(6)
    }
    return candidate
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
}

export type WordConfigId = string
