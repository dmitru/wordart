import { fabric } from 'fabric'
import paper from 'paper'
import {
  applyTransformToObj,
  setFillColor,
} from 'components/Editor/lib/fabric-utils'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { EditorItemId } from 'components/Editor/lib/editor-item'
import { ShapeId } from 'components/Editor/shape-config'
import { canvasToImgElement } from 'lib/wordart/canvas-utils'

export type EditorItemConfigShape = {
  kind: 'shape'
  index: number
  locked: boolean
  shapeId: ShapeId
  transform: paper.Matrix
  customColor?: string
  /** Default color of the item, determined by the coloring style */
  color: string
  /** Color of the shape at the location where item was placed */
  shapeColor: string
}

export class EditorItemShape {
  kind = 'shape' as 'shape'
  id: EditorItemId
  shapeId: ShapeId

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
  shapeObj: fabric.Object
  canvas: fabric.Canvas

  path?: opentype.Path
  pathBounds?: opentype.BoundingBox
  lockBorder: fabric.Group

  isShowingLockBorder = false

  constructor(
    id: EditorItemId,
    canvas: fabric.Canvas,
    conf: EditorItemConfigShape,
    shapeObj: fabric.Object
  ) {
    this.id = id
    this.canvas = canvas

    const bounds = shapeObj.getBoundingRect()

    const shapeGroup = new fabric.Group(
      [
        new fabric.Rect().set({
          originY: 'top',
          originX: 'left',
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
          strokeWidth: 0,
          stroke: 'black',
          fill: 'rgba(255,255,255,0.3)',
          opacity: 0,
        }),
        shapeObj,
      ],
      {
        originX: 'center',
        originY: 'center',
      }
    )

    this.customColor = conf.customColor
    this.color = conf.color || 'black'

    this.fabricObj = shapeGroup
    this.shapeObj = shapeGroup.item(1)
    this.lockBorder = shapeGroup.item(0)
    this.shapeObj.set({ fill: this.color })

    this.transform = new paper.Matrix(conf.transform)
    this.generatedTransform = new paper.Matrix(conf.transform)
    this.shapeColor = conf.shapeColor
    this.shapeId = conf.shapeId
    this.placedIndex = conf.index

    this.setLocked(conf.locked)

    shapeGroup.on('modified', () => {
      this.transform = new paper.Matrix(shapeGroup.calcOwnMatrix())
    })
    shapeGroup.on('selected', () => {
      this.fabricObj.bringToFront()
      this.canvas.requestRenderAll()
    })

    this._updateColor(this.customColor || this.color)

    applyTransformToObj(shapeGroup, conf.transform.values as MatrixSerialized)
  }

  setSelectable = (value: boolean) => {
    this.fabricObj.selectable = value
  }

  private _updateColor = (color: string) => {
    this.fabricObj.cornerColor = color
    this.fabricObj.cornerStyle = 'circle'
    this.fabricObj.transparentCorners = false
    this.fabricObj.borderColor = color
    setFillColor(this.shapeObj, color)
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
