import { fabric } from 'fabric'
import { ShapeRandomBlobConf } from 'components/Editor/shape-config'

export const generateBlobShape = (params: {
  color: string
  points: number
  complexity: number
}): fabric.Object => {
  const obj = new fabric.Ellipse({
    top: 0,
    left: 0,
    rx: 20 + Math.random() * 10,
    ry: 20 + Math.random() * 10,
    fill: params.color,
  })
  return obj
}
