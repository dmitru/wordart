import { observable, action, set, toJS } from 'mobx'
import { RootStore } from 'services/root-store'
import {
  Editor,
  EditorInitParams,
  getItemsColoring,
} from 'components/Editor/lib/editor'
import { FontConfig, fonts, FontId, FontStyleConfig } from 'data/fonts'
import { shapes } from 'components/Editor/icons'
import {
  ShapeConfig,
  ShapeId,
  defaultBackgroundStyle,
  defaultShapeStyle,
  WordStyleConfig,
} from 'components/Editor/style'
import { consoleLoggers } from 'utils/console-logger'
import { WordcloudEditorData } from 'services/api/types'

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
      this.selectShape(shapes[4].id)
    }

    this.state = 'initialized'
  }

  @action private loadSerialized = async (serialized: WordcloudEditorData) => {
    this.logger.debug('loadSerialized', serialized)
    if (!this.editor) {
      throw new Error('editor is not initialized')
    }

    const { data } = serialized

    if (data.shape.shapeId != null) {
      await this.selectShape(data.shape.shapeId)
    }

    this.styles.shape = data.shape.style
    this.styles.bg = data.bg.style

    this.editor.setBgColor(this.styles.bg.fill)
    this.editor.setShapeFillColors(this.styles.shape.fill)
    this.editor.setItemsColor('bg', getItemsColoring(this.styles.bg))
    this.editor.setItemsColor('shape', getItemsColoring(this.styles.shape))
  }

  serialize = (): WordcloudEditorData => {
    this.logger.debug('serialize')
    if (!this.editor) {
      throw new Error('editor is not initialized')
    }
    const serializedData: WordcloudEditorData = {
      version: 1,
      data: {
        bg: {
          style: toJS(this.styles.bg, { recurseEverything: true }),
        },
        shape: {
          shapeId: this.editor.currentShape?.shapeConfig.id || null,
          style: toJS(this.styles.shape, { recurseEverything: true }),
          items: this.editor.generatedItems.shape.items,
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

  @action deleteWord = (target: StyleKind, wordId: WordConfigId) => {
    const style = this.styles[target]
    style.words.wordList = style.words.wordList.filter((w) => w.id !== wordId)
  }

  @action clearWords = (target: StyleKind) => {
    const style = this.styles[target]
    style.words.wordList = []
  }

  @action addEmptyWord = (target: StyleKind) => {
    const style = this.styles[target]
    style.words.wordList.push({
      id: this.nextWordId,
      text: '',
    })
    this.nextWordId += 1
  }

  @action updateWord = (
    target: StyleKind,
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

export type WordConfigId = number

export type StyleKind = 'shape' | 'bg'
