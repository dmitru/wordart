import { min, max } from 'lodash'
import * as tm from 'transformation-matrix'
import { Matrix } from 'transformation-matrix'

const { applyToPoint, applyToPoints } = tm

export const degToRad = (deg: number): number => (deg * Math.PI) / 180

export function applyToPointNoSkew(matrix: Matrix, point: Point): Point {
  return {
    x: matrix.a * point.x + matrix.e,
    y: matrix.d * point.y + matrix.f,
  }
}

export const multiply = (m1: Matrix, m2: Matrix): Matrix => {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  }
}

export const multiplyNoSkew = (m1: Matrix, m2: Matrix): Matrix => {
  return {
    a: m1.a * m2.a,
    c: 0,
    e: m1.a * m2.e + m1.e,
    b: 0,
    d: m1.d * m2.d,
    f: m1.d * m2.f + m1.f,
  }
}

export const spreadRect = (rect: Rect): [number, number, number, number] => [
  rect.x,
  rect.y,
  rect.w,
  rect.h,
]

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }
export type Size = { w: number; h: number }

export type PointAndHBoundsCollision = {
  collides: boolean
  path?: Rect[]
}

/**
 * Returns a padded rect - the padding is added to each side of the original rect
 */
export const padRect = (rect: Rect, paddingX = 0, paddingY?: number): Rect => ({
  x: rect.x - paddingX,
  y: rect.y - (paddingY === undefined ? paddingX : paddingY),
  w: rect.w + 2 * paddingX,
  h: rect.h + 2 * (paddingY === undefined ? paddingX : paddingY),
})

export const collidePointAndRect = (point: Point, rect: Rect): boolean => {
  if (point.x < rect.x) {
    return false
  }
  if (point.y < rect.y) {
    return false
  }
  if (point.x > rect.x + rect.w) {
    return false
  }
  if (point.y > rect.y + rect.h) {
    return false
  }
  return true
}

export const divideBounds = (bounds: Rect): Rect[] => {
  const x1 = bounds.x
  const x2 = bounds.x + bounds.w
  const y1 = bounds.y
  const y2 = bounds.y + bounds.h

  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2

  const result: Rect[] = [
    {
      x: x1,
      y: y1,
      w: mx - x1,
      h: my - y1,
    },
    {
      x: mx,
      y: y1,
      w: x2 - mx,
      h: my - y1,
    },
    {
      x: x1,
      y: my,
      w: mx - x1,
      h: y2 - my,
    },
    {
      x: mx,
      y: my,
      w: x2 - mx,
      h: y2 - my,
    },
  ]

  return result
}

export const isRectInsideRect = (rect1: Rect, rect2: Rect): boolean => {
  const padding1 = 0
  const padding2 = 0
  const minX1 = rect1.x - padding1
  const maxX1 = rect1.x + rect1.w + padding1

  const minX2 = rect2.x - padding2
  const maxX2 = rect2.x + rect2.w + padding2

  const minY1 = rect1.y - padding1
  const maxY1 = rect1.y + rect1.h + padding1

  const minY2 = rect2.y - padding2
  const maxY2 = rect2.y + rect2.h + padding2

  return minX1 >= minX2 && maxX1 <= maxX2 && minY1 >= minY2 && maxY1 <= maxY2
}

export const areRectsIntersecting = (
  rect1: Rect,
  rect2: Rect,
  padding1 = 0,
  padding2 = 0
) => {
  const minX1 = rect1.x - padding1
  const maxX1 = rect1.x + rect1.w + padding1

  const minX2 = rect2.x - padding2
  const maxX2 = rect2.x + rect2.w + padding2

  const minY1 = rect1.y - padding1
  const maxY1 = rect1.y + rect1.h + padding1

  const minY2 = rect2.y - padding2
  const maxY2 = rect2.y + rect2.h + padding2

  // If one rectangle is above other
  if (minY1 >= maxY2 || minY2 >= maxY1) {
    return false
  }

  // If one rectangle is on left side of the other
  if (minX1 >= maxX2 || minX2 >= maxX1) {
    return false
  }

  return true
}

export const transformRectNoSkew = (transform: Matrix, rect: Rect): Rect => {
  const br = applyToPointNoSkew(transform, {
    x: rect.x + rect.w,
    y: rect.y + rect.h,
  })
  const tl = applyToPointNoSkew(transform, rect)
  return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y }
}

export const transformRect = (transform: Matrix, rect: Rect): Rect => {
  const br = applyToPoint(transform, {
    x: rect.x + rect.w,
    y: rect.y + rect.h,
  })
  const tl = applyToPoint(transform, rect)
  return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y }
}

export const rectToPoints = (rect: Rect): Point[] => {
  const tl = {
    x: rect.x,
    y: rect.y,
  }
  const tr = {
    x: rect.x + rect.w,
    y: rect.y,
  }
  const bl = {
    x: rect.x,
    y: rect.y + rect.h,
  }
  const br = {
    x: rect.x + rect.w,
    y: rect.y + rect.h,
  }
  return [tl, tr, bl, br]
}

export const scaleRect = (
  rect: Rect,
  scaleFactorX: number,
  scaleFactorY?: number
): Rect => ({
  x: rect.x * scaleFactorX,
  y: rect.y * (scaleFactorY || scaleFactorX),
  w: rect.w * scaleFactorX,
  h: rect.h * (scaleFactorY || scaleFactorX),
})

export const aabbForRect = (transform: Matrix, rect: Rect): Rect => {
  const points = rectToPoints(rect)
  const pointsTransformed = applyToPoints(transform, points)
  const x1 = min(pointsTransformed.map((p) => p.x))!
  const x2 = max(pointsTransformed.map((p) => p.x))!
  const y1 = min(pointsTransformed.map((p) => p.y))!
  const y2 = max(pointsTransformed.map((p) => p.y))!
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

export const boundsForRectsNoSkew = (
  rects: Rect[],
  transforms?: (Matrix | undefined)[]
): Rect | undefined => {
  if (rects.length === 0) {
    return undefined
  }

  const rectsTransformed = transforms
    ? rects.map((rect, index) =>
        transforms[index] != null
          ? transformRectNoSkew(transforms[index]!, rect)
          : rect
      )
    : rects

  let xMin = rectsTransformed[0].x
  let xMax = rectsTransformed[0].x + rectsTransformed[0].w
  let yMin = rectsTransformed[0].y
  let yMax = rectsTransformed[0].y + rectsTransformed[0].h

  const len = rectsTransformed.length
  for (let i = 1; i < len; ++i) {
    const { x, y, w: w, h: h } = rectsTransformed[i]
    if (x < xMin) {
      xMin = x
    }
    if (y < yMin) {
      yMin = y
    }
    if (x + w > xMax) {
      xMax = x + w
    }
    if (y + h > yMax) {
      yMax = y + h
    }
  }

  return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin }
}

export const randomPointInRect = (rect: Rect, pad = 0): Point => {
  return {
    x: rect.x - pad + Math.random() * (rect.w + 2 * pad),
    y: rect.y - pad + Math.random() * (rect.h + 2 * pad),
  }
}
