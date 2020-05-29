import { FontId } from 'data/fonts'
import { WordConfigId } from 'components/Editor/editor-store'
import fabric from 'fabric/fabric-impl'
import { applyTransformToObj } from 'components/Editor/lib/fabric-utils'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { Font } from 'components/Editor/lib/generator'

export type EditorItemConfig = EditorItemConfigWord

export type EditorItemConfigWord = {
  kind: 'word'
  index: number
  locked: boolean
  text: string
  fontId: FontId
  transform: paper.Matrix
  wordConfigId?: WordConfigId
  customColor?: string
  /** Default color of the item, determined by the coloring style */
  color: string
  /** Color of the shape at the location where item was placed */
  shapeColor: string
}

export type EditorItemId = string
export type EditorItem = EditorItemWord

export class EditorItemWord {
  kind = 'word' as 'word'
  font: Font
  id: EditorItemId
  wordConfigId?: WordConfigId
  defaultText = ''
  customText?: string

  /** When was the item placed by the generation algorithm */
  placedIndex = -1

  /** Transform produced by the generator algorithm */
  generatedTransform = new paper.Matrix()
  /** Current transform of the item */
  transform = new paper.Matrix()
  /** Is position locked? */
  locked = false

  /** Color of the shape where the item was auto-placed */
  shapeColor = 'black'
  /** Custom color of the item */
  customColor?: string
  /** Default color of the item, determined by the coloring style */
  color: string

  fabricObj: fabric.Group
  wordObj: fabric.Object
  canvas: fabric.Canvas

  path?: opentype.Path
  pathBounds?: opentype.BoundingBox
  lockBorder: fabric.Group

  isShowingLockBorder = false

  constructor(
    id: EditorItemId,
    canvas: fabric.Canvas,
    conf: EditorItemConfigWord,
    font: Font
  ) {
    this.id = id
    this.canvas = canvas
    this.font = font

    const wordPath = font.otFont.getPath(conf.text, 0, 0, 100)
    const pathBounds = wordPath.getBoundingBox()
    const pw = pathBounds.x2 - pathBounds.x1
    const ph = pathBounds.y2 - pathBounds.y1

    const pad = 0
    const wordGroup = new fabric.Group([
      new fabric.Rect().set({
        originX: 'center',
        originY: 'center',
        left: pathBounds.x1,
        top: pathBounds.y1,
        width: pw + 2 * pad,
        height: ph + 2 * pad,
        strokeWidth: 1,
        stroke: 'black',
        fill: 'rgba(255,255,255,0.3)',
        opacity: 0,
      }),
      new fabric.Path(wordPath.toPathData(3)).set({
        originX: 'center',
        originY: 'center',
      }),
    ])

    this.customColor = conf.customColor
    this.color = conf.color || 'black'

    this.fabricObj = wordGroup
    this.wordObj = wordGroup.item(1)
    this.lockBorder = wordGroup.item(0)
    this.wordObj.set({ fill: this.color })

    this.transform = conf.transform
    this.generatedTransform = conf.transform
    this.defaultText = conf.text
    this.shapeColor = conf.shapeColor
    this.path = wordPath
    this.pathBounds = pathBounds
    this.placedIndex = conf.index
    this.wordConfigId = conf.wordConfigId

    this.setLocked(conf.locked)

    wordGroup.on('modified', () => {
      this.transform = new paper.Matrix(wordGroup.calcOwnMatrix())
    })
    wordGroup.on('selected', () => {
      this.fabricObj.bringToFront()
      this.canvas.requestRenderAll()
    })

    this._updateColor(this.customColor || this.color)

    applyTransformToObj(wordGroup, conf.transform.values as MatrixSerialized)
  }

  setSelectable = (value: boolean) => {
    this.fabricObj.selectable = value
  }

  private _updateColor = (color: string) => {
    this.fabricObj.cornerColor = color
    this.fabricObj.cornerStyle = 'circle'
    this.fabricObj.transparentCorners = false
    this.fabricObj.borderColor = color
    this.wordObj.set({ fill: color })
    this.lockBorder.set({ stroke: color })
  }

  private _updateOpacity = (opacity: number) => {
    this.fabricObj.opacity = opacity
  }

  setColor = (color: string) => {
    this.color = color
    this._updateColor(this.customColor || this.color)
  }

  setOpacity = (opacity: number) => {
    this._updateOpacity(opacity)
  }

  setCustomColor = (color: string) => {
    this.customColor = color
    this._updateColor(this.customColor)
  }

  clearCustomColor = () => {
    this.customColor = undefined
    this._updateColor(this.color)
  }

  setLockBorderVisibility = (value: boolean) => {
    this.isShowingLockBorder = value
    this.lockBorder.set({
      opacity: this.locked && value ? 1 : 0,
    })
  }

  setLocked = (value: boolean) => {
    this.locked = value
    this.lockBorder.set({ opacity: value && this.isShowingLockBorder ? 1 : 0 })
  }
}
