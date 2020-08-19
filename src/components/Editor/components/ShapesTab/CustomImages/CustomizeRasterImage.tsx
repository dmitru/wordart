import { Box, FormLabel, Switch } from '@chakra-ui/core'
import css from '@emotion/css'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { Slider } from 'components/shared/Slider'
import {
  loadImageUrlToCanvasCtxWithMaxSize,
  processRasterImg,
  createCanvasCtx,
  clearCanvas,
} from 'lib/wordart/canvas-utils'
import { observer, useLocalStore } from 'mobx-react'
import { useRef, useEffect } from 'react'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'

export type CustomizeRasterImageProps = {
  value: CustomizeRasterOptions
  onChange: (data: CustomizeRasterOptions) => void
}

export type CustomizeRasterOptions = {
  processedThumbnailUrl: string
  originalUrl: string
  invert: boolean
  invertColor: string
  removeLightBackground: boolean
  removeLightBackgroundThreshold: number
  removeEdges: number
}

export const CustomizeRasterImage: React.FC<CustomizeRasterImageProps> = observer(
  (props) => {
    const { value, onChange } = props
    const originalImgCanvas = useRef<HTMLCanvasElement | null>(null)

    const state = useLocalStore<CustomizeRasterOptions>(() => value)

    const updateImgPreview = (state: CustomizeRasterOptions) => {
      if (!originalImgCanvas.current) {
        return
      }
      const c = document.getElementById('preview-canvas') as
        | HTMLCanvasElement
        | undefined
      console.log('updateImgPreview', state, c, originalImgCanvas.current)
      if (!c) {
        return
      }

      const ctxOriginal = originalImgCanvas.current.getContext('2d')!

      const imageAspect = ctxOriginal.canvas.width / ctxOriginal.canvas.height

      const processCtx = (ctx: CanvasRenderingContext2D) => {
        processRasterImg(ctx.canvas, {
          edges: {
            amount: state.removeEdges,
          },
          invert: state.invert
            ? {
                color: state.invertColor,
              }
            : undefined,
          removeLightBackground: state.removeLightBackground
            ? {
                threshold: state.removeLightBackgroundThreshold,
              }
            : undefined,
        })
      }

      if (imageAspect > 1) {
        const t = 1 / imageAspect

        const ctxProcessed = createCanvasCtx({ w: c.width, h: c.height * t })
        ctxProcessed.drawImage(
          ctxOriginal.canvas,
          0,
          0,
          ctxOriginal.canvas.width,
          ctxOriginal.canvas.height,
          0,
          0,
          c.width,
          c.height * t
        )

        // console.screenshot(ctxProcessed.canvas)

        processCtx(ctxProcessed)

        // console.screenshot(ctxProcessed.canvas)

        const ctx = c.getContext('2d')!
        clearCanvas(ctx)

        ctx.drawImage(
          ctxProcessed.canvas,
          0,
          0,
          ctxProcessed.canvas.width,
          ctxProcessed.canvas.height,
          0,
          (c.height * (1 - t)) / 2,
          c.width,
          c.height * t
        )

        // console.screenshot(ctx.canvas)
      } else {
        const t = imageAspect

        const ctxProcessed = createCanvasCtx({ w: c.width * t, h: c.height })
        ctxProcessed.drawImage(
          ctxOriginal.canvas,
          0,
          0,
          ctxOriginal.canvas.width,
          ctxOriginal.canvas.height,
          0,
          0,
          c.width * t,
          c.height
        )

        // console.screenshot(ctxProcessed.canvas)

        processCtx(ctxProcessed)

        // console.screenshot(ctxProcessed.canvas)

        const ctx = c.getContext('2d')!
        clearCanvas(ctx)

        ctx.drawImage(
          ctxProcessed.canvas,
          0,
          0,
          ctxProcessed.canvas.width,
          ctxProcessed.canvas.height,
          (c.width * (1 - t)) / 2,
          0,
          c.width * t,
          c.height
        )
      }
    }

    useEffect(() => {
      if (value.originalUrl) {
        const loadOriginalImg = async () => {
          const ctxOriginal = await loadImageUrlToCanvasCtxWithMaxSize(
            value.originalUrl,
            1000
          )
          originalImgCanvas.current = ctxOriginal.canvas
          updateImgPreview(state)
        }

        loadOriginalImg()
      }
    }, [value.originalUrl])

    const updateImgPreviewThrottled = updateImgPreview

    return (
      <Box
        mt="4"
        display="flex"
        css={
          state.originalUrl
            ? undefined
            : css`
                display: none;
              `
        }
      >
        <canvas
          id="preview-canvas"
          width="300"
          height="300"
          css={css`
            background-image: url(/images/editor/transparent-bg.svg);
            background-repeat: repeat;
            background-size: 15px;
          `}
        />

        <Box mt="6" ml="5" flex="1">
          {/* <Box alignItems="center" display="flex">
            <Switch
              id="remove-bg"
              mr="2"
              isChecked={state.removeLightBackground}
              onChange={(e) => {
                state.removeLightBackground = e.target.checked
                updateImgPreviewThrottled(state)
                onChange(state)
              }}
            />
            <FormLabel mr="5" htmlFor="remove-bg">
              Remove light background
            </FormLabel>
          </Box> */}

          <Box alignItems="center" display="flex" height="40px">
            <Switch
              id="invert-bg"
              mr="2"
              isChecked={state.invert}
              onChange={(e) => {
                state.invert = e.target.checked
                updateImgPreviewThrottled(state)
                onChange(state)
              }}
            />
            <FormLabel mr="5" htmlFor="invert-bg" mb="0">
              Invert background
            </FormLabel>
            {state.invert && (
              <ColorPickerPopover
                value={state.invertColor}
                onChange={(color) => {
                  state.invertColor = color
                  updateImgPreviewThrottled(state)
                  onChange(state)
                }}
              />
            )}
          </Box>

          <Box mt="4">
            <Slider
              afterLabel="%"
              resetValue={5}
              label="Remove background threshold"
              value={state.removeLightBackgroundThreshold}
              onChange={(value) => {
                state.removeLightBackgroundThreshold = value
              }}
              onAfterChange={() => {
                updateImgPreviewThrottled(state)
                onChange(state)
              }}
              min={0}
              max={100}
              step={1}
            />
          </Box>

          <Box mt="4">
            <Slider
              afterLabel="%"
              label={
                <>
                  Detect & remove edges
                  <HelpTooltipIcon
                    label={`This option controls edges detection, it prevents placed words from crossing the detected edges. The "perfect" setting depends on the image, so you may want to try different values and re-visualize a few times before the result looks good!`}
                  />
                </>
              }
              resetValue={70}
              value={state.removeEdges}
              onChange={(value) => {
                state.removeEdges = value
              }}
              onAfterChange={() => {
                updateImgPreviewThrottled(state)
                onChange(state)
              }}
              min={0}
              max={100}
              step={1}
            />
          </Box>
        </Box>
      </Box>
    )
  }
)

CustomizeRasterImage.displayName = 'CustomizeRasterImage'
