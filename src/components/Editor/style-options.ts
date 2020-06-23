/** Defines shape of datastructures to keep track of UI state for
 * various style options.
 */

import { WordConfigId } from 'components/Editor/editor-store'
import { ShapeId } from 'components/Editor/shape-config'
import { FontId } from 'data/fonts'

/** UI state for BG style options */
export type BgStyleOptions = {
  fill: {
    kind: BgFillKind
    color: BgFillColor
  }

  items: {
    words: WordItemsOptions
    icons: IconItemsOptions

    placement: BgPlacementConf

    opacity: number
    dimSmallerItems: number
    brightness: number

    coloring: {
      kind: (ItemsColoringColorConf | ItemsColoringGradientConf)['kind']
      color: ItemsColoringColorConf
      gradient: ItemsColoringGradientConf
    }
  }
}

/** UI state for shape style options */
export type ShapeStyleOptions = {
  opacity: number
  colors: {
    color: ColorString
    colorMaps: Map<ShapeId, ColorString[]>
  }
  items: {
    words: WordItemsOptions
    icons: IconItemsOptions

    placement: ShapePlacementConf

    opacity: number
    dimSmallerItems: number
    brightness: number

    coloring: {
      kind: (
        | ItemsColoringColorConf
        | ItemsColoringGradientConf
        | ItemsColoringShapeConf
      )['kind']
      color: ItemsColoringColorConf
      gradient: ItemsColoringGradientConf
      shape: ItemsColoringShapeConf
    }
  }
}

// BG fill
export type BgFill = BgFillColor | BgFillTransparent
export type BgFillKind = BgFill['kind']

export type BgFillColor = {
  kind: 'color'
  color: ColorString
  opacity: number
}

export type BgFillTransparent = {
  kind: 'transparent'
}

// Items coloring
export type ItemsColoringColorConf = {
  kind: 'color'
  colors: ColorString[]
}

export type ItemsColoringGradientConf = {
  kind: 'gradient'
  gradient: ItemsColorGradient
}

export type ItemsColoringShapeConf = {
  kind: 'shape'
}

export type WordItemsOptions = {
  wordList: WordListEntry[]
  fontIds: FontId[]
  anglesPreset: WordAnglesPresetKind
  customAngles: number[]
}

export type WordListEntry = {
  id: WordConfigId
  text: string
  /** word-specific angle */
  angle?: number
  /** word-specific font */
  fontId?: FontId
  /** word-specific color */
  color?: string
}

export type IconItemsOptions = {
  iconList: IconListEntry[]
}

export type IconListEntry = {
  shapeId: ShapeId
}

export type ShapePlacementConf = {
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

export type BgPlacementConf = {
  /** Number: 0 - 100% */
  margins: number
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

export type ColorString = string

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
  | ItemsShapeColoring
  | ItemsSingleColorColoring
  | ItemsGradientColoring

export type ItemsShapeColoring = {
  kind: 'shape'
  dimSmallerItems: number
  brightness: number
}

export type ItemsSingleColorColoring = {
  kind: 'single-color'
  color: ColorString
  dimSmallerItems: number
  brightness: number
}

export type ItemsGradientColoring = {
  kind: 'gradient'
  colorFrom: string
  colorTo: string
  assignColorBy: 'random' | 'size'
  dimSmallerItems: number
  brightness: number
}
