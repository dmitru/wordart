import { FontId } from 'data/fonts'
import { ColorString } from 'components/Editor/style-options'
import {
  ShapeClipartSvg,
  ShapeCustomImageSvg,
  ShapeIcon,
  ShapeClipartRaster,
  ShapeCustomImageRaster,
} from 'components/Editor/shape'

export type ShapeId = string

/** Representation of an shape option available for selection */
export type ShapeConf =
  | ShapeClipartConf
  | ShapeCustomImageConf
  | ShapeIconConf
  | ShapeTextConf
  | ShapeRandomBlobConf
  | ShapeFullCanvasConf

export type ShapeClipartConf = ShapeClipartSvgConf | ShapeClipartRasterConf
export type ShapeCustomImageConf =
  | ShapeCustomImageSvgConf
  | ShapeCustomImageRasterConf

export type ShapeRasterConf =
  | ShapeClipartRasterConf
  | ShapeCustomImageRasterConf

export type ShapeKind = ShapeConf['kind']

export type ShapeTextConf = {
  thumbnailUrl: string
  kind: 'text'
  text: string
  textStyle: ShapeTextStyle
}

export type ShapeTextStyle = {
  color: string
  fontId: FontId
}

export type ShapeFullCanvasConf = {
  kind: 'full canvas'
  color: string
}

export type ShapeRandomBlobConf = {
  kind: 'blob'
  color: string
  points: number
  complexity: number
  svg: string
}

type ShapeSvgConfBase = {
  categories?: string[]
  keywords?: string[]
  url: string
  thumbnailUrl: string
  processedThumbnailUrl: string
  title: string
  processing: SvgProcessingConf
}

export type ShapeClipartSvgConf = ShapeSvgConfBase & {
  kind: ShapeClipartSvg['kind']
  id: ShapeId
}
export type ShapeCustomImageSvgConf = ShapeSvgConfBase & {
  kind: ShapeCustomImageSvg['kind']
}
export type ShapeIconConf = ShapeSvgConfBase & {
  kind: ShapeIcon['kind']
  id: ShapeId
}

type ShapeRasterConfBase = {
  categories?: string[]
  keywords?: string[]
  url: string
  thumbnailUrl: string
  processedThumbnailUrl: string
  title: string
  processing: RasterProcessingConf
}

export type ShapeClipartRasterConf = ShapeRasterConfBase & {
  kind: ShapeClipartRaster['kind']
  id: ShapeId
}
export type ShapeCustomImageRasterConf = ShapeRasterConfBase & {
  kind: ShapeCustomImageRaster['kind']
}

export type SvgProcessingConf = {
  colors:
    | {
        kind: 'original'
      }
    | {
        kind: 'single-color'
        color: ColorString
      }
    | {
        kind: 'color-map'
        colors: ColorString[]
      }
  edges?: {
    /** Edge detection intensity, 0-100% */
    amount: number
  }
}

export type RasterProcessingConf = {
  removeLightBackground?: {
    /** 0 - 1, 0 means no pixels are modified, 1 means only pure black pixels remain */
    threshold: number
  }
  edges?: {
    /** Edge detection intensity, 0-100% */
    amount: number
  }
  invert?: {
    /** Color to fill the negative space */
    color: string
  }
}
