import { fonts, FontId } from 'data/fonts'
import { WordConfigId } from 'components/Editor/editor-page-store'

const defaultWordsList: WordStyleConfig[] = [
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
].map((s, index) => ({ id: index, text: s } as WordStyleConfig))

const defaultWordsListBackground: WordStyleConfig[] = ['back'].map(
  (s, index) => ({ id: index, text: s } as WordStyleConfig)
)

export const defaultShapeStyle: ShapeStyleConfig = {
  fill: {
    kind: 'color-map',
    color: '#576DC7',
    colorMap: ['#576DC7'],
    defaultColorMap: ['#576DC7'],
    opacity: 0.4,
  },

  layout: {
    iconsMaxSize: 30,
    iconsProportion: 20,
    fitWithinShape: true,
    shapePadding: 15,
    itemDensity: 95,
    wordsMaxSize: 70,
  },

  processing: {
    edges: {
      enabled: true,
      amount: 80,
    },
    invert: {
      enabled: false,
      color: 'red',
    },
  },

  itemsColoring: {
    kind: 'shape',
    color: '#970707',
    gradient: {
      from: '#f45b5c',
      to: '#2540BF',
      assignBy: 'random',
    },
    dimSmallerItems: 20,
  },

  words: {
    fonts: [fonts[3].styles[0].fontId, fonts[2].styles[0].fontId],
    wordList: defaultWordsList,
    angles: {
      preset: 'horizontal',
      angles: [0],
    },
  },
  icons: {
    iconList: [],
  },
}

export const defaultBackgroundStyle: BackgroundStyleConfig = {
  fill: {
    kind: 'color',
    color: '#ffffff',
  },

  layout: {
    iconsMaxSize: 30,
    iconsProportion: 20,
    fitWithinShape: true,
    shapePadding: 15,
    itemDensity: 95,
    wordsMaxSize: 70,
  },

  itemsColoring: {
    kind: 'color',
    color: '#97c712',
    gradient: {
      from: '#f4cb9c',
      to: '#25a0BF',
      assignBy: 'random',
    },
    dimSmallerItems: 20,
  },

  words: {
    fonts: [fonts[0].styles[0].fontId],
    wordList: defaultWordsListBackground,
    angles: {
      preset: 'horizontal',
      angles: [60],
    },
  },
  icons: {
    iconList: [],
  },
}

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
export type IconId = number

/** Describes UI state for background style  */
export type BackgroundStyleConfig = {
  fill: {
    kind: 'color' | 'transparent'
    color: ColorString
  }

  itemsColoring: {
    kind: 'color' | 'gradient' | 'shape'
    color: ColorString
    gradient: ItemsColorGradient
    dimSmallerItems: number
  }

  words: {
    wordList: WordStyleConfig[]
    fonts: FontId[]
    angles: {
      preset: WordAnglesPresetKind
      angles: number[]
    }
  }

  icons: {
    iconList: IconStyleConfig[]
  }

  layout: {
    fitWithinShape: boolean
    /** Number: 0 - 100% */
    shapePadding: number
    /** Number: 0 - 100% */
    itemDensity: number
    /** Number: 0 - 100% */
    wordsMaxSize: number
    /** Number: 0 - 100% */
    iconsMaxSize: number
    /** Number: 0 - 100% */
    iconsProportion: number
  }
}

/** Describes UI state for shape style  */
export type ShapeStyleConfig = {
  processing: {
    edges: {
      enabled: boolean
      /* edge detection intensity, 0-100% */
      amount: number
    }
    invert: {
      enabled: boolean
      /* edge detection intensity, 0-100% */
      color: string
    }
  }

  fill: {
    kind: 'color-map' | 'single-color'
    colorMap: string[]
    defaultColorMap: string[]
    color: ColorString
    opacity: number
  }

  itemsColoring: {
    kind: 'color' | 'gradient' | 'shape'
    color: ColorString
    gradient: ItemsColorGradient
    dimSmallerItems: number
  }

  words: {
    wordList: WordStyleConfig[]
    fonts: FontId[]
    angles: {
      preset: WordAnglesPresetKind
      angles: number[]
    }
  }

  icons: {
    iconList: IconStyleConfig[]
  }

  layout: {
    fitWithinShape: boolean
    /** Number: 0 - 100% */
    shapePadding: number
    /** Number: 0 - 100% */
    itemDensity: number
    /** Number: 0 - 100% */
    wordsMaxSize: number
    /** Number: 0 - 100% */
    iconsMaxSize: number
    /** Number: 0 - 100% */
    iconsProportion: number
  }
}

export type WordAnglesPresetKind =
  | 'horizontal'
  | 'vertical'
  | 'hor-ver'
  | 'random'
  | '15 up'
  | '15 down'
  | 'diagonal up'
  | 'diagonal down'
  | 'custom'

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
  color: ColorString
  dimSmallerItems: number
}

export type ItemsColoringGradient = {
  kind: 'gradient'
  colorFrom: string
  colorTo: string
  assignColorBy: 'random' | 'size'
  dimSmallerItems: number
}

export type ColorString = string

export type WordStyleConfig = {
  id: WordConfigId
  text: string
}

export type IconStyleConfig = {
  shapeId: ShapeId
}
