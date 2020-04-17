import { sum, min, max } from 'lodash'
import * as tm from 'transformation-matrix'
import { Matrix } from 'transformation-matrix'

const {
  applyToPoint,
  identity,
  translate,
  applyToPoints,

  rotate,
  scale,
} = tm

export const multiply = (m1: Matrix, m2: Matrix): Matrix => {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    b: m1.b * m2.a + m1.d * m2.b,
    d: m1.b * m2.c + m1.d * m2.d,
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

export type Transform = {
  x: number
  y: number
  scale: number
}

export const mkTransform = (x: number, y: number, scale = 1): Transform => ({
  x,
  y,
  scale,
})

export type HBounds = {
  /** Can only be translate or scale; no rotation is allowed */
  transform?: Matrix
  count: number
  level: number
  bounds: Rect
  overlapsShape: boolean
  children?: HBounds[]
}

export const mergeHBounds = (hBounds: HBounds[]): HBounds => {
  const bounds = boundsForRects(
    hBounds.map((hb) => hb.bounds),
    hBounds.map((hb) => hb.transform)
  )!

  return {
    level: 0,
    bounds,
    children: hBounds,
    overlapsShape: true,
    count: sum(hBounds.map((hb) => hb.count)),
  }
}

export const computeHBounds = (
  bounds: Rect,
  isRectIntersecting: (rect: Rect) => 'full' | 'partial' | 'none',
  maxLevel = 5
): HBounds => {
  // @ts-ignore
  window['tm'] = tm // eslint-disable-line

  const computeHBoundsImpl = (bounds: Rect, level: number): HBounds => {
    const intersecting = isRectIntersecting(bounds)
    if (intersecting === 'none') {
      return {
        count: 1,
        bounds,
        level,
        overlapsShape: false,
      }
    }

    if (intersecting === 'full') {
      return {
        count: 1,
        bounds,
        level,
        overlapsShape: true,
      }
    }

    const childrenBounds = divideBounds(bounds)
    const children =
      level >= maxLevel
        ? undefined
        : childrenBounds.map((childBounds) =>
            computeHBoundsImpl(childBounds, level + 1)
          )
    return {
      bounds,
      level,
      overlapsShape: true,
      children,
      count: children ? sum(children.map((child) => child.count)) : 1,
    }
  }

  // const t1 = performance.now()
  const result = computeHBoundsImpl(bounds, 0)
  // const t2 = performance.now()
  // console.debug('computeHierarchicalBounds')
  // console.debug(`computeHierarchicalBounds: ${(t2 - t1).toFixed(2)}ms`)

  return result
}

export const renderHBounds = (
  ctx: CanvasRenderingContext2D,
  hBounds: HBounds
) => {
  ctx.save()
  ctx.lineWidth = 1
  ctx.strokeStyle = hBounds.children ? 'red' : 'yellow'

  if (hBounds.transform) {
    ctx.setTransform(hBounds.transform)
  }

  if (hBounds.overlapsShape) {
    ctx.strokeRect(
      hBounds.bounds.x,
      hBounds.bounds.y,
      hBounds.bounds.w,
      hBounds.bounds.h
    )
  }

  if (hBounds.children) {
    hBounds.children.forEach((child) => renderHBounds(ctx, child))
  }

  ctx.restore()
}

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }

export type PointAndHBoundsCollision = {
  collides: boolean
  path?: Rect[]
}

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

export const collidePointAndHBounds = (
  point: Point,
  hBounds: HBounds
): PointAndHBoundsCollision => {
  const pointTranslated = hBounds.transform
    ? applyToPoint(hBounds.transform, point)
    : point

  if (!collidePointAndRect(pointTranslated, hBounds.bounds)) {
    return { collides: false }
  }

  const check = (
    curHBounds: HBounds,
    curPath: Rect[]
  ): PointAndHBoundsCollision => {
    if (!curHBounds.overlapsShape) {
      return { collides: false, path: [...curPath, curHBounds.bounds] }
    }

    // curHBounds.intersects === true
    if (!curHBounds.children) {
      // reached the leaf
      return { collides: true, path: [...curPath, curHBounds.bounds] }
    }

    for (let child of curHBounds.children) {
      if (!collidePointAndRect(pointTranslated, child.bounds)) {
        continue
      }

      const childCheckResult = check(child, [...curPath, child.bounds])
      if (childCheckResult.collides) {
        return childCheckResult
      }
    }

    return { collides: false, path: [...curPath, curHBounds.bounds] }
  }

  // const t1 = performance.now()
  const result = check(hBounds, [hBounds.bounds])
  // const t2 = performance.now()
  // console.debug(
  //   `collidePointAndHierarchicalBounds: ${(t2 - t1).toFixed(2)}ms`
  // )
  return result
}

export type HBoundsCollisionInfo = {
  collides: boolean
  path1?: Rect[]
  path2?: Rect[]
}

export const collideHBounds = (
  hBounds1: HBounds,
  hBounds2: HBounds,
  padding1 = 0,
  padding2 = 0,
  maxLevel1: number | undefined = undefined,
  maxLevel2: number | undefined = undefined,
  minSize: number | undefined = undefined
): boolean => {
  const check = (
    curHBounds1: HBounds,
    curHBounds2: HBounds,
    transform1: Matrix,
    transform2: Matrix,
    level1: number,
    level2: number
  ): boolean => {
    if (!curHBounds1.overlapsShape || !curHBounds2.overlapsShape) {
      return false
    }

    const bounds1 = curHBounds1.bounds
    const bounds2 = curHBounds2.bounds

    const hasChildren1 =
      curHBounds1.children &&
      (!maxLevel1 || level1 <= maxLevel1) &&
      (minSize == null || Math.max(bounds1.w, bounds1.h) >= minSize)
    const hasChildren2 =
      curHBounds2.children &&
      (!maxLevel2 || level2 <= maxLevel2) &&
      (minSize == null || Math.max(bounds2.w, bounds2.h) >= minSize)

    // invatiant: both hbounds overlap shape
    if (!hasChildren1 && !hasChildren2) {
      // reached leaves
      return true
    }

    if (
      !areRectsIntersecting(
        transformRect(transform1, bounds1),
        transformRect(transform2, bounds2),
        padding1,
        padding2
      )
    ) {
      return false
    }

    if (!hasChildren1 && hasChildren2) {
      for (let child of curHBounds2.children!) {
        const child2Transform = child.transform
          ? multiplyNoSkew(transform2, child.transform)
          : transform2

        const childCheckResult = check(
          curHBounds1,
          child,
          transform1,
          child2Transform,
          level1,
          level2 + 1
        )
        if (childCheckResult) {
          return true
        }
      }
    }

    if (hasChildren1 && !hasChildren2) {
      for (let child of curHBounds1.children!) {
        const child1Transform = child.transform
          ? multiplyNoSkew(transform1, child.transform)
          : transform1

        const childCheckResult = check(
          child,
          curHBounds2,
          child1Transform,
          transform2,
          level1 + 1,
          level2
        )
        if (childCheckResult) {
          return true
        }
      }
    }

    if (hasChildren1 && hasChildren2) {
      const ch1Cnt = curHBounds1.children!.length
      const ch2Cnt = curHBounds2.children!.length

      for (let i1 = 0; i1 < ch1Cnt; ++i1) {
        const child1 = curHBounds1.children![i1]
        const child1Transform = child1.transform
          ? multiplyNoSkew(transform1, child1.transform)
          : transform1

        for (let i2 = 0; i2 < ch2Cnt; ++i2) {
          const child2 = curHBounds2.children![i2]
          const child2Transform = child2.transform
            ? multiplyNoSkew(transform2, child2.transform)
            : transform2

          const childCheckResult = check(
            child1,
            child2,
            child1Transform,
            child2Transform,
            level1 + 1,
            level2 + 1
          )
          if (childCheckResult) {
            return true
          }
        }
      }
    }

    return false
  }

  // const t1 = performance.now()
  const result = check(
    hBounds1,
    hBounds2,
    hBounds1.transform || identity(),
    hBounds2.transform || identity(),
    1,
    1
  )
  // const t2 = performance.now()
  // console.debug(`collideHierarchicalBounds: ${(t2 - t1).toFixed(2)}ms`)
  return result
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

export const transformRect = (transform: Matrix, rect: Rect): Rect => {
  const br = applyToPoint(transform, {
    x: rect.x + rect.w,
    y: rect.y + rect.h,
  })
  const tl = applyToPoint(transform, {
    x: rect.x,
    y: rect.y,
  })
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

export const aabbForRect = (transform: Matrix, rect: Rect): Rect => {
  const points = rectToPoints(rect)
  const pointsTransformed = applyToPoints(transform, points)
  const x1 = min(pointsTransformed.map((p) => p.x))!
  const x2 = max(pointsTransformed.map((p) => p.x))!
  const y1 = min(pointsTransformed.map((p) => p.y))!
  const y2 = max(pointsTransformed.map((p) => p.y))!
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

export const boundsForRects = (
  rects: Rect[],
  transforms?: (Matrix | undefined)[]
): Rect | undefined => {
  if (rects.length === 0) {
    return undefined
  }

  const rectsTransformed = transforms
    ? rects.map((rect, index) =>
        transforms[index] != null
          ? transformRect(transforms[index]!, rect)
          : rect
      )
    : rects

  let xMin = rectsTransformed[0].x
  let xMax = rectsTransformed[0].x + rectsTransformed[0].w
  let yMin = rectsTransformed[0].y
  let yMax = rectsTransformed[0].y + rectsTransformed[0].h

  const len = rectsTransformed.length
  for (let i = 1; i < len; ++i) {
    const { x, y, w, h } = rectsTransformed[i]
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

export const computeHBoundsForPath = (
  path: opentype.Path,
  angle = 0,
  scaleFactor = 1
) => {
  // console.log('transform = ', angle, scaleFactor)

  const pathBbox = path.getBoundingBox()
  const pathBboxRect = {
    x: pathBbox.x1,
    y: pathBbox.y1,
    w: pathBbox.x2 - pathBbox.x1,
    h: pathBbox.y2 - pathBbox.y1,
  }

  const pathAaab = aabbForRect(
    multiply(rotate(angle), scale(scaleFactor)),
    pathBboxRect
  )

  const pathAaabTransform = multiply(
    multiply(translate(-pathAaab.x, -pathAaab.y), rotate(angle)),
    scale(scaleFactor)
  )

  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = pathAaab.w
  canvas.height = pathAaab.h
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.save()
  ctx.setTransform(pathAaabTransform)
  path.draw(ctx)
  ctx.restore()

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

  const isPointIntersecting = (x: number, y: number): boolean => {
    const index = y * imageData.width + x
    return imageData.data[4 * index + 3] > 0
  }

  const isRectIntersecting = (
    bounds: Rect,
    dx = 1
  ): 'full' | 'partial' | 'none' => {
    const maxX = bounds.x + bounds.w
    const maxY = bounds.y + bounds.h

    let checked = 0
    let overlapping = 0

    for (let x = Math.ceil(bounds.x); x < Math.floor(maxX); x += dx) {
      for (let y = Math.ceil(bounds.y); y < Math.floor(maxY); y += dx) {
        const intersecting = isPointIntersecting(x, y)
        if (intersecting) {
          overlapping += 1
        }
        checked += 1
      }
    }

    if (overlapping === 0) {
      return 'none'
    }

    return checked === overlapping ? 'full' : 'partial'
  }

  // Visualize sample points
  // for (let x = 0; x < imageData.width; x += 5) {
  //   for (let y = 0; y < imageData.height; y += 5) {
  //     const intersecting = isPointIntersecting(x, y)
  //     if (intersecting) {
  //       ctx.fillStyle = 'yellow'
  //       ctx.fillRect(x, y, 2, 2)
  //     }
  //   }
  // }

  const hBounds = computeHBounds(
    {
      x: 0,
      y: 0,
      h: canvas.height,
      w: canvas.width,
    },
    isRectIntersecting,
    12
  )
  // renderHBounds(ctx, hBounds)

  // console.screenshot(ctx.canvas)

  hBounds.transform = translate(pathAaab.x, pathAaab.y)

  return { hBounds }
}
