import { sum } from 'lodash'
import {
  Matrix,
  applyToPoint,
  identity,
  translate,
} from 'transformation-matrix'

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
  transform: Matrix
  count: number
  level: number
  bounds: Rect
  overlapsShape: boolean
  children?: HBounds[]
}

export const mergeHBounds = (hBounds: HBounds[]): HBounds => {
  const bounds = boundsForRects(hBounds.map((hb) => hb.bounds))!

  return {
    transform: identity(),
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
  const computeHBoundsImpl = (bounds: Rect, level: number): HBounds => {
    const intersecting = isRectIntersecting(bounds)
    if (intersecting === 'none') {
      return {
        transform: identity(),
        count: 1,
        bounds,
        level,
        overlapsShape: false,
      }
    }

    if (intersecting === 'full') {
      return {
        transform: identity(),
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
      transform: identity(),
      bounds,
      level,
      overlapsShape: true,
      children,
      count: children ? sum(children.map((child) => child.count)) : 1,
    }
  }

  const t1 = performance.now()
  const result = computeHBoundsImpl(bounds, 0)
  const t2 = performance.now()
  console.debug(`computeHierarchicalBounds: ${(t2 - t1).toFixed(2)}ms`)

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

  const t1 = performance.now()
  const result = check(hBounds, [hBounds.bounds])
  const t2 = performance.now()
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
  hBounds2: HBounds
): HBoundsCollisionInfo => {
  if (
    !areRectsIntersecting(
      transformRect(hBounds1.bounds, hBounds1.transform),
      transformRect(hBounds2.bounds, hBounds2.transform)
    )
  ) {
    return { collides: false }
  }

  const check = (
    curHBounds1: HBounds,
    curHBounds2: HBounds,
    curPath1: Rect[],
    curPath2: Rect[]
  ): HBoundsCollisionInfo => {
    // return { collides: true, path1: curPath1, path2: curPath2 }
    if (!curHBounds1.overlapsShape || !curHBounds2.overlapsShape) {
      return {
        collides: false,
        path1: [...curPath1, curHBounds1.bounds],
        path2: [...curPath2, curHBounds2.bounds],
      }
    }

    // invatiant: both hbounds overlap shape
    if (!curHBounds1.children && !curHBounds2.children) {
      // reached leaves
      return {
        collides: true,
        path1: [...curPath1, curHBounds1.bounds],
        path2: [...curPath2, curHBounds2.bounds],
      }
    }

    if (curHBounds2.children && !curHBounds1.children) {
      for (let child of curHBounds2.children) {
        if (
          !areRectsIntersecting(
            transformRect(hBounds1.bounds, hBounds1.transform),
            transformRect(child.bounds, hBounds2.transform)
          )
        ) {
          continue
        }

        const childCheckResult = check(curHBounds1, child, curPath1, [
          ...curPath2,
          child.bounds,
        ])
        if (childCheckResult.collides) {
          return childCheckResult
        }
      }
    }

    if (curHBounds1.children && !curHBounds2.children) {
      for (let child of curHBounds1.children) {
        if (
          !areRectsIntersecting(
            transformRect(child.bounds, hBounds1.transform),
            transformRect(hBounds2.bounds, hBounds2.transform)
          )
        ) {
          continue
        }

        const childCheckResult = check(
          child,
          hBounds2,
          [...curPath1, child.bounds],
          curPath2
        )
        if (childCheckResult.collides) {
          return childCheckResult
        }
      }
    }

    if (curHBounds1.children && curHBounds2.children)
      for (let child1 of curHBounds1.children) {
        for (let child2 of curHBounds2.children) {
          if (
            !areRectsIntersecting(
              transformRect(child1.bounds, hBounds1.transform),
              transformRect(child2.bounds, hBounds2.transform)
            )
          ) {
            continue
          }

          const childCheckResult = check(
            child1,
            child2,
            [...curPath1, child1.bounds],
            [...curPath2, child2.bounds]
          )
          if (childCheckResult.collides) {
            return childCheckResult
          }
        }
      }

    return {
      collides: false,
      path1: [...curPath1, curHBounds1.bounds],
      path2: [...curPath2, curHBounds2.bounds],
    }
  }

  const t1 = performance.now()
  const result = check(hBounds1, hBounds2, [hBounds1.bounds], [hBounds2.bounds])
  const t2 = performance.now()
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

export const transformRect = (rect: Rect, transform?: Matrix): Rect =>
  transform
    ? {
        x: rect.x + transform.e,
        y: rect.y + transform.f,
        w: rect.w,
        h: rect.h,
      }
    : rect

export const areRectsIntersecting = (rect1: Rect, rect2: Rect) => {
  const minX1 = rect1.x
  const maxX1 = rect1.x + rect1.w

  const minX2 = rect2.x
  const maxX2 = rect2.x + rect2.w

  const minY1 = rect1.y
  const maxY1 = rect1.y + rect1.h

  const minY2 = rect2.y
  const maxY2 = rect2.y + rect2.h

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

export const boundsForRects = (rects: Rect[]): Rect | undefined => {
  if (rects.length === 0) {
    return undefined
  }
  let xMin = rects[0].x
  let xMax = rects[0].x + rects[0].w
  let yMin = rects[0].y
  let yMax = rects[0].y + rects[0].h

  const len = rects.length
  for (let i = 1; i < len; ++i) {
    const { x, y, w, h } = rects[i]
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

export const computeHBoundsForPath = (path: opentype.Path) => {
  const pathBbox = path.getBoundingBox()

  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = pathBbox.x2 - pathBbox.x1
  canvas.height = pathBbox.y2 - pathBbox.y1

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.translate(-pathBbox.x1, -pathBbox.y1)

  path.draw(ctx)
  console.screenshot(ctx.canvas)

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

  const isPointIntersecting = (x: number, y: number): boolean => {
    const index = Math.round(y) * imageData.width + Math.round(x)
    return imageData.data[4 * index + 3] > 0
  }

  const isRectIntersecting = (
    bounds: Rect,
    dx = 2
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

  const bounds: Rect = {
    x: 0,
    y: 0,
    w: pathBbox.x2 - pathBbox.x1,
    h: pathBbox.y2 - pathBbox.y1,
  }
  const hBounds = computeHBounds(bounds, isRectIntersecting)

  hBounds.transform = translate(pathBbox.x1, pathBbox.y1)

  return { hBounds }
}
