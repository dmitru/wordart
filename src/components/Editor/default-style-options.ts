import {
  BgStyleOptions,
  ShapeStyleOptions,
  WordListEntry,
} from 'components/Editor/style-options'

const defaultWordsList: WordListEntry[] = [
  'cloud',
  'art',
  'amazing',
  'beautiful',
  'drawing',
  'wow',
  'impress',
  'stunning',
  'creative',
].map(
  (s, index) =>
    ({
      id: `${index}`,
      text: s,
    } as WordListEntry)
)

export const defaultFontId = 'Roboto:700'

const defaultWordsListBackground: WordListEntry[] = [].map(
  (s, index) => ({ id: `${index}`, text: s } as WordListEntry)
)

/** Defines initial state of editor style options UI for the Shape */
export const defaultShapeStyleOptions: ShapeStyleOptions = {
  opacity: 10,
  items: {
    dimSmallerItems: 20,
    brightness: 0,
    opacity: 100,
    coloring: {
      kind: 'shape',
      color: {
        kind: 'color',
        colors: '#54bfa5 #222 #d6125c #38b3f6 #e9c028 #545006 #3da4de #4c0e27'.split(
          ' '
        ),
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
      itemDensity: 85,
      wordsMaxSize: 70,
    },
  },
}
