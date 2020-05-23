import {
  BackgroundStyleConfig,
  ShapeId,
  ShapeStyleConfig,
} from 'components/Editor/style'
import { ItemId } from 'components/Editor/lib/generator'
import { FontId } from 'data/fonts'
import { Dimensions } from 'lib/wordart/canvas-utils'

export type EditorPersistedDataV1 = {
  version: 1
  data: {
    editor: {
      sceneSize: Dimensions
      bg: {
        style: EditorPersistedBackgroundStyleConfigV1
      }
      shape: {
        style: EditorPersistedShapeStyleConfigV1
        transform: MatrixSerialized | null
        shapeId: ShapeId | null
      }
    }
    generated: {
      bg: {
        items: EditorPersistedItemV1[]
        words: EditorPersistedWordV1[]
        fontIds: FontId[]
      }
      shape: {
        items: EditorPersistedItemV1[]
        words: EditorPersistedWordV1[]
        fontIds: FontId[]
      }
    }
  }
}

export type EditorPersistedBackgroundStyleConfigV1 = BackgroundStyleConfig
export type EditorPersistedShapeStyleConfigV1 = ShapeStyleConfig

export type EditorPersistedItemV1 =
  | EditorPersistedItemWordV1
  | EditorPersistedSymbolV1

export type MatrixSerialized = [number, number, number, number, number, number]

export type EditorPersistedWordV1 = {
  text: string
  fontIndex: number
}

export type EditorPersistedItemWordV1 = {
  /** Kind */
  k: 'w'
  id: ItemId
  /** Word config ID */
  wcId?: number
  /** Word list index */
  wi: number
  /** Transform */
  t: MatrixSerialized
  /** Color */
  c: string
  /** Shape color */
  sc: string
}
export type EditorPersistedSymbolV1 = {
  /** Kind */
  k: 's'
  id: ItemId
  /** Shape ID */
  sId: ShapeId
  /** Transform */
  t: MatrixSerialized
}
