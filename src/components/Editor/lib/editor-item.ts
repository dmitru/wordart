import {
  EditorItemShape,
  EditorItemConfigShape,
} from 'components/Editor/lib/editor-item-icon'
import {
  EditorItemWord,
  EditorItemConfigWord,
} from 'components/Editor/lib/editor-item-word'

export type EditorItemConfig = EditorItemConfigWord | EditorItemConfigShape
export type EditorItemId = string
export type EditorItem = EditorItemWord | EditorItemShape
