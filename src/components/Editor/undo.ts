export type UndoFrameKind = UndoFrame['kind']

export type UndoFrame = UndoVisualizeFrame

export type UndoVisualizeFrame = {
  kind: 'visualize'
}

export class UndoStack {
  frames: UndoFrame[] = []
  nextFrame = 0
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

  canUndo = () => this.nextFrame >= 1

  undo = (): UndoFrame => {
    if (!this.canUndo()) {
      throw new Error('undo stack is empty')
    }
    this.nextFrame--
    return this.frames[this.nextFrame]
  }

  canRedo = () => this.nextFrame < this.frames.length

  redo = (): UndoFrame => {
    if (!this.canRedo()) {
      throw new Error('redo stack is empty')
    }
    const frame = this.frames[this.nextFrame - 1]
    this.nextFrame++
    return frame
  }
}
