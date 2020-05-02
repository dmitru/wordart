import { observable, action, set, runInAction } from 'mobx'
import { RootStore } from 'root-store'
import { Editor, EditorInitParams } from 'components/pages/EditorPage/editor'
import { icons } from 'data/shapes'
import { Font } from 'components/pages/EditorPage/generator'
import { range } from 'lodash'

type LeftPanelTab = 'templates' | 'shapes' | 'words' | 'style'

export type ShapeStyle = {
  bgColor: string
  itemsColor: string
  words: WordConfig[]
  angles: number[]
}

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

    this.selectShape(this.selectedShapeId)
  }

  @action destroyEditor = () => {
    this.editor?.destroy()
    this.state = 'destroyed'
  }

  @observable activeLeftTab: LeftPanelTab = 'shapes'

  @observable activeStyleTab: 'shape' | 'background' = 'shape'

  @observable shapeStyle: ShapeStyle = {
    bgColor: '#f45b5c33',
    itemsColor: '#f45b5c',
    words: defaultWordsConfig,
    angles: [-15],
    // angles: range(-45, 45, 20),
  }
  @observable backgroundStyle: ShapeStyle = {
    itemsColor: '#bbb',
    bgColor: '#ffffff',
    words: defaultWordsConfig2,
    angles: [20],
  }

  @observable availableShapes: ShapeConfig[] = shapes
  @observable selectedShapeId: ShapeId = shapes[5].id

  private nextWordId = defaultWordsConfig.length + 1

  getAvailableShapes = (): ShapeConfig[] => shapes

  getSelectedShape = () => {
    return this.availableShapes.find((s) => s.id === this.selectedShapeId)!
  }

  @action setLeftPanelTab = (tabId: LeftPanelTab) => {
    this.activeLeftTab = tabId
  }

  @action setActiveStyleTab = (tabId: 'shape' | 'background') => {
    this.activeStyleTab = tabId
  }

  @action selectShape = async (shapeId: ShapeId) => {
    if (this.editor) {
      runInAction(() => {
        this.selectedShapeId = shapeId
      })
      this.editor.updateBgShape()
    } else {
      runInAction(() => {
        this.selectedShapeId = shapeId
      })
    }
  }

  @action deleteWord = (type: 'shape' | 'background', wordId: WordConfigId) => {
    const style = type === 'shape' ? this.shapeStyle : this.backgroundStyle
    style.words = style.words.filter((w) => w.id !== wordId)
  }

  @action addEmptyWord = (type: 'shape' | 'background') => {
    const style = type === 'shape' ? this.shapeStyle : this.backgroundStyle
    style.words.push({
      id: this.nextWordId,
      text: '',
    })
    this.nextWordId += 1
  }

  @action updateWord = (
    type: 'shape' | 'background',
    wordId: WordConfigId,
    update: Partial<Omit<WordConfig, 'id'>>
  ) => {
    const style = type === 'shape' ? this.shapeStyle : this.backgroundStyle
    const word = style.words.find((w) => w.id === wordId)
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
  'word',
  'cloud',
  'art',
  'amazing',
  'beautiful',
  'drawing',
  'wow',
  'impress',
  'stunning',
  'creative',
].map((s, index) => ({ id: index, text: s } as WordConfig))

const defaultWordsConfig2: WordConfig[] = [
  'vertical',
  'background',
  'wall',
  'art',
].map((s, index) => ({ id: index, text: s } as WordConfig))

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
