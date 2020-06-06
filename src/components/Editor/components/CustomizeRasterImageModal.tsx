import {
  Box,
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { Slider } from 'components/shared/Slider'
import {
  loadImageUrlToCanvasCtxWithMaxSize,
  processRasterImg,
} from 'lib/wordart/canvas-utils'
import { observer, useLocalStore } from 'mobx-react'
import { useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'

export type CustomizeRasterImageModalProps = {
  isOpen: boolean
  value: ProcessingParams
  onSubmit: (processedThumbnailUrl: string, value: ProcessingParams) => void
  onClose: () => void
}

type ProcessingParams = {
  originalUrl: string
  invert: boolean
  invertColor: string
  removeLightBackground: number
}

export const CustomizeRasterImageModal: React.FC<CustomizeRasterImageModalProps> = observer(
  (props) => {
    const { isOpen, value } = props
    const originalImgCanvas = useRef<HTMLCanvasElement | null>(null)

    const state = useLocalStore<ProcessingParams>(() => value)

    const close = () => {
      props.onClose()
    }

    const processedImgCanvasRef = useRef<HTMLCanvasElement | null>(null)

    const updateImgPreview = (state: ProcessingParams) => {
      console.log('updateImgPreview 1')
      if (!originalImgCanvas.current) {
        return
      }
      console.log('updateImgPreview  2')
      const c = processedImgCanvasRef.current
      if (!c) {
        return
      }
      console.log('updateImgPreview 3')

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
          amount: 0,
        },
        invert: state.invert
          ? {
              color: state.invertColor,
            }
          : undefined,
        removeLightBackground: {
          threshold: state.removeLightBackground,
        },
      })
    }

    const setProcessedImgCanvasRef = (ref: HTMLCanvasElement) => {
      processedImgCanvasRef.current = ref
      if (!isOpen) {
        return
      }

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
      <Modal isOpen={isOpen} onClose={close}>
        <ModalOverlay />
        <ModalContent maxWidth="350px">
          <ModalHeader>Customize Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
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
              <canvas ref={setProcessedImgCanvasRef} width="300" height="300" />

              <Box mt="3">
                <Box>
                  <Slider
                    label="Remove light background"
                    value={state.removeLightBackground * 100}
                    onChange={(value) => {
                      state.removeLightBackground = value / 100
                      updateImgPreviewThrottled(state)
                    }}
                    onAfterChange={() => updateImgPreviewThrottled(state)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </Box>

                <Box mb="3" height="30px">
                  <Checkbox
                    mr="5"
                    isChecked={state.invert}
                    onChange={(e) => {
                      state.invert = e.target.checked
                      updateImgPreviewThrottled(state)
                    }}
                  >
                    Invert color
                  </Checkbox>
                  {state.invert && (
                    <ColorPickerPopover
                      value={state.invertColor}
                      onChange={(color) => {
                        state.invertColor = color
                        updateImgPreviewThrottled(state)
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </ModalBody>

          <ModalFooter>
            {state.originalUrl && (
              <Button
                variantColor="accent"
                onClick={() => {
                  props.onSubmit(
                    processedImgCanvasRef.current?.toDataURL()!,
                    state
                  )
                  close()
                }}
              >
                Done
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }
)

CustomizeRasterImageModal.displayName = 'CustomizeRasterImageModal'
