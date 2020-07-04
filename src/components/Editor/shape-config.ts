import { FontId } from 'data/fonts'
import { ColorString } from 'components/Editor/style-options'

/** Representation of an shape option available for selection */
export type ShapeConf =
  | ShapeSvgConf
  | ShapeRasterConf
  | ShapeTextConf
  | ShapeRandomBlobConf
  | ShapeFullCanvasConf
export type ShapeImageConf = ShapeSvgConf | ShapeRasterConf
export type ShapeKind = ShapeConf['kind']

export type ShapeFullCanvasConf = {
  kind: 'full canvas'
  id: 's:full canvas'
  thumbnailUrl: string
  processedThumbnailUrl: string
  color: string
}

export type ShapeRandomBlobConf = {
  kind: 'random blob'
  id: 's:random blob'
  url: string
  thumbnailUrl: string
  processedThumbnailUrl: string
  color: string
}

export type ShapeSvgConf = {
  isCustom?: boolean
  id: ShapeId
  categories?: string[]
  keywords?: string[]
  kind: 'svg'
  url: string
  thumbnailUrl: string
  processedThumbnailUrl: string
  title: string
  processing: SvgProcessingConf
}
export type ShapeRasterConf = {
  isCustom?: boolean
  categories?: string[]
  keywords?: string[]
  id: ShapeId
  kind: 'raster'
  url: string
  thumbnailUrl: string
  processedThumbnailUrl: string
  title: string
  processing?: RasterProcessingConf
}
export type ShapeTextConf = {
  isCustom?: boolean
  id: ShapeId
  title: string
  thumbnailUrl: string
  processedThumbnailUrl: string
  kind: 'text'
  text: string
  textStyle: ShapeTextStyle
}

export type ShapeTextStyle = {
  color: string
  fontId: FontId
}

export type ShapeId = string

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
