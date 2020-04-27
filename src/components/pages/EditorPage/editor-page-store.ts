import { observable, action, set, runInAction } from 'mobx'
import { RootStore } from 'root-store'
import { without } from 'lodash'
import { Editor, EditorInitParams } from 'components/pages/EditorPage/editor'
import { sleep, waitAnimationFrame } from 'utils/async'
import { icons } from 'data/shapes'

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

  @observable bgColor = '#ffffff'
  @observable bgShapeColor = '#6C6C6C'
  // @observable itemsColor = '#ffffffff'
  @observable itemsColor = '#ffffffff'

  @observable availableShape: ShapeConfig[] = shapes
  @observable selectedShapeId: ShapeId = shapes[5].id

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
    if (shapeId === this.selectedShapeId) {
      return
    }
    if (this.editor) {
      runInAction(() => {
        this.selectedShapeId = shapeId
      })
      this.editor.updateBgShape()
      // if (true) {
      //   this.editor.shapes = undefined
      //   await this.editor.clearAndRenderBgShape()
      // }
      // await waitAnimationFrame()
      // await this.editor.generateAndRenderAll()
    } else {
      runInAction(() => {
        this.selectedShapeId = shapeId
      })
    }
  }

  @action deleteWord = (wordId: WordConfigId) => {
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
    wordId: WordConfigId,
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
  id: WordConfigId
  text: string
}

export type WordConfigId = number

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
  {
    id: 7,
    kind: 'svg',
    title: 'Yin Yang',
    url: '/images/yin-yang.svg',
    fill: 'green',
  },
  ...icons.slice(0, 100).map(
    (icon, index) =>
      ({
        id: 100 + index,
        kind: 'svg',
        title: icon.title,
        url: icon.url,
      } as ShapeConfig)
  ),
]
