import { observable, action, set } from 'mobx'
import { RootStore } from 'root-store'
import { Editor, EditorInitParams } from 'components/pages/EditorPage/editor'
import { FontConfig, fonts, FontId, FontStyleConfig } from 'data/fonts'
import { shapes } from 'components/pages/EditorPage/icons'
import {
  ShapeConfig,
  ShapeId,
  defaultBackgroundStyle,
  defaultShapeStyle,
  WordStyleConfig,
} from 'components/pages/EditorPage/style'
import { consoleLoggers } from 'utils/console-logger'

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

  @action initEditor = (editorInitParams: EditorInitParams) => {
    this.logger.debug('initEditor', editorInitParams)

    this.editor = new Editor(editorInitParams)
    this.editor.setBgColor(this.styles.bg.fill)
    this.state = 'initialized'
    // @ts-ignore
    window['editor'] = this.editor

    this.selectShape(this.selectedShapeId)
  }

  @action destroyEditor = () => {
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
    this.selectedShapeId = shapeId
    const shape = this.getShapeById(shapeId)!
    await this.editor?.setShape({
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
