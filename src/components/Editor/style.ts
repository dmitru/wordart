import { WordConfigId } from 'components/Editor/editor-store'
import { FontId, fonts } from 'data/fonts'
import { ShapeFillColorsConfig } from 'components/Editor/lib/editor'
import { MatrixSerialized } from 'services/api/persisted/v1'

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
].map((s, index) => ({ id: `${index}`, text: s } as WordStyleConfig))

const defaultWordsListBackground: WordStyleConfig[] = ['back'].map(
  (s, index) => ({ id: `${index}`, text: s } as WordStyleConfig)
)

export const defaultShapeStyle: ShapeStyleConfig = {
  kind: 'shape',
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
    removeLightBackground: {
      enabled: false,
      threshold: 0.95,
    },
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
    shapeBrightness: 0,
  },

  words: {
    fontIds: [fonts[3].styles[0].fontId, fonts[2].styles[0].fontId],
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
  kind: 'background',
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
    shapeBrightness: 0,
  },

  words: {
    fontIds: [fonts[0].styles[0].fontId],
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

export type ShapeConfigSvg = {
  id: ShapeId
  kind: 'svg'
  keepSvgColors?: boolean
  isCustom?: boolean
  url: string
  thumbnailUrl: string
  title: string
  fill?: string
  processing?: ShapeStyleConfig['processing']
  fillConfig?: ShapeFillColorsConfig
  transform?: MatrixSerialized
}
export type ShapeConfigImg = {
  id: ShapeId
  kind: 'img'
  isCustom?: boolean
  url: string
  thumbnailUrl?: string
  title: string
  processing?: ShapeStyleConfig['processing']
  fillConfig?: ShapeFillColorsConfig
  transform?: MatrixSerialized
}
export type ShapeConfig = ShapeConfigSvg | ShapeConfigImg

export type ShapeKind = 'img' | 'svg'
export type ShapeId = string
export type IconId = number

/** Describes UI state for background style  */
export type BackgroundStyleConfig = {
  kind: 'background'

  fill: {
    kind: 'color' | 'transparent'
    color: ColorString
  }

  itemsColoring: {
    kind: 'color' | 'gradient' | 'shape'
    color: ColorString
    gradient: ItemsColorGradient
    dimSmallerItems: number
    /** 0-100, 0 means precisely the shape color */
    shapeBrightness: number
  }

  words: {
    wordList: WordStyleConfig[]
    /** Default fonts */
    fontIds: FontId[]
    /** Default angles */
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
  kind: 'shape'

  processing: {
    removeLightBackground: {
      enabled: boolean
      /** 0 - 1, 0 means no pixels are modified, 1 means only pure black pixels remain */
      threshold: number
    }
    edges: {
      enabled: boolean
      /** Edge detection intensity, 0-100% */
      amount: number
    }
    invert: {
      enabled: boolean
      /** Color to fill the negative space */
      color: string
    }
  }

  // TODO: refactor to take tagged union
  fill: {
    kind: 'original' | 'color-map' | 'single-color'
    colorMap: string[]
    defaultColorMap: string[]
    color: ColorString
    opacity: number
  }

  // TODO: refactor to take tagged union
  itemsColoring: {
    kind: 'color' | 'gradient' | 'shape'
    color: ColorString
    gradient: ItemsColorGradient
    dimSmallerItems: number
    /** 0-100, 0 means precisely the shape color */
    shapeBrightness: number
  }

  words: {
    wordList: WordStyleConfig[]
    fontIds: FontId[]
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
  | 'hor-ver-diagonal'
  | 'random'
  | '15'
  | '15 up'
  | '15 down'
  | 'diagonal'
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
  shapeBrightness: number
  shapeStyleFill?: ShapeStyleConfig['fill']
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
  /** word-specific angle */
  angle?: number
  /** word-specific font */
  fontId?: FontId
  /** word-specific color */
  color?: string
}

export type IconStyleConfig = {
  shapeId: ShapeId
}
