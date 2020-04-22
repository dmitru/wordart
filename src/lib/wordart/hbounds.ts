import { sum } from 'lodash'
import * as tm from 'transformation-matrix'
import { Matrix } from 'transformation-matrix'
import {
  Rect,
  boundsForRectsNoSkew,
  applyToPointNoSkew,
  collidePointAndRect,
  areRectsIntersecting,
  transformRectNoSkew,
  multiplyNoSkew,
  randomPointInRect,
  aabbForRect,
  Point,
  multiply,
} from 'lib/wordart/geometry'
import { weightedSample } from 'lib/wordart/random-utils'

const { identity, translate, rotate, scale } = tm

export type HBounds = {
  /** Can only be translate or scale; no rotation is allowed */
  transform?: Matrix
  count: number
  level: number
  bounds: Rect
  overlappingArea: number
  overlapsShape: boolean
  children?: HBounds[]
  data?: any
}

export const mergeHBounds = (hBounds: HBounds[]): HBounds => {
  const bounds = boundsForRectsNoSkew(
    hBounds.map((hb) => hb.bounds),
    hBounds.map((hb) => hb.transform)
  )!

  return {
    level: 0,
    bounds,
    children: hBounds,
    overlapsShape: true,
    overlappingArea: sum(hBounds.map((hb) => hb.overlappingArea)),
    count: sum(hBounds.map((hb) => hb.count)),
  }
}

export const computeHBounds = (
  bounds: Rect,
  isRectIntersecting: (rect: Rect) => 'full' | 'partial' | 'none',
  minSize = 4,
  maxLevel = 5
): HBounds => {
  const computeHBoundsImpl = (bounds: Rect, level: number): HBounds => {
    const intersecting = isRectIntersecting(bounds)
    if (intersecting === 'none') {
      return {
        count: 1,
        bounds,
        level,
        overlapsShape: false,
        overlappingArea: 0,
      }
    }

    if (intersecting === 'full') {
      return {
        count: 1,
        bounds,
        level,
        overlapsShape: true,
        overlappingArea: bounds.w * bounds.h,
      }
    }

    const childrenBounds = divideBounds(bounds)
    let children =
      level > maxLevel || bounds.w < minSize || bounds.h < minSize
        ? undefined
        : childrenBounds.map((childBounds) =>
            computeHBoundsImpl(childBounds, level + 1)
          )

    return {
      bounds,
      level,
      overlapsShape: true,
      children,
      overlappingArea: sum(children?.map((child) => child.overlappingArea)),
      count: children ? sum(children.map((child) => child.count)) : 1,
    }
  }

  // const t1 = performance.now()
  const result = computeHBoundsImpl(bounds, 0)
  // const t2 = performance.now()
  // console.debug(`computeHierarchicalBounds: ${(t2 - t1).toFixed(2)}ms`)

  return result
}

export type PointAndHBoundsCollision = {
  collides: boolean
  path?: Rect[]
}

export const collidePointAndHBounds = (
  point: Point,
  hBounds: HBounds
): PointAndHBoundsCollision => {
  const pointTranslated = hBounds.transform
    ? applyToPointNoSkew(hBounds.transform, point)
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

export const collideHBounds = (
  hBounds1: HBounds,
  hBounds2: HBounds,
  padding1 = 0,
  padding2 = 0,
  maxLevel1: number = 100,
  maxLevel2: number = 100,
  minSize: number = 1,
  debug = false
): boolean => {
  // const canvas = document.createElement('canvas') as HTMLCanvasElement
  // canvas.width = hBounds1.bounds.w
  // canvas.height = hBounds1.bounds.h
  // const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  const check = (
    curHBounds1: HBounds,
    curHBounds2: HBounds,
    transform1: Matrix,
    transform2: Matrix,
    level1: number,
    level2: number
  ): boolean => {
    // console.log(level1, level2, maxLevel1, maxLevel2)
    if (!curHBounds1.overlapsShape || !curHBounds2.overlapsShape) {
      // console.log('ch1: false')
      return false
    }

    const bounds1 = curHBounds1.bounds
    const bounds2 = curHBounds2.bounds

    if (
      !areRectsIntersecting(
        transformRectNoSkew(transform1, bounds1),
        transformRectNoSkew(transform2, bounds2),
        padding1,
        padding2
      )
    ) {
      // console.log('ch3: false')
      return false
    }

    const hasChildren1 =
      curHBounds1.children != null &&
      level1 <= maxLevel1 &&
      bounds1.w >= minSize &&
      bounds1.h >= minSize

    const hasChildren2 =
      curHBounds2.children != null &&
      level2 <= maxLevel2 &&
      bounds2.w >= minSize &&
      bounds2.h >= minSize

    // invariant: both hbounds overlap shape
    if (!hasChildren1 && !hasChildren2) {
      //   // reached leaves

      //   // ctx.fillStyle = 'lime'
      //   // ctx.lineWidth = 2
      //   // ctx.strokeRect(
      //   //   curHBounds1.bounds.x,
      //   //   curHBounds1.bounds.y,
      //   //   curHBounds1.bounds.w,
      //   //   curHBounds1.bounds.h
      //   // )
      //   // drawHBounds(ctx, hBounds1)
      //   // console.screenshot(ctx.canvas, 0.3)
      if (debug) {
        console.log(
          'ch2: true',
          curHBounds1,
          curHBounds1,
          level1,
          level2,
          maxLevel1,
          maxLevel2,
          minSize,
          curHBounds1.overlapsShape,
          curHBounds2.overlapsShape,
          curHBounds1.bounds,
          curHBounds2.bounds
        )
      }
      return curHBounds1.overlapsShape && curHBounds2.overlapsShape
      // return true
    }

    if (curHBounds1.overlapsShape && !hasChildren1 && hasChildren2) {
      for (let child of curHBounds2.children!) {
        if (!child.overlapsShape) {
          continue
        }

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
          // console.log('ch4: true')
          return true
        }
      }
    }

    if (hasChildren1 && !hasChildren2 && curHBounds2.overlapsShape) {
      for (let child of curHBounds1.children!) {
        if (!child.overlapsShape) {
          continue
        }

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
          // console.log('ch5: true')
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

          if (!child1.overlapsShape || !child2.overlapsShape) {
            continue
          }

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
            // console.log('ch6: true')
            return true
          }
        }
      }
    }

    // console.log('ch7: false')
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

export const randomPointInsideHbounds = (hBounds: HBounds): Point | null => {
  const impl = (hBoundsCur: HBounds, level = 0): Point | null => {
    if (!hBoundsCur.overlapsShape) {
      return null
    }
    if (
      !hBoundsCur.children ||
      hBoundsCur.bounds.w < 2 ||
      hBoundsCur.bounds.h < 2
    ) {
      return randomPointInRect(hBoundsCur.bounds)
    }

    const candidates = hBoundsCur.children.filter((c) => c.overlappingArea > 0)
    if (candidates.length === 0) {
      return null
    }
    const childIndex = weightedSample(candidates.map((c) => c.overlappingArea))
    const child = candidates[childIndex]
    return impl(child, level + 1)
  }

  return impl(hBounds)
}

export const computeHBoundsForCanvas = ({
  srcCanvas,
  targetSize,
  invert = false,
  imgSize = 400,
  angle = 0,
  visualize = false,
  minSize = 4,
  maxLevel = 9,
}: {
  srcCanvas: HTMLCanvasElement
  targetSize: Rect
  invert?: boolean
  imgSize?: number
  angle?: number
  maxLevel?: number
  minSize?: number
  visualize?: boolean
}) => {
  const pathBboxRect = {
    x: 0,
    y: 0,
    w: srcCanvas.width,
    h: srcCanvas.height,
  }

  const aaabUnscaled = aabbForRect(rotate(angle), pathBboxRect)
  const aaabScaleFactor = imgSize / Math.max(aaabUnscaled.w, aaabUnscaled.h)

  const pathAaab = aabbForRect(multiply(rotate(angle), scale(1)), pathBboxRect)

  const scaleFactor = aaabScaleFactor

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
  ctx.drawImage(
    srcCanvas,
    0,
    0,
    srcCanvas.width,
    srcCanvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  )
  ctx.restore()

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)

  const isPointIntersectingJpg = invert
    ? (x: number, y: number): boolean => {
        const index = y * imageData.width + x
        return imageData.data[4 * index + 1] > 244
      }
    : (x: number, y: number): boolean => {
        const index = y * imageData.width + x
        return imageData.data[4 * index + 1] < 244
      }

  const isPointIntersectingPng = invert
    ? (x: number, y: number): boolean => {
        const index = y * imageData.width + x
        return (
          imageData.data[4 * index + 0] +
            imageData.data[4 * index + 1] +
            imageData.data[4 * index + 2] !=
          255
        )
      }
    : (x: number, y: number): boolean => {
        const index = y * imageData.width + x
        return imageData.data[4 * index + 3] > 128
      }

  const dx = 1

  const isRectIntersecting = (bounds: Rect): 'full' | 'partial' | 'none' => {
    const maxX = bounds.x + bounds.w
    const maxY = bounds.y + bounds.h

    let checked = 0
    let overlapping = 0

    for (let x = Math.ceil(bounds.x); x < Math.floor(maxX); x += dx) {
      for (let y = Math.ceil(bounds.y); y < Math.floor(maxY); y += dx) {
        const intersecting = isPointIntersectingJpg(x, y)
        if (intersecting) {
          overlapping += 1
        }
        checked += 1
      }
    }

    if (overlapping === 0 || checked === 0) {
      return 'none'
    }

    return checked === overlapping ? 'full' : 'partial'
  }

  // Visualize sample points
  if (visualize) {
    for (let x = 0; x < imageData.width; x += dx) {
      for (let y = 0; y < imageData.height; y += dx) {
        const intersecting = isPointIntersectingPng(x, y)
        if (intersecting) {
          ctx.fillStyle = 'yellow'
          ctx.fillRect(x, y, 2, 2)
        }
      }
    }
  }

  const hBounds = computeHBounds(
    {
      x: 0,
      y: 0,
      h: canvas.height,
      w: canvas.width,
    },
    isRectIntersecting,
    minSize,
    maxLevel
  )

  if (visualize) {
    drawHBounds(ctx, hBounds)
    console.screenshot(ctx.canvas)
  }

  hBounds.transform = multiply(
    scale(1 / aaabScaleFactor),
    translate(pathAaab.x, pathAaab.y)
  )

  return { hBounds }
}

export const computeHBoundsForPath = (
  path: opentype.Path,
  angle = 0,
  pathScale = 1,
  imgSize = 300,
  visualize = false
) => {
  // console.log('transform = ', angle, scaleFactor)

  const pathBbox = path.getBoundingBox()
  const pathBboxRect = {
    x: pathBbox.x1,
    y: pathBbox.y1,
    w: pathBbox.x2 - pathBbox.x1,
    h: pathBbox.y2 - pathBbox.y1,
  }

  const pathAaabUnscaled = aabbForRect(
    multiply(rotate(angle), scale(pathScale)),
    pathBboxRect
  )
  const pathAaabScaleFactor =
    imgSize / Math.max(pathAaabUnscaled.w, pathAaabUnscaled.h)
  const pathAaab = aabbForRect(
    multiply(rotate(angle), scale(pathScale * pathAaabScaleFactor)),
    pathBboxRect
  )

  const scaleFactor = pathScale * pathAaabScaleFactor

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
  // console.screenshot(ctx.canvas, 1)

  const isPointIntersecting = (x: number, y: number): boolean => {
    const index = y * imageData.width + x
    return imageData.data[4 * index + 3] > 128
  }

  const dx = 1

  const isRectIntersecting = (bounds: Rect): 'full' | 'partial' | 'none' => {
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

    if (overlapping === 0 || checked === 0) {
      return 'none'
    }

    return checked === overlapping ? 'full' : 'partial'
  }

  // Visualize sample points
  if (visualize) {
    for (let x = 0; x < imageData.width; x += dx) {
      for (let y = 0; y < imageData.height; y += dx) {
        const intersecting = isPointIntersecting(x, y)
        if (intersecting) {
          ctx.fillStyle = 'yellow'
          ctx.fillRect(x, y, 2, 2)
        }
      }
    }
  }

  const hBounds = computeHBounds(
    {
      x: 0,
      y: 0,
      h: canvas.height,
      w: canvas.width,
    },
    isRectIntersecting,
    4,
    7
  )

  if (visualize) {
    drawHBounds(ctx, hBounds)
    console.screenshot(ctx.canvas)
  }

  hBounds.transform = multiply(
    scale(1 / pathAaabScaleFactor),
    translate(pathAaab.x, pathAaab.y)
  )

  return { hBounds }
}

export const drawHBounds = (
  ctx: CanvasRenderingContext2D,
  hBounds: HBounds
) => {
  const drawHBoundsImpl = (hBounds: HBounds, level = 0) => {
    if (level > 9) {
      return
    }
    ctx.save()
    ctx.lineWidth = 0.5

    ctx.strokeStyle = hBounds.overlapsShape ? '#f003' : '#00f3'

    if (hBounds.transform) {
      ctx.transform(
        hBounds.transform.a,
        hBounds.transform.b,
        hBounds.transform.c,
        hBounds.transform.d,
        hBounds.transform.e,
        hBounds.transform.f
      )
    }

    // if (hBounds.overlapsShape) {
    if (!hBounds.children) {
      ctx.strokeRect(
        hBounds.bounds.x,
        hBounds.bounds.y,
        hBounds.bounds.w,
        hBounds.bounds.h
      )
    }
    // }
    // }

    if (hBounds.children) {
      hBounds.children.forEach((child) => drawHBoundsImpl(child, level + 1))
    }

    ctx.restore()
  }

  drawHBoundsImpl(hBounds)
}
