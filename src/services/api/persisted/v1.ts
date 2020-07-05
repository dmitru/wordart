import { FontId } from 'data/fonts'
import { Dimensions } from 'lib/wordart/canvas-utils'
import { BgStyleConf, ShapeStyleConf } from 'components/Editor/style'
import {
  ShapeId,
  RasterProcessingConf,
  SvgProcessingConf,
  ShapeTextStyle,
} from 'components/Editor/shape-config'
import { EditorItemId } from 'components/Editor/lib/editor-item'

export type EditorPersistedDataV1 = {
  version: 1
  data: {
    key: string
    version: number

    sceneSize: Dimensions

    shape: PersistedShapeConfV1
    shapeStyle: PersistedShapeStyleConfV1
    customFonts: PersistedCustomFontV1[]
    shapeItems: {
      items: PersistedItemV1[]
      words: PersistedWordV1[]
      fontIds: FontId[]
    }

    bgStyle: PersistedBgStyleConfV1
    bgItems: {
      items: PersistedItemV1[]
      words: PersistedWordV1[]
      fontIds: FontId[]
    }
  }
}

export type PersistedCustomFontV1 = {
  fontUrl: string
  fontId: string
  title: string
}

export type PersistedShapeConfV1 =
  | PersistedShapeConfClipartRasterV1
  | PersistedShapeConfCustomRasterV1
  | PersistedShapeConfClipartSvgV1
  | PersistedShapeConfIconV1
  | PersistedShapeConfBlobV1
  | PersistedShapeConfFullCanvasV1
  | PersistedShapeConfCustomSvgV1
  | PersistedShapeConfCustomTextV1

export type PersistedShapeConfClipartRasterV1 = {
  kind: 'clipart:raster'
  transform: MatrixSerialized
  shapeId: ShapeId
  processing?: RasterProcessingConf
}
export type PersistedShapeConfCustomRasterV1 = {
  kind: 'custom:raster'
  transform: MatrixSerialized
  url: string
  processing?: RasterProcessingConf
}
export type PersistedShapeConfClipartSvgV1 = {
  kind: 'clipart:svg'
  transform: MatrixSerialized
  shapeId: ShapeId
  processing?: SvgProcessingConf
}
export type PersistedShapeConfIconV1 = {
  kind: 'icon'
  transform: MatrixSerialized
  shapeId: ShapeId
  processing?: SvgProcessingConf
}
export type PersistedShapeConfBlobV1 = {
  kind: 'blob'
  transform: MatrixSerialized
  pathData: string
  color: string
  points: number
  complexity: number
}
export type PersistedShapeConfFullCanvasV1 = {
  kind: 'full-canvas'
  color: string
}
export type PersistedShapeConfCustomSvgV1 = {
  kind: 'custom:svg'
  transform: MatrixSerialized
  url: string
  processing?: SvgProcessingConf
}
export type PersistedShapeConfCustomTextV1 = {
  kind: 'text'
  transform: MatrixSerialized
  text: string
  textStyle: ShapeTextStyle
  // TODO: add custom fonts...
}

export type PersistedBgStyleConfV1 = BgStyleConf
export type PersistedShapeStyleConfV1 = ShapeStyleConf

export type PersistedItemV1 = PersistedItemWordV1 | PersistedItemShapeV1

export type MatrixSerialized = [number, number, number, number, number, number]

export type PersistedWordV1 = {
  text: string
  fontIndex: number
}

export type PersistedItemWordV1 = {
  /** Kind */
  k: 'w'
  id: EditorItemId
  /** Word config ID */
  wcId?: number
  /** Word list index */
  wi: number
  /** Transform */
  t: MatrixSerialized
  /** Is locked? */
  l?: boolean
  /** Color */
  c: string
  /** Custom color? */
  cc?: string
  /** Shape color */
  sc: string
}
export type PersistedItemShapeV1 = {
  /** Kind */
  k: 's'
  id: EditorItemId
  /** Shape ID */
  sId: ShapeId
  /** Transform */
  t: MatrixSerialized
  /** Is locked? */
  l?: boolean
  /** Color */
  c: string
  /** Custom color? */
  cc?: string
  /** Shape color */
  sc: string
}
