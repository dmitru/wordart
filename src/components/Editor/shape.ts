import { MatrixSerialized } from 'services/api/persisted/v1'
import {
  ShapeTextStyle,
  ShapeId,
  RasterProcessingConf,
  SvgProcessingConf,
  ShapeSvgConf,
  ShapeRasterConf,
  ShapeTextConf,
} from 'components/Editor/shape-config'
import { ColorString } from 'components/Editor/style-options'

/** Representation of the currently selected shape */
export type Shape = ShapeSvg | ShapeRaster | ShapeText
export type ShapeKind = Shape['kind']

// SVG

export type ShapeSvg = {
  id: ShapeId
  kind: 'svg'
  url: string
  isCustom: boolean
  transform: MatrixSerialized
  /** Original colors, correspond to colorMap indices */
  originalColors: ColorString[]
  /** Mapping of color slots to fabric items */
  colorMap: SvgShapeColorsMapEntry[]

  config: ShapeSvgConf

  processing: {
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

  obj: fabric.Object
  objOriginalColors: fabric.Object
}

export type SvgShapeColorsMapEntry = {
  objs: fabric.Object[]
  color: string
  fill: boolean
  stroke: boolean
}

// Raster

export type ShapeRaster = {
  id: ShapeId
  kind: 'raster'
  isCustom: boolean
  url: string
  processing: RasterProcessingConf
  transform: MatrixSerialized

  config: ShapeRasterConf

  // Canvases
  originalCanvas: HTMLCanvasElement
  processedCanvas: HTMLCanvasElement

  obj: fabric.Object
}

// Text

export type ShapeText = {
  id: ShapeId
  kind: 'text'
  isCustom: boolean
  text: string
  textStyle: ShapeTextStyle

  config: ShapeTextConf

  transform: MatrixSerialized
  obj: fabric.Object
}
