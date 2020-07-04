import {
  ShapeId,
  ShapeRasterConf,
  ShapeSvgConf,
  ShapeTextConf,
} from 'components/Editor/shape-config'
import { ColorString } from 'components/Editor/style-options'
import { MatrixSerialized } from 'services/api/persisted/v1'

/** Representation of the currently selected shape */
export type Shape = ShapeSvg | ShapeRaster | ShapeText

// SVG

export type ShapeSvg = {
  id: ShapeId
  kind: 'svg'
  url: string
  isCustom: boolean
  transform: MatrixSerialized
  originalTransform: MatrixSerialized
  /** Original colors, correspond to colorMap indices */
  originalColors: ColorString[]
  /** Mapping of color slots to fabric items */
  colorMap: SvgShapeColorsMapEntry[]

  config: ShapeSvgConf

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
  transform: MatrixSerialized
  originalTransform: MatrixSerialized

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

  config: ShapeTextConf

  transform: MatrixSerialized
  originalTransform: MatrixSerialized
  obj: fabric.Object
}
