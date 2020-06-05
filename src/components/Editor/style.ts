import {
  BgFill,
  BgPlacementConf,
  BgStyleOptions,
  IconListEntry,
  ItemsColoringColorConf,
  ItemsColoringGradientConf,
  ItemsColoringShapeConf,
  ShapePlacementConf,
  ShapeStyleOptions,
  WordAnglesPresetKind,
  WordItemsOptions,
  WordListEntry,
  ColorString,
} from 'components/Editor/style-options'
import { FontId } from 'data/fonts'

export type IconId = number

export type ThemePreset = {
  title: string
  // style
  bgFill: ColorString
  bgItemsColoring: BgStyleConf['items']['coloring']
  shapeFill: ColorString
  shapeItemsColoring: ShapeStyleConf['items']['coloring']
  shapeOpacity: number
  itemsOpacity: number
  shapeDimSmallerItems: number
  bgDimSmallerItems: number
}

export type BgStyleConf = {
  fill: BgFill
  items: {
    words: WordItemsConf
    icons: IconItemsConf

    placement: BgPlacementConf

    opacity: number
    dimSmallerItems: number

    coloring: ItemsColoringColorConf | ItemsColoringGradientConf
  }
}

export const mkBgStyleConfFromOptions = (
  opts: BgStyleOptions
): BgStyleConf => ({
  fill: opts.fill.kind === 'color' ? opts.fill.color : { kind: 'transparent' },
  items: {
    words: mkWordItemsConfFromOptions(opts.items.words),
    icons: opts.items.icons,
    dimSmallerItems: opts.items.dimSmallerItems,
    opacity: opts.items.opacity,
    placement: opts.items.placement,
    coloring:
      opts.items.coloring.kind === 'color'
        ? opts.items.coloring.color
        : opts.items.coloring.gradient,
  },
})

export type ShapeStyleConf = {
  opacity: number
  items: {
    words: WordItemsConf
    icons: IconItemsConf

    placement: ShapePlacementConf

    opacity: number
    dimSmallerItems: number

    coloring:
      | ItemsColoringColorConf
      | ItemsColoringGradientConf
      | ItemsColoringShapeConf
  }
}

export const mkShapeStyleConfFromOptions = (
  opts: ShapeStyleOptions
): ShapeStyleConf => ({
  opacity: opts.opacity,
  items: {
    words: mkWordItemsConfFromOptions(opts.items.words),
    icons: opts.items.icons,
    dimSmallerItems: opts.items.dimSmallerItems,
    opacity: opts.items.opacity,
    placement: opts.items.placement,
    coloring:
      opts.items.coloring.kind === 'color'
        ? opts.items.coloring.color
        : opts.items.coloring.kind === 'gradient'
        ? opts.items.coloring.gradient
        : opts.items.coloring.shape,
  },
})

export const mkWordItemsConfFromOptions = (
  opts: WordItemsOptions
): WordItemsConf => ({
  wordList: opts.wordList,
  fontIds: opts.fontIds,
  angles:
    opts.anglesPreset === 'custom'
      ? opts.customAngles
      : getAnglesForPreset(opts.anglesPreset),
})

export type WordItemsConf = {
  wordList: WordListEntry[]
  fontIds: FontId[]
  angles: number[]
}

export type IconItemsConf = {
  iconList: IconListEntry[]
}

export const getAnglesForPreset = (preset: WordAnglesPresetKind): number[] => {
  switch (preset) {
    case 'horizontal':
      return [0]
    case 'vertical':
      return [-90]
    case 'random':
      return Array(8)
        .fill(null)
        .map((a) => -90 + Math.round(180 * Math.random()))
    case 'hor-ver':
      return [0, -90]
    case 'hor-ver-diagonal':
      return [0, -90, -45, 45]
    case '15 down':
      return [-15]
    case '15 up':
      return [15]
    case '15':
      return [-15, 15]
    case 'diagonal':
      return [-45, 45]
    case 'diagonal up':
      return [45]
    case 'diagonal down':
      return [-45]
    default:
      return [45]
  }
}
