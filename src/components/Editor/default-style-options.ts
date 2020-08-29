import {
  BgStyleOptions,
  ShapeStyleOptions,
  WordListEntry,
} from 'components/Editor/style-options'
import { range } from 'lodash'
import chroma from 'chroma-js'

const defaultWordsList: WordListEntry[] = [
  'words',
  'art',
  'design',
  'amazing',
  'beautiful',
  'stunning',
  'creative',
].map(
  (s, index) =>
    ({
      id: `${index}`,
      text: s,
    } as WordListEntry)
)

export const defaultFontId = 'Amatic SC:700'

const defaultWordsListBackground: WordListEntry[] = [].map(
  (s, index) => ({ id: `${index}`, text: s } as WordListEntry)
)

const getRandomColor = () => chroma.random().luminance(0.3).saturate(0.6).hex()

/** Defines initial state of editor style options UI for the Shape */
export const defaultShapeStyleOptions: ShapeStyleOptions = {
  opacity: 20,
  items: {
    dimSmallerItems: 20,
    brightness: 0,
    opacity: 100,
    coloring: {
      kind: 'color',
      color: {
        kind: 'color',
        colors: range(4).map(() => getRandomColor()),
      },
      gradient: {
        kind: 'gradient',
        gradient: {
          assignBy: 'random',
          from: '#F92E2E',
          to: '#4763AE',
        },
      },
      shape: {
        kind: 'shape',
      },
    },

    words: {
      fontIds: [defaultFontId],
      wordList: defaultWordsList,
      anglesPreset: 'horizontal',
      customAngles: [0],
    },
    icons: {
      iconList: [],
    },
    placement: {
      iconsRandomAngle: false,
      itemsMaxCount: 300,
      iconsMaxSize: 30,
      iconsProportion: 30,
      shapePadding: 15,
      itemDensity: 85,
      wordsMaxSize: 90,
    },
  },
}

/** Defines initial state of editor style options UI for the Background */
export const defaultBgStyleOptions: BgStyleOptions = {
  fill: {
    color: {
      opacity: 100,
      kind: 'color',
      color: 'white',
    },
    kind: 'color',
  },
  items: {
    dimSmallerItems: 65,
    brightness: 0,
    opacity: 20,
    coloring: {
      kind: 'color',
      color: {
        kind: 'color',
        colors: ['#1C1C32'],
      },
      gradient: {
        kind: 'gradient',
        gradient: {
          assignBy: 'random',
          from: 'red',
          to: 'blue',
        },
      },
    },

    words: {
      fontIds: [],
      wordList: defaultWordsListBackground,
      anglesPreset: 'horizontal',
      customAngles: [0],
    },
    icons: {
      iconList: [],
    },
    placement: {
      margins: 10,
      iconsRandomAngle: false,
      iconsMaxSize: 30,
      itemsMaxCount: 300,
      iconsProportion: 30,
      shapePadding: 15,
      itemDensity: 55,
      wordsMaxSize: 70,
    },
  },
}
