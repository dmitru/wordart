import { observable } from 'mobx'
import { FontId } from 'data/fonts'
import { ShapeId } from 'components/Editor/shape-config'
import { svgIconsOutline, imageShapes, iconShapes } from 'data/shapes'

export type TabMode = 'home' | 'customize shape' | 'add text shape'

export type ShapeVariety =
  | 'blob'
  | 'full canvas'
  | 'image'
  | 'icon'
  | 'custom image'
  | 'text'

export type LeftPanelShapesState = {
  shapeVariety: ShapeVariety
  blob: BlobShapeOptions
  fullCanvas: FullCanvasShapeOptions
  image: ImageShapeOptions
  icon: IconShapeOptions
  text: TextShapeOptions
  customImage: CustomImageShapeOptions
}

export const leftPanelShapesInitialState: LeftPanelShapesState = {
  shapeVariety: 'blob',
  blob: {
    color: 'red',
    complexity: 10,
  },
  customImage: {},
  fullCanvas: {
    color: 'pink',
    padding: 0,
  },
  icon: {
    category: null,
    selected: iconShapes[0].id,
  },
  image: {
    category: null,
    selected: imageShapes[0].id,
  },
  text: {
    fontId: 'Pacifico:regular',
    color: {
      kind: 'single',
      color: 'blue',
    },
    text: 'Hi',
    thumbnailPreview: undefined,
  },
}

export type CustomImageShapeOptions = {}

export type ImageShapeOptions = {
  category: string | null
  selected: ShapeId
}

export type IconShapeOptions = {
  category: string | null
  selected: ShapeId
}

export type TextShapeOptions = {
  thumbnailPreview?: string
  text: string
  fontId: FontId
  color: {
    kind: 'single'
    color: string
  }
}

export type BlobShapeOptions = {
  color: string
  complexity: number
}

export type FullCanvasShapeOptions = {
  color: string
  padding: number
}

// TODO: move it to editor page store
export const leftPanelShapesState = observable<LeftPanelShapesState>(
  leftPanelShapesInitialState
)
