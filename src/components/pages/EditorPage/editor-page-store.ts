import { observable, action, set, runInAction } from 'mobx'
import { RootStore } from 'root-store'
import { without } from 'lodash'
import { Editor, EditorInitParams } from 'components/pages/EditorPage/editor'
import { sleep, waitAnimationFrame } from 'utils/async'

type LeftPanelTab = 'templates' | 'shapes' | 'words' | 'style'

export class EditorPageStore {
  rootStore: RootStore
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
  }

  editor: Editor | null = null
  @observable state: 'initializing' | 'initialized' | 'destroyed' =
    'initializing'

  @action initEditor = (editorInitParams: EditorInitParams) => {
    this.editor = new Editor(editorInitParams)
    this.state = 'initialized'
    // @ts-ignore
    window['editor'] = this.editor
  }

  @action destroyEditor = () => {
    this.editor?.destroy()
    this.state = 'destroyed'
  }

  @observable activeLeftTab: LeftPanelTab = 'shapes'

  @observable availableShape: ShapeConfig[] = shapes
  @observable selectedShapeId: ShapeId = shapes[1].id

  @observable private words: WordConfig[] = defaultWordsConfig
  private nextWordId = defaultWordsConfig.length + 1

  getAvailableShapes = (): ShapeConfig[] => shapes
  getWords = (): WordConfig[] => this.words

  getSelectedShape = () => {
    return this.availableShape.find((s) => s.id === this.selectedShapeId)!
  }

  @action setLeftPanelTab = (tabId: LeftPanelTab) => {
    this.activeLeftTab = tabId
  }

  @action selectShape = async (shapeId: ShapeId) => {
    if (this.editor) {
      if (shapeId !== this.selectedShapeId) {
        this.editor.shapes = undefined
        await this.editor.clearAndRenderBgShape()
      }
      runInAction(() => {
        this.selectedShapeId = shapeId
      })
      await waitAnimationFrame()
      await this.editor.generateAndRenderAll()
    } else {
      runInAction(() => {
        this.selectedShapeId = shapeId
      })
    }
  }

  @action deleteWord = (wordId: WordId) => {
    this.words = this.words.filter((w) => w.id !== wordId)
  }

  @action addEmptyWord = () => {
    this.words.push({
      id: this.nextWordId,
      text: '',
    })
    this.nextWordId += 1
  }

  @action updateWord = (
    wordId: WordId,
    update: Partial<Omit<WordConfig, 'id'>>
  ) => {
    const word = this.words.find((w) => w.id === wordId)
    if (!word) {
      throw new Error(`missing word, id = ${wordId}`)
    }
    set(word, update)
  }
}

export type WordConfig = {
  id: WordId
  text: string
}

export type WordId = number

const defaultWordsConfig: WordConfig[] = [
  {
    id: 1,
    text: 'Word',
  },
  {
    id: 2,
    text: 'Cloud',
  },
  {
    id: 3,
    text: 'Art',
  },
]

export type ShapeConfig = {
  id: ShapeId
  kind: ShapeKind
  url: string
  title: string
  fill?: string
}

export type ShapeKind = 'img' | 'svg'
export type ShapeId = number

const shapes: ShapeConfig[] = [
  {
    id: 1,
    kind: 'svg',
    title: 'Cloud',
    url: '/images/cloud.svg',
    fill: 'navy',
  },
  {
    id: 2,
    kind: 'img',
    title: 'Cat',
    url: '/images/cat.png',
  },
  {
    id: 3,
    kind: 'img',
    title: 'Beatles',
    url: '/images/beatles.jpg',
  },
  {
    id: 4,
    kind: 'img',
    title: 'Number Six',
    url: '/images/number_six.png',
  },
  {
    id: 5,
    kind: 'img',
    title: 'Darth Vader',
    url: '/images/darth_vader.jpg',
  },
  {
    id: 6,
    kind: 'svg',
    title: 'Flash',
    url: '/images/flash.svg',
    fill: 'red',
  },
]
