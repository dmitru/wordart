import paper from 'paper'
import { degToRad } from 'lib/wordart/geometry'

export const generateBlobShapePathData = (params: {
  aspect: number
  color: string
  points: number
  complexity: number
}): string => {
  paper.setup(new paper.Size({ width: 1, height: 1 }))

  const angles = []
  for (
    let a = Math.random() * 360, i = 0;
    i < params.points;
    ++i, a += 360 / params.points
  ) {
    angles.push(a)
  }

  const rBase = 150
  const rVariance = (100 * params.complexity) / 100

  const ps: [number, number][] = []
  for (let i = 0; i < params.points; ++i) {
    const r = rBase + (rVariance * (Math.random() - 0.5)) / 0.5
    const x = r * Math.cos(degToRad(angles[i])) * params.aspect
    const y = r * Math.sin(degToRad(angles[i]))
    ps.push([x, y])
  }

  const path = new paper.Path({
    segments: ps,
    closed: true,
    fill: new paper.Color('black'),
  })
  path.smooth({ type: 'continuous' })
  const pathData = path.pathData

  return pathData
}
