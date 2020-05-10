import { observable, action, set, runInAction } from 'mobx'
import { RootStore } from 'root-store'
import {
  Editor,
  EditorInitParams,
  SvgShapeColorsMap,
} from 'components/pages/EditorPage/editor'
import { icons } from 'data/shapes'
import { iconsFaRegular } from 'data/shapes-fa-regular'
import { FontConfig, fonts, FontId, FontStyleConfig } from 'data/fonts'

type LeftPanelTab = 'shapes' | 'words' | 'symbols' | 'colors' | 'layout'

export type ShapeStyle = {
  bgColors: string[]
  bgOpacity: number

  itemsColorKind: 'color' | 'gradient' | 'shape'
  itemsColor: string
  itemsColorGradient: ItemsColorGradient
  dimSmallerItems: number

  words: WordConfig[]
  wordFonts: FontId[]
  icons: IconConfig[]
  angles: number[]
  shapePadding: number
  /** Number: 0 - 100% */
  itemDensity: number
  /** Number: 0 - 100% */
  wordsMaxSize: number
  /** Number: 0 - 100% */
  iconsMaxSize: number
  /** Number: 0 - 100% */
  iconsProportion: number
  fitWithinShape: boolean
}

export type ItemsColorGradient = {
  from: string
  to: string
  assignBy: 'random' | 'size'
}

export type ItemsColoring =
  | ItemsColoringShapeColor
  | ItemsColoringSingleColor
  | ItemsColoringGradient

export type ItemsColoringShapeColor = {
  kind: 'shape'
  dimSmallerItems: number
}

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

  @observable isVisualizing = false

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
    bgColors: ['#576DC7'],
    bgOpacity: 0.1,
    iconsMaxSize: 30,
    iconsProportion: 20,
    // bgColor: '#ffffff',
    itemsColorKind: 'shape',
    itemsColor: '#970707',
    itemsColorGradient: {
      from: '#f45b5c',
      to: '#2540BF',
      assignBy: 'random',
    },
    dimSmallerItems: 20,
    shapePadding: 15,
    itemDensity: 95,
    wordsMaxSize: 70,
    wordFonts: [fonts[3].styles[0].fontId, fonts[2].styles[0].fontId],
    words: defaultWordsConfig,
    icons: [],
    // icons: range(10).map(() => ({ shapeId: sample(svgIconsOutline)!.id })),
    fitWithinShape: true,
    angles: [0],
    // angles: [-15, 20, 34, -76, 84, -65, 81],
  }
  @observable backgroundStyle: ShapeStyle = {
    itemsColorKind: 'gradient',
    itemsColor: '#bbb',
    itemsColorGradient: {
      from: '#bbb',
      to: '#333',
      assignBy: 'random',
    },
    iconsMaxSize: 30,
    iconsProportion: 20,
    bgColors: ['#ffffff'],
    bgOpacity: 1,
    shapePadding: 3,
    itemDensity: 20,
    wordFonts: [fonts[0].styles[0].fontId],
    wordsMaxSize: 70,
    dimSmallerItems: 50,
    words: defaultWordsConfig2,
    icons: [],
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
    } else if (style.itemsColorKind === 'gradient') {
      return {
        kind: 'gradient',
        colorFrom: style.itemsColorGradient.from,
        colorTo: style.itemsColorGradient.to,
        assignColorBy: style.itemsColorGradient.assignBy,
        dimSmallerItems: style.dimSmallerItems,
      }
    }
    return {
      kind: 'shape',
      dimSmallerItems: style.dimSmallerItems,
    }
  }

  @observable availableShapes: ShapeConfig[] = shapes
  @observable selectedShapeId: ShapeId = shapes[4].id
  @observable shapeColorsMap: SvgShapeColorsMap | null = null

  private nextWordId = defaultWordsConfig.length + 1

  getAvailableShapes = (): ShapeConfig[] => shapes
  getShapeById = (shapeId: ShapeId): ShapeConfig | undefined =>
    shapes.find((s) => s.id === shapeId)

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

  getSelectedShape = () => {
    return this.availableShapes.find((s) => s.id === this.selectedShapeId)!
  }

  @action setLeftPanelTab = (tabId: LeftPanelTab) => {
    this.activeLeftTab = tabId
  }

  @action selectShape = async (shapeId: ShapeId) => {
    if (this.editor) {
      this.selectedShapeId = shapeId
      const shapeInfo = await this.editor.setBgShape(shapeId)
      this.shapeColorsMap = shapeInfo.colorsMap || null
      if (shapeInfo.colorsMap) {
        this.shapeStyle.bgColors = shapeInfo.colorsMap.colors.map(
          (cm) => cm.originalColor
        )
      }
    } else {
      this.selectedShapeId = shapeId
    }
  }

  @action deleteWord = (type: 'shape' | 'background', wordId: WordConfigId) => {
    const style = type === 'shape' ? this.shapeStyle : this.backgroundStyle
    style.words = style.words.filter((w) => w.id !== wordId)
  }

  @action clearWords = (type: 'shape' | 'background') => {
    const style = type === 'shape' ? this.shapeStyle : this.backgroundStyle
    style.words = []
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

export type IconConfig = {
  shapeId: ShapeId
}

export type WordConfigId = number

const defaultWordsConfig: WordConfig[] = [
  // 'O',
  // '8',
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
  keepSvgColors?: boolean
  url: string
  title: string
  fill?: string
}

export type ShapeKind = 'img' | 'svg'
export type ShapeId = number

const svgIcons: ShapeConfig[] = [
  icons.find((i) => i.title === 'Square full'),
  ...icons.slice(0, 100),
]
  .filter((i) => i != null)
  .map((icon, index) =>
    icon
      ? ({
          id: 100 + index,
          kind: 'svg',
          title: icon.title,
          url: icon.url,
        } as ShapeConfig)
      : null
  )
  .filter((x) => x != null) as ShapeConfig[]

const svgIconsOutline: ShapeConfig[] = [...iconsFaRegular.slice(0, 200)]
  .filter((i) => i != null)
  .map((icon, index) =>
    icon
      ? ({
          id: 1000 + index,
          kind: 'svg',
          title: icon.title,
          url: icon.url,
        } as ShapeConfig)
      : null
  )
  .filter((x) => x != null) as ShapeConfig[]

const shapes: ShapeConfig[] = [
  {
    id: 1,
    kind: 'svg',
    title: 'Cat',
    url: '/images/cat.svg',
    keepSvgColors: true,
  },
  {
    id: -1,
    kind: 'svg',
    title: 'Apple',
    url: '/images/apple.svg',
    keepSvgColors: true,
  },
  {
    id: -2,
    kind: 'svg',
    title: 'Bear Face',
    url: '/images/bear-face.svg',
    keepSvgColors: true,
  },
  {
    id: -3,
    kind: 'svg',
    title: 'Bear Side',
    url: '/images/bear-side.svg',
    keepSvgColors: true,
  },
  {
    id: -4,
    kind: 'svg',
    title: 'Bear Belly',
    url: '/images/bear-belly.svg',
    keepSvgColors: true,
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
  {
    id: 7,
    kind: 'svg',
    title: 'Yin Yang',
    url: '/images/yin-yang.svg',
    fill: 'green',
  },
  ...svgIcons,
  ...svgIconsOutline,
]
