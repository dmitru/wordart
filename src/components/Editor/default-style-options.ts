import { fonts } from 'data/fonts'
import {
  WordListEntry,
  ShapeStyleOptions,
  BgStyleOptions,
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

const defaultWordsListBackground: WordListEntry[] = ['back'].map(
  (s, index) => ({ id: `${index}`, text: s } as WordListEntry)
)

/** Defines initial state of editor style options UI for the Shape */
export const defaultShapeStyleOptions: ShapeStyleOptions = {
  opacity: 0.4,
  colors: {
    color: 'red',
    colorMaps: new Map(),
  },
  items: {
    dimSmallerItems: 20,
    opacity: 100,
    coloring: {
      kind: 'gradient',
      color: {
        kind: 'color',
        color: 'black',
      },
      gradient: {
        kind: 'gradient',
        gradient: {
          assignBy: 'random',
          from: 'red',
          to: 'blue',
        },
      },
      shape: {
        kind: 'shape',
        shapeBrightness: 20,
      },
    },

    words: {
      fontIds: [fonts[3].styles[0].fontId, fonts[2].styles[0].fontId],
      wordList: defaultWordsList,
      anglesPreset: 'horizontal',
      customAngles: [],
    },
    icons: {
      iconList: [],
    },
    placement: {
      iconsMaxSize: 30,
      iconsProportion: 20,
      shapePadding: 15,
      itemDensity: 95,
      wordsMaxSize: 70,
    },
  },
}

/** Defines initial state of editor style options UI for the Background */
export const defaultBgStyleOptions: BgStyleOptions = {
  fill: {
    color: {
      kind: 'color',
      color: 'white',
    },
    kind: 'color',
  },
  items: {
    dimSmallerItems: 20,
    opacity: 100,
    coloring: {
      kind: 'color',
      color: {
        kind: 'color',
        color: 'lime',
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
      fontIds: [fonts[3].styles[0].fontId, fonts[2].styles[0].fontId],
      wordList: defaultWordsListBackground,
      anglesPreset: 'horizontal',
      customAngles: [],
    },
    icons: {
      iconList: [],
    },
    placement: {
      margins: 10,
      iconsMaxSize: 30,
      iconsProportion: 20,
      shapePadding: 15,
      itemDensity: 95,
      wordsMaxSize: 70,
    },
  },
}
