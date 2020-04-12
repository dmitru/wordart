import * as opentype from 'opentype.js'
import { WordArtData } from './types'
import { fabric } from 'fabric'
import { sum } from 'lodash'

export const scratch = async (canvas: HTMLCanvasElement): Promise<void> => {
  return new Promise<void>((resolve) => {
    opentype.load('/fonts/mail-ray-stuff.ttf', (error, font) => {
      if (!font) {
        return
      }
      console.log('font = ', font)
      // @ts-ignore
      window['font'] = font

      const c = new fabric.Canvas(canvas.id, {
        preserveObjectStacking: true,
        imageSmoothingEnabled: false,
        enableRetinaScaling: false,
      })

      // const text = new fabric.Text('Hello', {
      //   left: 40,
      //   top: 40,
      //   fontSize: 250,
      // })
      // c.add(text)
      // c.renderAll()

      const ctx = c.getContext()

      const path = font.getPath('H', 40, 340, 350)
      path.draw(ctx)
      const bbox = path.getBoundingBox()

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
      const fullBounds: Rect = {
        x: bbox.x1,
        y: bbox.y1,
        width: bbox.x2 - bbox.x1,
        height: bbox.y2 - bbox.y1,
      }

      type HierarchicalBounds = {
        count: number
        level: number
        bounds: Rect
        intersects: boolean
        children?: HierarchicalBounds[]
      }

      const isRectIntersecting = (
        bounds: Rect,
        dx = 5
      ): 'full' | 'partial' | 'none' => {
        const maxX = bounds.x + bounds.width
        const maxY = bounds.y + bounds.height

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

      const divideBounds = (bounds: Rect): Rect[] => {
        const x1 = bounds.x
        const x2 = bounds.x + bounds.width
        const y1 = bounds.y
        const y2 = bounds.y + bounds.height

        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2

        const result: Rect[] = [
          {
            x: x1,
            y: y1,
            width: mx - x1,
            height: my - y1,
          },
          {
            x: mx,
            y: y1,
            width: x2 - mx,
            height: my - y1,
          },
          {
            x: x1,
            y: my,
            width: mx - x1,
            height: y2 - my,
          },
          {
            x: mx,
            y: my,
            width: x2 - mx,
            height: y2 - my,
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

        return computeHierarchicalBoundsImpl(bounds, 0)
      }

      const hierarchicalBounds = computeHierarchicalBounds(
        fullBounds,
        isRectIntersecting,
        6
      )
      console.log('hierarchicalBounds', hierarchicalBounds)

      const renderHierarchicalBounds = (
        ctx: CanvasRenderingContext2D,
        hBounds: HierarchicalBounds
      ) => {
        ctx.lineWidth = 1
        ctx.strokeStyle = 'red'

        if (hBounds.intersects) {
          ctx.strokeRect(
            hBounds.bounds.x,
            hBounds.bounds.y,
            hBounds.bounds.width,
            hBounds.bounds.height
          )
        }

        if (hBounds.children) {
          hBounds.children.forEach((child) =>
            renderHierarchicalBounds(ctx, child)
          )
        }
      }

      renderHierarchicalBounds(ctx, hierarchicalBounds)

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
    const x = Math.random() * viewBox.width
    const y = Math.random() * viewBox.height
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
export type Rect = { x: number; y: number; width: number; height: number }

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
