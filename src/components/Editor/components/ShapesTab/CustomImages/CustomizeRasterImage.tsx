import { Box, FormLabel, Switch } from '@chakra-ui/core'
import css from '@emotion/css'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { Slider } from 'components/shared/Slider'
import {
  loadImageUrlToCanvasCtxWithMaxSize,
  processRasterImg,
} from 'lib/wordart/canvas-utils'
import { observer, useLocalStore } from 'mobx-react'
import { useRef } from 'react'

export type CustomizeRasterImageProps = {
  value: CustomizeRasterOptions
  onChange: (data: CustomizeRasterOptions) => void
}

export type CustomizeRasterOptions = {
  processedThumbnailUrl: string
  originalUrl: string
  removeLightBackground: boolean
  removeLightBackgroundThreshold: number
  removeEdges: number
}

export const CustomizeRasterImage: React.FC<CustomizeRasterImageProps> = observer(
  (props) => {
    const { value, onChange } = props
    const originalImgCanvas = useRef<HTMLCanvasElement | null>(null)

    const state = useLocalStore<CustomizeRasterOptions>(() => value)

    const processedImgCanvasRef = useRef<HTMLCanvasElement | null>(null)

    const updateImgPreview = (state: CustomizeRasterOptions) => {
      if (!originalImgCanvas.current) {
        return
      }
      const c = processedImgCanvasRef.current
      if (!c) {
        return
      }

      const ctx = c.getContext('2d')!
      const ctxOriginal = originalImgCanvas.current.getContext('2d')!
      ctx.drawImage(
        ctxOriginal.canvas,
        0,
        0,
        ctxOriginal.canvas.width,
        ctxOriginal.canvas.height,
        0,
        0,
        c.width,
        c.height
      )

      processRasterImg(ctx.canvas, {
        edges: {
          amount: state.removeEdges,
        },
        invert: undefined,
        removeLightBackground: state.removeLightBackground
          ? {
              threshold: state.removeLightBackgroundThreshold,
            }
          : undefined,
      })
    }

    const setProcessedImgCanvasRef = (ref: HTMLCanvasElement) => {
      processedImgCanvasRef.current = ref

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

    const updateImgPreviewThrottled = updateImgPreview

    return (
      <Box
        mt="4"
        css={
          state.originalUrl
            ? undefined
            : css`
                display: none;
              `
        }
      >
        <canvas
          ref={setProcessedImgCanvasRef}
          width="300"
          height="300"
          css={css`
            background-image: url(/images/editor/transparent-bg.svg);
            background-repeat: repeat;
            background-size: 15px;
          `}
        />

        <Box mt="6">
          <Box alignItems="center" display="flex">
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
          </Box>

          {state.removeLightBackground && (
            <Box mt="4">
              <Slider
                afterLabel="%"
                label="Remove light background"
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
          )}

          <Box mt="4">
            <Slider
              afterLabel="%"
              label={
                <>
                  Detect & remove edges
                  <HelpTooltipIcon label="This setting prevents words from crossing boundaries between areas of different colors. The right setting depends on the image, so you may want to try different values and re-visualize a few times before the result looks good!" />
                </>
              }
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
