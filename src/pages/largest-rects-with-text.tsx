import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import styled from '@emotion/styled'

import 'lib/wordart/console-extensions'
import {
  loadImageUrlToCanvasCtx,
  Dimensions,
  clearCanvas,
  createCanvasCtxCopy,
} from 'lib/wordart/canvas-utils'
import { getWasmModule } from 'lib/wordart/wasm/wasm-module'
import { ImageProcessorWasm } from 'lib/wordart/wasm/image-processor-wasm'
import { drawHBoundsWasm } from 'lib/wordart/wasm/hbounds'
import { Rect, spreadRect } from 'lib/wordart/geometry'
import { loadFont } from 'lib/wordart/fonts'
import { Path } from 'opentype.js'
import paper from 'paper'

const IMAGES = [
  '/images/cat.png',
  '/images/number_six.png',
  '/images/darth_vader.jpg',
  '/images/beatles.jpg',
]

const FONT_NAMES = [
  'mountains-of-christmas_bold.ttf',
  'mail-ray-stuff.ttf',
  'Verona-Xlight.ttf',
]

const scratch = (canvas: HTMLCanvasElement) => {
  paper.setup(canvas)

  const onKeyDown = async (e: KeyboardEvent) => {
    const fonts = await Promise.all(
      FONT_NAMES.map((fontName) => loadFont(`/fonts/${fontName}`))
    )

    const wasm = await getWasmModule()
    const imageProcessor = new ImageProcessorWasm(wasm)

    const key = e.key
    if (['1', '2', '3', '4'].includes(key) && !e.shiftKey) {
      const imageIndex = parseInt(key) - 1
      const imageUrl = IMAGES[imageIndex]

      const imgSize = 300
      const imageSize: Dimensions = {
        w: imgSize,
        h: imgSize,
      }

      const shapeCtx = await loadImageUrlToCanvasCtx(
        imageUrl,
        imageSize.w,
        imageSize.h
      )
      console.screenshot(shapeCtx.canvas)

      // https://stackoverflow.com/questions/11481868/largest-rectangle-of-1s-in-2d-binary-matrix
      const getLargestRect = (imgData: ImageData, bounds: Rect): Rect => {
        const imgWidth = imgData.width
        const imgHeight = imgData.height
        const img = imgData.data

        const x1 = bounds.x
        const y1 = bounds.y

        const dpWidth = bounds.w
        const dpSize = bounds.w * bounds.h
        const dpH = new Uint32Array(dpSize).fill(0)
        const dpL = new Uint32Array(dpSize).fill(0)
        const dpR = new Uint32Array(dpSize).fill(0)

        const dpIndex = (row: number, col: number) => col + row * dpWidth
        const imgPixelIndex = (row: number, col: number) =>
          4 * (x1 + col + (y1 + row) * imgWidth)

        // Init DP
        for (let c = 0; c < bounds.w; ++c) {
          dpH[dpIndex(0, c)] = 0
        }
        // Compute DP
        for (let r = 0; r < bounds.h; ++r) {
          dpL[dpIndex(r, 0)] = 0
          let p = 0
          for (let c = 0; c < bounds.w; ++c) {
            const alpha = img[imgPixelIndex(r - 1, c) + 3]
            const isEmpty = alpha < 128
            if (isEmpty) {
              dpH[dpIndex(r, c)] = 0
              dpL[dpIndex(r, c)] = c - p
              p = c
            } else {
              dpH[dpIndex(r, c)] = dpH[dpIndex(r - 1, c)] + 1
              dpL[dpIndex(r, c)] = Math.min(dpL[dpIndex(r - 1, c)], c - p)
            }
          }

          p = bounds.w - 1

          dpR[dpIndex(r, bounds.w - 1)] = 0
          for (let c = bounds.w; c >= 0; --c) {
            const alpha = img[imgPixelIndex(r - 1, c) + 3]
            const isEmpty = alpha < 128
            if (isEmpty) {
              dpR[dpIndex(r, c)] = p - c
              p = c
            } else {
              dpR[dpIndex(r, c)] = Math.min(dpR[dpIndex(r - 1, c)], p - c)
            }
          }
        }

        // Compute answer
        let maxArea = 0
        let maxR = 0
        let maxC = 0
        for (let r = 0; r < bounds.h; ++r) {
          for (let c = 0; c < bounds.w; ++c) {
            const candidate =
              dpH[dpIndex(r, c)] * (dpL[dpIndex(r, c)] + dpR[dpIndex(r, c)] - 1)
            if (candidate > maxArea) {
              maxArea = candidate
              maxR = r
              maxC = c
            }
          }
        }

        const resX1 = bounds.x + maxC - dpL[dpIndex(maxR, maxC)]
        const resX2 = bounds.x + maxC + dpR[dpIndex(maxR, maxC)]
        const resY1 = bounds.y + maxR - dpH[dpIndex(maxR, maxC)]
        const resY2 = bounds.y + maxR

        const res: Rect = {
          x: resX1,
          y: resY1,
          w: resX2 - resX1,
          h: resY2 - resY1,
        }
        return res
      }

      const word = 'WORD'
      const wordPath = fonts[0].getPath(word, 0, 0, 100)
      const wordPathBounds = wordPath.getBoundingBox()

      type PlacedWord = {
        path: Path
        transform: paper.Matrix
      }
      const placedWords: PlacedWord[] = []

      const nIter = 700
      const t1 = performance.now()
      for (let i = 0; i < nIter; ++i) {
        const imgData = shapeCtx.getImageData(
          0,
          0,
          shapeCtx.canvas.width,
          shapeCtx.canvas.height
        )
        const imgDataBounds: Rect = {
          x: 0,
          y: 0,
          w: imgData.width,
          h: imgData.height,
        }
        const largestRect = getLargestRect(imgData, imgDataBounds)

        const pathScale = Math.min(
          largestRect.w / (wordPathBounds.x2 - wordPathBounds.x1),
          largestRect.h / (wordPathBounds.y2 - wordPathBounds.y1)
        )

        const dx = Math.max(
          largestRect.w - pathScale * (wordPathBounds.x2 - wordPathBounds.x1),
          0
        )
        const dy = Math.max(
          largestRect.h - pathScale * (wordPathBounds.y2 - wordPathBounds.y1),
          0
        )

        shapeCtx.save()

        shapeCtx.fillStyle = 'black'
        shapeCtx.globalCompositeOperation = 'destination-out'

        const tx = largestRect.x + Math.random() * dx
        const ty =
          largestRect.y +
          largestRect.h -
          wordPathBounds.y2 * pathScale -
          Math.random() * dy
        shapeCtx.translate(tx, ty)
        shapeCtx.scale(pathScale, pathScale)
        wordPath.draw(shapeCtx)

        placedWords.push({
          path: wordPath,
          transform: new paper.Matrix().translate(tx, ty).scale(pathScale),
        })
        // shapeCtx.fillRect(...spreadRect(largestRect))

        shapeCtx.restore()
      }
      const t2 = performance.now()

      console.screenshot(shapeCtx.canvas, 1)
      console.log(
        `Finished ${nIter} iterations in ${((t2 - t1) / 1000).toFixed(2)} s, ${(
          (t2 - t1) /
          nIter
        ).toFixed(3)}ms / iter`
      )

      const shapeItemRaster: paper.Raster = await new Promise<paper.Raster>(
        (resolve) => {
          const raster = new paper.Raster(imageUrl)
          raster.onLoad = () => {
            resolve(raster)
          }
        }
      )

      paper.project.clear()
      const symDef = new paper.SymbolDefinition(
        paper.Path.create(wordPath.toPathData(3)),
        true
      )
      symDef.item.fillColor = new paper.Color('black')
      symDef.item.fillRule = 'evenodd'

      const placedItems = placedWords.map((w) => {
        const { transform } = w
        const item = symDef.place()
        item.transform(transform)
        item.transform(new paper.Matrix().scale(2.5))
        return item
      })
    }
  }
  document.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

const ImageToShapesScratch = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      return scratch(canvasRef.current)
    }
  }, [canvasRef.current])

  return (
    <Layout>
      Hit 1, 2, 3 or 4
      <Canvas width={1100} height={1100} ref={canvasRef} id="scene" />
    </Layout>
  )
}

const Canvas = styled.canvas`
  border: 1px solid black;
`

export default ImageToShapesScratch
