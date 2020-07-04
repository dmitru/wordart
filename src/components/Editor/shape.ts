import {
  ShapeFullCanvasConf,
  ShapeRandomBlobConf,
  ShapeTextConf,
  ShapeClipartSvgConf,
  ShapeClipartRasterConf,
  ShapeCustomImageSvgConf,
  ShapeCustomImageRasterConf,
  ShapeIconConf,
} from 'components/Editor/shape-config'
import { ColorString } from 'components/Editor/style-options'
import { MatrixSerialized } from 'services/api/persisted/v1'

/** Representation of the currently selected shape */
export type Shape =
  | ShapeIcon
  | ShapeClipart
  | ShapeCustomImage
  | ShapeRandomBlob
  | ShapeFullCanvas
  | ShapeText

export type ShapeClipart = ShapeClipartSvg | ShapeClipartRaster
export type ShapeCustomImage = ShapeCustomImageSvg | ShapeCustomImageRaster

// Clipart
type ShapeSvgBase = {
  url: string
  transform: MatrixSerialized
  originalTransform: MatrixSerialized
  /** Original colors, correspond to colorMap indices */
  originalColors: ColorString[]
  /** Mapping of color slots to fabric items */
  colorMap: SvgShapeColorsMapEntry[]

  obj: fabric.Object
  objOriginalColors: fabric.Object
}

export type ShapeClipartSvg = ShapeSvgBase & {
  kind: 'clipart:svg'
  config: ShapeClipartSvgConf
}

export type ShapeCustomImageSvg = ShapeSvgBase & {
  kind: 'custom:svg'
  config: ShapeCustomImageSvgConf
}

export type ShapeIcon = ShapeSvgBase & {
  kind: 'icon'
  config: ShapeIconConf
}

export type SvgShapeColorsMapEntry = {
  objs: fabric.Object[]
  color: string
  fill: boolean
  stroke: boolean
}

type ShapeRasterBase = {
  url: string
  transform: MatrixSerialized
  originalTransform: MatrixSerialized

  // Canvases
  originalCanvas: HTMLCanvasElement
  processedCanvas: HTMLCanvasElement

  obj: fabric.Object
}

export type ShapeCustomImageRaster = ShapeRasterBase & {
  kind: 'custom:raster'
  config: ShapeCustomImageRasterConf
}

export type ShapeClipartRaster = ShapeRasterBase & {
  kind: 'clipart:raster'
  config: ShapeClipartRasterConf
}

// Text
export type ShapeText = {
  kind: 'text'

  config: ShapeTextConf

  transform: MatrixSerialized
  originalTransform: MatrixSerialized
  obj: fabric.Object
}

// Full canvas
export type ShapeFullCanvas = {
  kind: 'full-canvas'

  config: ShapeFullCanvasConf

  transform: MatrixSerialized
  originalTransform: MatrixSerialized
  obj: fabric.Object
}

// Blob
export type ShapeRandomBlob = {
  kind: 'random-blob'

  config: ShapeRandomBlobConf

  transform: MatrixSerialized
  originalTransform: MatrixSerialized
  obj: fabric.Object
}
