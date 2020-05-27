import { fabric } from 'fabric'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { color } from 'styled-system'

export const applyTransformToObj = (
  shape: fabric.Object,
  transform: MatrixSerialized
) => {
  const qr = fabric.util.qrDecompose(transform)

  shape.set({
    flipX: false,
    flipY: false,
    centeredRotation: true,
    originX: 'center',
    originY: 'center',
  })
  shape.set({ scaleX: qr.scaleX, scaleY: qr.scaleY })
  shape.setCoords()
  shape.set({
    angle: qr.angle,
  })
  shape.setCoords()
  shape.set({
    left: qr.translateX,
    top: qr.translateY,
  })

  shape.setCoords()
}

export const createMultilineFabricTextGroup = (
  text: string,
  font: opentype.Font,
  fontSize = 100,
  color: string
) => {
  const lines = text.split('\n')
  const lineObjs: fabric.Path[] = lines.map((line, index) => {
    const path = font.getPath(line, 0, 0, fontSize)
    const pathData = path.toPathData(3)

    return new fabric.Path(pathData, {
      left: 0,
      top: index * fontSize,
      originX: 'center',
      originY: 'center',
      fill: color,
    })
  })

  const group = new fabric.Group(lineObjs)
  return group
}
