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
import { useRef } from 'react'
import { useDropzone } from 'react-dropzone'

export type AddCustomImageModalProps = {
  isOpen: boolean
  onSubmit: (params: { thumbnailUrl: string; state: State }) => void
  onClose: () => void
}

type State = {
  originalUrl: string | null
  invert: boolean
  invertColor: string
  removeLightBackground: number
}

const initialState: State = {
  originalUrl: null,
  invert: false,
  invertColor: 'black',
  removeLightBackground: 0.95,
}

export const AddCustomImageModal: React.FC<AddCustomImageModalProps> = observer(
  (props) => {
    const { isOpen } = props
    const originalImgCanvas = useRef<HTMLCanvasElement | null>(null)

    const state = useLocalStore<State>(() => initialState)

    const close = () => {
      Object.assign(state, initialState)
      props.onClose()
    }

    const processedImgCanvasRef = useRef<HTMLCanvasElement>(null)

    const updateImgPreview = (state: State) => {
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

    const updateImgPreviewThrottled = updateImgPreview

    const { getRootProps, getInputProps } = useDropzone({
      onDropAccepted: (files) => {
        const reader = new FileReader()
        reader.onload = async () => {
          if (!processedImgCanvasRef.current) {
            return
          }
          const ctxOriginal = await loadImageUrlToCanvasCtxWithMaxSize(
            reader.result as string,
            1000
          )
          state.originalUrl = ctxOriginal.canvas.toDataURL()
          originalImgCanvas.current = ctxOriginal.canvas
          updateImgPreview(state)
        }
        reader.readAsDataURL(files[0])
      },
    })

    const hasChosenImage = !!state.originalUrl

    return (
      <Modal isOpen={isOpen} onClose={close}>
        <ModalOverlay>
          <ModalContent maxWidth="350px">
            <ModalHeader>
              {hasChosenImage ? 'Customize image' : 'Choose image to upload'}
            </ModalHeader>

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
                <canvas ref={processedImgCanvasRef} width="300" height="300" />

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

              {!state.originalUrl && (
                <Box
                  {...getRootProps({ className: 'dropzone' })}
                  py="4"
                  tabIndex={-1}
                  outline="none !important"
                >
                  <input {...getInputProps({})} />
                  <p>
                    Click or drag image files here - JPEG, PNG and SVG files are
                    supported.
                  </p>
                  <Button mt="4" colorScheme="accent" size="lg">
                    Click to choose file...
                  </Button>
                </Box>
              )}
            </ModalBody>

            <ModalFooter>
              {state.originalUrl && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    state.originalUrl = null
                  }}
                >
                  Choose another image
                </Button>
              )}
              {state.originalUrl && (
                <Button
                  colorScheme="accent"
                  onClick={() => {
                    props.onSubmit({
                      state,
                      thumbnailUrl: processedImgCanvasRef.current?.toDataURL(
                        'image/png'
                      )!,
                    })
                    close()
                  }}
                >
                  Import
                </Button>
              )}
            </ModalFooter>

            <ModalCloseButton />
          </ModalContent>
        </ModalOverlay>
      </Modal>
    )
  }
)

AddCustomImageModal.displayName = 'AddCustomImageModal'
