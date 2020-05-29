import { MatrixSerialized } from 'services/api/persisted/v1'
import {
  ShapeTextStyle,
  ShapeId,
  RasterProcessingConf,
  SvgProcessingConf,
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
}

// Raster

export type ShapeRaster = {
  id: ShapeId
  kind: 'raster'
  isCustom: boolean
  url: string
  processing: RasterProcessingConf
  transform: MatrixSerialized

  // Canvases
  originalCanvas: HTMLCanvasElement
  processedCanvas: HTMLCanvasElement

  obj: fabric.Object
}

// Text

export type ShapeText = {
  id: ShapeId
  kind: 'text'
  text: string
  color: string
  isCustom: boolean
  textStyle: ShapeTextStyle
  transform: MatrixSerialized

  obj: fabric.Object
}
