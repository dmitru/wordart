import React, { useEffect, useRef } from 'react'
import { Layout } from 'components/layout'
import styled from '@emotion/styled'

import 'lib/wordart/console-extensions'
import {
  loadImageUrlToCanvasCtx,
  Dimensions,
  clearCanvas,
  createCanvasCtxCopy,
  createCanvasCtx,
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

      const imgSize = 360
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
        for (let r = 1; r < bounds.h; ++r) {
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
          for (let c = bounds.w - 1; c >= 0; --c) {
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
        // console.log(img, dpH, dpL, dpR)

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
        // console.log(res, maxArea)
        return res
      }

      // // @ts-ignore
      // window['getLargestRect'] = getLargestRect
      // const imgData = new ImageData(3, 3)
      // // imgData.data[0] = 0
      // // imgData.data[1] = 0
      // // imgData.data[2] = 0
      // // imgData.data[3] = 0
      // imgData.data[4 * 4 + 3] = 255
      // // imgData.data[5] = 0
      // // imgData.data[6] = 0
      // // imgData.data[7] = 0
      // // imgData.data[8] = 0
      // getLargestRect(imgData, { x: 0, y: 0, w: 3, h: 3 })

      // if (1 < 2) {
      //   return
      // }

      const word = 'Victory'
      const wordPath = fonts[0].getPath(word, 0, 0, 100)
      const wordPathBounds = wordPath.getBoundingBox()

      type PlacedWord = {
        path: Path
        transform: paper.Matrix
      }
      const placedWords: PlacedWord[] = []

      const nIter = 400
      const t1 = performance.now()
      let scale = 1

      for (let i = 0; i < nIter; ++i) {
        let scale = 1 - (0.5 * i) / nIter
        // let size = 60
        // if (i < 100) {
        //   size = 150
        // }
        // if (i < 200) {
        //   size = 220
        // }
        // if (i < 300) {
        //   size = 300
        // } else {
        //   size = 360
        // }
        let size = imgSize
        // const scratchCtx = createCanvasCtx({ w: size, h: size })
        // scratchCtx.drawImage(shapeCtx.canvas, 0, 0, size, size)
        const imgData = shapeCtx.getImageData(0, 0, size, size)
        // shapeCtx.imageSmoothingEnabled = false
        const imgDataBounds: Rect = {
          x: 0,
          y: 0,
          w: size,
          h: size,
        }
        const largestRect = imageProcessor.findLargestRect(
          imgData,
          imgDataBounds
        )

        const wordPathSize: Dimensions = {
          w: wordPathBounds.x2 - wordPathBounds.x1,
          h: wordPathBounds.y2 - wordPathBounds.y1,
        }
        // const largestRect = getLargestRect(imgData, imgDataBounds)
        // console.log(largestRect, getLargestRect(imgData, imgDataBounds))

        let pathScale = Math.min(
          (largestRect.w / wordPathSize.w) * scale,
          (largestRect.h / wordPathSize.h) * scale
        )

        const maxMinDim = 60
        const minDim = Math.min(wordPathSize.w, wordPathSize.h) * pathScale
        if (minDim > maxMinDim) {
          pathScale *= maxMinDim / minDim
        }

        const dx = Math.max(largestRect.w - pathScale * wordPathSize.w, 0)
        const dy = Math.max(largestRect.h - pathScale * wordPathSize.h, 0)

        shapeCtx.save()

        shapeCtx.fillStyle = 'black'
        shapeCtx.globalCompositeOperation = 'destination-out'

        const tx = largestRect.x + Math.random() * dx
        const ty =
          largestRect.y +
          largestRect.h -
          pathScale * wordPathBounds.y2 -
          Math.random() * dy
        shapeCtx.scale(imgSize / size, imgSize / size)
        shapeCtx.translate(tx, ty)
        shapeCtx.scale(pathScale, pathScale)

        if (pathScale * Math.max(largestRect.w, largestRect.h) >= 0.25) {
          // shapeCtx.shadowBlur = 1.1
          // shapeCtx.shadowColor = 'red'
          wordPath.draw(shapeCtx)

          placedWords.push({
            path: wordPath,
            transform: new paper.Matrix()
              .scale(imgSize / size)
              .translate(tx, ty)
              .scale(pathScale),
          })
        } else {
          // console.log('i', i)
          shapeCtx.fillRect(
            wordPathBounds.x1,
            wordPathBounds.y1,
            wordPathBounds.x2 - wordPathBounds.x1,
            wordPathBounds.y2 - wordPathBounds.y1
          )
        }
        // shapeCtx.fillRect(...spreadRect(largestRect))

        shapeCtx.restore()
      }
      const t2 = performance.now()

      console.screenshot(shapeCtx.canvas, 1)
      console.log(
        `Placed ${placedWords.length} words; Finished ${nIter} iterations in ${(
          (t2 - t1) /
          1000
        ).toFixed(2)} s, ${((t2 - t1) / nIter).toFixed(3)}ms / iter`
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
