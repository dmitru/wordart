import { FontId } from 'data/fonts'
import { WordConfigId } from 'components/Editor/editor-store'
import { fabric } from 'fabric'
import paper from 'paper'
import { applyTransformToObj } from 'components/Editor/lib/fabric-utils'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { Font } from 'components/Editor/lib/generator'
import { BoundingBox } from 'opentype.js'
import { EditorItemId } from 'components/Editor/lib/editor-item'
import { darken, lighten } from 'polished'

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
  opacity: number
}

export type GlyphInfo = {
  key: string
  glyph: opentype.Glyph
  path: opentype.Path
  pathData: string | any[]
}

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
  opacity: number
  selectable = true

  fabricObj: fabric.Group
  wordObj: fabric.Object
  canvas: fabric.Canvas

  path?: opentype.Path
  pathBounds?: opentype.BoundingBox
  lockBorder: fabric.Group

  isShowingLockBorder = false
  prevTransform: paper.Matrix

  constructor(
    id: EditorItemId,
    canvas: fabric.Canvas,
    conf: EditorItemConfigWord,
    font: Font,
    wordPath: opentype.Path,
    wordPathData: string | any[],
    wordPathObj: fabric.Path,
    pathBounds: BoundingBox,
    wordConfigId?: WordConfigId
  ) {
    this.id = id
    this.wordConfigId = wordConfigId
    this.canvas = canvas
    this.font = font

    const pw = pathBounds.x2 - pathBounds.x1
    const ph = pathBounds.y2 - pathBounds.y1

    const pad = 0
    // @ts-ignore
    const saved = fabric.Polyline.prototype._setPositionDimensions
    // @ts-ignore
    fabric.Polyline.prototype._setPositionDimensions = () => null
    const path = new fabric.Path(wordPathData).set({
      originX: 'center',
      originY: 'center',
    })
    // @ts-ignore
    fabric.Polyline.prototype._setPositionDimensions = saved
    path.top = wordPathObj.top
    path.left = wordPathObj.left
    path.width = wordPathObj.width
    path.height = wordPathObj.height
    // @ts-ignore
    path.pathOffset = wordPathObj.pathOffset

    this.customColor = conf.customColor
    this.color = conf.color || 'black'
    this.opacity = conf.opacity

    const wordGroup = new fabric.Group(
      [
        new fabric.Rect().set({
          originX: 'center',
          originY: 'center',
          left: pathBounds.x1,
          top: pathBounds.y1,
          width: pw + 2 * pad,
          height: ph + 2 * pad,
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          stroke: '#0006',
          fill: 'rgba(255,255,255,0.3)',
          opacity: 0,
        }),
        path,
      ],
      { lockUniScaling: true }
    )

    this.fabricObj = wordGroup
    this.wordObj = wordGroup.item(1)
    this.lockBorder = wordGroup.item(0)
    this.wordObj.set({ fill: this.color })

    this.prevTransform = conf.transform
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
      this.prevTransform = this.transform
      this.transform = new paper.Matrix(wordGroup.calcOwnMatrix())
    })
    wordGroup.on('selected', () => {
      this.fabricObj.bringToFront()
      this.canvas.requestRenderAll()
    })

    this._updateColor(this.customColor || this.color)

    applyTransformToObj(wordGroup, conf.transform.values as MatrixSerialized)
  }

  setHidden = (value: boolean) => {
    if (value) {
      this.fabricObj.opacity = 0
      this.fabricObj.selectable = false
    } else {
      this.fabricObj.opacity = this.opacity
      this.fabricObj.selectable = this.selectable
    }
  }

  setSelectable = (value: boolean) => {
    this.selectable = value
    this.fabricObj.selectable = value
  }

  private _updateColor = (color: string) => {
    this.fabricObj.cornerColor = darken(0.05, color)
    this.fabricObj.cornerStrokeColor = lighten(0.3, color)
    this.fabricObj.cornerStyle = 'circle'
    this.fabricObj.transparentCorners = false
    this.fabricObj.borderColor = darken(0.05, color)
    this.fabricObj.borderDashArray = [5, 5]
    this.wordObj.set({ fill: color })
    this.lockBorder.set({ stroke: color })
  }

  private _updateOpacity = (opacity: number) => {
    this.opacity = opacity
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
