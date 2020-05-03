import { observable, action, set, runInAction } from 'mobx'
import { RootStore } from 'root-store'
import { Editor, EditorInitParams } from 'components/pages/EditorPage/editor'
import { icons } from 'data/shapes'

type LeftPanelTab = 'shapes' | 'style:shape' | 'style:bg'

export type ShapeStyle = {
  bgColor: string

  itemsColorKind: 'color' | 'gradient'
  itemsColor: string
  itemsColorGradient: ItemsColorGradient
  dimSmallerItems: number

  words: WordConfig[]
  angles: number[]
  shapePadding: number
  itemPadding: number
  itemScaleMin: number
  itemScaleMax: number
  fitWithinShape: boolean
}

export type ItemsColorGradient = {
  from: string
  to: string
  assignBy: 'random' | 'size'
}

export type ItemsColoring = ItemsColoringSingleColor | ItemsColoringGradient

export type ItemsColoringSingleColor = {
  kind: 'single-color'
  color: string
  dimSmallerItems: number
}

export type ItemsColoringGradient = {
  kind: 'gradient'
  colorFrom: string
  colorTo: string
  assignColorBy: 'random' | 'size'
  dimSmallerItems: number
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

  @observable shapeStyle: ShapeStyle = {
    bgColor: '#f45b5c33',
    // bgColor: '#ffffff',
    itemsColorKind: 'color',
    itemsColor: '#970707',
    itemsColorGradient: {
      from: '#f45b5c',
      to: '#ffffaa',
      assignBy: 'random',
    },
    dimSmallerItems: 20,
    shapePadding: 5,
    itemPadding: 10,
    itemScaleMax: 2,
    itemScaleMin: 0.05,
    words: defaultWordsConfig,
    fitWithinShape: true,
    angles: [-15],
    // angles: range(-45, 45, 20),
  }
  @observable backgroundStyle: ShapeStyle = {
    itemsColorKind: 'gradient',
    itemsColor: '#bbb',
    itemsColorGradient: {
      from: '#bbb',
      to: '#333',
      assignBy: 'random',
    },
    bgColor: '#ffffff',
    shapePadding: 3,
    itemPadding: 2,
    itemScaleMax: 0.7,
    itemScaleMin: 0.002,
    dimSmallerItems: 50,
    words: defaultWordsConfig2,
    fitWithinShape: true,
    angles: [20],
  }

  getItemColoring = (type: 'shape' | 'background'): ItemsColoring => {
    const style = type === 'shape' ? this.shapeStyle : this.backgroundStyle
    if (style.itemsColorKind === 'color') {
      return {
        kind: 'single-color',
        color: style.itemsColor,
        dimSmallerItems: style.dimSmallerItems,
      }
    }
    return {
      kind: 'gradient',
      colorFrom: style.itemsColorGradient.from,
      colorTo: style.itemsColorGradient.to,
      assignColorBy: style.itemsColorGradient.assignBy,
      dimSmallerItems: style.dimSmallerItems,
    }
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
  'WORD',
  'art',
  'beautiful',
  'emotions',
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
