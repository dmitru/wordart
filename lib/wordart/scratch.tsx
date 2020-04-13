import * as opentype from 'opentype.js'
import { WordArtData } from './types'
import { fabric } from 'fabric'
import { sum } from 'lodash'
import 'lib/wordart/console-extensions'

export const scratch = async (canvas: HTMLCanvasElement): Promise<void> => {
  return new Promise<void>((resolve) => {
    opentype.load('/fonts/mail-ray-stuff.ttf', (error, font) => {
      if (!font) {
        return
      }
      console.log('font = ', font)
      // @ts-ignore
      window['font'] = font

      // const c = new fabric.Canvas(canvas.id, {
      //   preserveObjectStacking: true,
      //   imageSmoothingEnabled: false,
      //   enableRetinaScaling: false,
      // })

      // const text = new fabric.Text('Hello', {
      //   left: 40,
      //   top: 40,
      //   fontSize: 250,
      // })
      // c.add(text)
      // c.renderAll()

      const ctx = canvas.getContext('2d')!

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

      // Build hierarchical bounding boxes

      type HierarchicalBounds = {
        count: number
        level: number
        bounds: Rect
        intersects: boolean
        children?: HierarchicalBounds[]
        transform?: {
          x: number
          y: number
        }
      }

      const divideBounds = (bounds: Rect): Rect[] => {
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

      const computeHierarchicalBounds = (
        bounds: Rect,
        isRectIntersecting: (rect: Rect) => 'full' | 'partial' | 'none',
        maxLevel = 3
      ): HierarchicalBounds => {
        const computeHierarchicalBoundsImpl = (
          bounds: Rect,
          level: number
        ): HierarchicalBounds => {
          const intersecting = isRectIntersecting(bounds)
          if (intersecting === 'none') {
            return {
              count: 1,
              bounds,
              level,
              intersects: false,
            }
          }

          if (intersecting === 'full') {
            return {
              count: 1,
              bounds,
              level,
              intersects: true,
            }
          }

          const childrenBounds = divideBounds(bounds)
          const children =
            level >= maxLevel
              ? undefined
              : childrenBounds.map((childBounds) =>
                  computeHierarchicalBoundsImpl(childBounds, level + 1)
                )
          return {
            bounds,
            level,
            intersects: true,
            children,
            count: children ? sum(children.map((child) => child.count)) : 1,
          }
        }

        const t1 = performance.now()
        const result = computeHierarchicalBoundsImpl(bounds, 0)
        const t2 = performance.now()
        console.debug(`computeHierarchicalBounds: ${(t2 - t1).toFixed(2)}ms`)

        return result
      }

      const renderHierarchicalBounds = (
        ctx: CanvasRenderingContext2D,
        hBounds: HierarchicalBounds
      ) => {
        ctx.save()
        ctx.lineWidth = 1
        ctx.strokeStyle = 'red'

        if (hBounds.transform) {
          ctx.translate(hBounds.transform.x, hBounds.transform.y)
        }

        if (hBounds.intersects) {
          ctx.strokeRect(
            hBounds.bounds.x,
            hBounds.bounds.y,
            hBounds.bounds.w,
            hBounds.bounds.h
          )
        }

        if (hBounds.children) {
          hBounds.children.forEach((child) =>
            renderHierarchicalBounds(ctx, child)
          )
        }

        ctx.restore()
      }

      type PointHierarchicalBoundsCollisionInfo = {
        collides: boolean
        path?: Rect[]
      }

      const isWithinRect = (point: Point, rect: Rect): boolean => {
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

      const collidePointAndHierarchicalBounds = (
        point: Point,
        hBounds: HierarchicalBounds
      ): PointHierarchicalBoundsCollisionInfo => {
        const pointTranslated = hBounds.transform
          ? {
              x: point.x - hBounds.transform.x,
              y: point.y - hBounds.transform.y,
            }
          : point

        if (!isWithinRect(pointTranslated, hBounds.bounds)) {
          return { collides: false }
        }

        const check = (
          curHBounds: HierarchicalBounds,
          curPath: Rect[]
        ): PointHierarchicalBoundsCollisionInfo => {
          if (!curHBounds.intersects) {
            return { collides: false, path: [...curPath, curHBounds.bounds] }
          }

          // curHBounds.intersects === true
          if (!curHBounds.children) {
            // reached the leaf
            return { collides: true, path: [...curPath, curHBounds.bounds] }
          }

          for (let child of curHBounds.children) {
            if (!isWithinRect(pointTranslated, child.bounds)) {
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

      const computeHierarchicalBoundsForPath = (path: opentype.Path) => {
        const pathBbox = path.getBoundingBox()

        const canvas = document.createElement('canvas') as HTMLCanvasElement
        canvas.width = pathBbox.x2 - pathBbox.x1
        canvas.height = pathBbox.y2 - pathBbox.y1

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.translate(-pathBbox.x1, -pathBbox.y1)

        path.draw(ctx)
        console.screenshot(ctx.canvas)

        const imageData = ctx.getImageData(
          0,
          0,
          ctx.canvas.width,
          ctx.canvas.height
        )

        const isPointIntersecting = (x: number, y: number): boolean => {
          const index = Math.round(y) * imageData.width + Math.round(x)
          return imageData.data[4 * index + 3] > 0
        }

        const isRectIntersecting = (
          bounds: Rect,
          dx = 5
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
        const hBounds = computeHierarchicalBounds(bounds, isRectIntersecting, 7)

        hBounds.transform = { x: pathBbox.x1, y: pathBbox.y1 }

        return { hBounds }
      }

      const path1 = font.getPath('OUT', 100, 520, 590)
      const hBounds1 = computeHierarchicalBoundsForPath(path1).hBounds

      const path2 = font.getPath('Li', 0, 0, 170)
      const hBounds2 = computeHierarchicalBoundsForPath(path2).hBounds

      path1.draw(ctx)
      renderHierarchicalBounds(ctx, hBounds1)

      let x = 0,
        y = 0

      canvas.addEventListener('mousemove', (e) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        x = e.offsetX
        y = e.offsetY

        path1.draw(ctx)
        renderHierarchicalBounds(ctx, hBounds1)

        ctx.save()
        ctx.translate(x, y)
        path2.draw(ctx)
        renderHierarchicalBounds(ctx, hBounds2)
        ctx.restore()

        const collisionInfo = collidePointAndHierarchicalBounds(
          { x, y },
          hBounds1
        )

        ctx.save()
        if (collisionInfo.collides && hBounds1.transform) {
          ctx.translate(hBounds1.transform.x, hBounds1.transform.y)
          if (collisionInfo.path) {
            ctx.fillStyle = '#0f09'
            const rect = collisionInfo.path[collisionInfo.path.length - 1]
            ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
          }
        }
        ctx.restore()

        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.fillStyle = collisionInfo.collides ? 'lime' : 'teal'
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fill()
      })

      // const viewBox: Rect = { x: 0, y: 0, width: 600, height: 600 }

      // const renderData = generateWordArt({ canvas, data, font, viewBox })
      // resolve(renderData)
      resolve()
    })
  })
}

const generateWordArt = (args: {
  canvas: HTMLCanvasElement
  data: WordArtData
  font: opentype.Font
  viewBox: Rect
}): WordArtRenderData => {
  const { data, font, viewBox } = args

  // 1. Generate glyphs for words
  const outlines: {
    [glyphId in GlyphId]: GlyphPath
  } = {}

  const words = data.words.map((word) => {
    const otGlyphs = font.stringToGlyphs(word.text)

    let curX = 0

    let widths: number[] = []
    otGlyphs.forEach((glyph) => {
      // @ts-ignore
      const glyphId = `${glyph.index}`
      const path = glyph.getPath()
      widths.push(50)
      if (!outlines[glyphId]) {
        outlines[glyphId] = path.toPathData(0)
      }
    })

    const glyphs: WordArtRenderWord['glyphs'] = otGlyphs.map((glyph, index) => {
      curX += widths[index]
      return {
        // @ts-ignore
        id: `${glyph.index}`,
        x: curX,
      }
    })

    return {
      id: word.id,
      text: word.text,
      glyphs,
    }
  })

  // 2. Place words in a circle
  const tags: WordArtRenderTag[] = []
  for (let i = 0; i < 100; ++i) {
    const word = sample(words)
    const x = Math.random() * viewBox.w
    const y = Math.random() * viewBox.h
    const scale = 0.2 + Math.random() * 2

    const tag: WordArtRenderTag = {
      wordId: word.id,
      transform: [x, y, scale, 0],
    }

    tags.push(tag)
  }

  return {
    viewBox,
    words,
    outlines,
    tags,
  }
}

export function sample<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }

export type WordArtRenderData = {
  viewBox: Rect
  words: WordArtRenderWord[]
  outlines: {
    [glyphid in GlyphId]: GlyphPath
  }
  tags: WordArtRenderTag[]
}

export type WordArtRenderTag = {
  wordId: WordArtRenderWordId
  /** x, y, scale, rotation */
  transform: number[]
}

export type GlyphPath = string

export type WordArtRenderWord = {
  id: WordArtRenderWordId
  text: string
  glyphs: { id: GlyphId; x: number }[]
}

export type GlyphId = string

export type GlyphRenderData = {}

export type WordArtRenderWordId = number

const data: WordArtData = {
  words: [
    {
      id: 1,
      text: 'Hello',
    },
    {
      id: 2,
      text: 'universe',
    },
    {
      id: 3,
      text: 'success',
    },
    {
      id: 4,
      text: 'discipline',
    },
    {
      id: 5,
      text: 'satisfaction',
    },
  ],
}
