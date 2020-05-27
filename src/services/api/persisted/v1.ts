import {
  BackgroundStyleConfig,
  ShapeId,
  ShapeStyleConfig,
  ShapeConfigImg,
} from 'components/Editor/style'
import { FontId } from 'data/fonts'
import { Dimensions } from 'lib/wordart/canvas-utils'
import { EditorItemId } from 'components/Editor/lib/editor'

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
        // TODO: refactor this to e.g.
        // custom: boolean
        // kind: 'empty' | 'text' | 'svg' | 'raster'
        // and a tag union for these types...
        kind: 'empty' | 'builtin' | 'custom'
        /** null for custom images */
        shapeId: ShapeId | null
        /** null for builtin images  */
        custom: {
          url: string
          processing: ShapeConfigImg['processing']
        } | null
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
export type EditorPersistedSymbolV1 = {
  /** Kind */
  k: 's'
  id: EditorItemId
  /** Shape ID */
  sId: ShapeId
  /** Transform */
  t: MatrixSerialized
}
