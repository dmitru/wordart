import { fabric } from 'fabric'
import { MatrixSerialized } from 'services/api/persisted/v1'

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
