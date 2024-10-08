import { EditorPersistedData } from 'services/api/types'
import { EditorStateSnapshot } from 'components/Editor/editor-store'
import { EditorItemId, EditorItem } from 'components/Editor/lib/editor-item'
import { ColorString } from 'components/Editor/style-options'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { observable, computed } from 'mobx'

export type UndoFrameKind = UndoFrame['kind']

export type UndoFrame =
  | UndoVisualizeFrame
  | UndoItemUpdateFrame
  | UndoSelectionChangeFrame

export type UndoVisualizeFrame = {
  kind: 'visualize'
  dataBefore: EditorPersistedData
  dataAfter: EditorPersistedData
  stateBefore: EditorStateSnapshot
  stateAfter: EditorStateSnapshot
  versionBefore: number
  versionAfter: number
}

export type UndoSelectionChangeFrame = {
  kind: 'selection-change'
  before: EditorStateSnapshot['selection']
  after: EditorStateSnapshot['selection']
}

export type UndoItemUpdateFrame = {
  kind: 'item-update'
  item: EditorItem
  before: ItemUpdateUndoData
  after: ItemUpdateUndoData
  versionBefore: number
  versionAfter: number
}

export type ItemUpdateUndoData = {
  customColor: ColorString | undefined
  locked: boolean
  transform: MatrixSerialized
}

export class UndoStack {
  @observable frames: UndoFrame[] = []
  @observable nextFrame = 0
  maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  clear = () => {
    this.nextFrame = 0
    this.frames = []
  }

  push = (frame: UndoFrame) => {
    this.frames.length = this.nextFrame + 1
    this.frames[this.nextFrame] = frame
    this.nextFrame++

    if (this.frames.length > this.maxSize) {
      const deleteCount = this.maxSize - this.frames.length
      this.frames = this.frames.splice(0, deleteCount)
      this.nextFrame -= deleteCount
    }
  }

  @computed get canUndo() {
    return this.nextFrame >= 1
  }

  undo = (): UndoFrame => {
    if (!this.canUndo) {
      throw new Error('undo stack is empty')
    }
    this.nextFrame--
    return this.frames[this.nextFrame]
  }

  @computed get canRedo() {
    return this.nextFrame < this.frames.length
  }

  redo = (): UndoFrame => {
    if (!this.canRedo) {
      throw new Error('redo stack is empty')
    }
    const frame = this.frames[this.nextFrame]
    this.nextFrame++
    return frame
  }
}
