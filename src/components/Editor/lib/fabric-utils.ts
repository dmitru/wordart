import { fabric } from 'fabric'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { roundFloat } from 'utils/round-float'

export const getObjTransformMatrix = (obj: fabric.Object): MatrixSerialized => {
  return (obj.calcTransformMatrix() || []).map((n: number) =>
    roundFloat(n, 3)
  ) as MatrixSerialized
}

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

export const loadObjFromImg = (url: string) =>
  new Promise<fabric.Image>((resolve) =>
    fabric.Image.fromURL(url, (oImg) => {
      resolve(oImg)
    })
  )

export const loadObjFromSvg = (url: string) =>
  new Promise<fabric.Object>((resolve) =>
    fabric.loadSVGFromURL(url, (objects, options) => {
      var obj = fabric.util.groupSVGElements(objects, options)
      resolve(obj)
    })
  )

export const cloneObj = (obj: fabric.Object, attrs: string[] = ['id']) =>
  new Promise<fabric.Object>((r) =>
    obj!.clone((obj: fabric.Object) => r(obj), attrs)
  )

export const cloneObjAsImage = (obj: fabric.Object) =>
  new Promise<fabric.Image>((r) =>
    obj!.cloneAsImage((obj: fabric.Object) => r(obj as fabric.Image))
  )

export const objAsCanvasElement = (obj: fabric.Object): HTMLCanvasElement =>
  (obj.toCanvasElement() as any) as HTMLCanvasElement

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
