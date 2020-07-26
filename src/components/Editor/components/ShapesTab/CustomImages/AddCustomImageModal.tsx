import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/core'
import { loadImageUrlToCanvasCtxWithMaxSize } from 'lib/wordart/canvas-utils'
import { set } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import { useDropzone } from 'react-dropzone'
import {
  CustomizeRasterImage,
  CustomizeRasterOptions,
} from './CustomizeRasterImage'

export type AddCustomImageModalProps = {
  isOpen: boolean
  onSubmit: (data: CustomizeRasterOptions) => void
  onClose: () => void
}

const initialState: CustomizeRasterOptions = {
  processedThumbnailUrl: '',
  originalUrl: '',
  removeLightBackgroundThreshold: 5,
  removeLightBackground: false,
  removeEdges: 70,
}

export const AddCustomImageModal: React.FC<AddCustomImageModalProps> = observer(
  (props) => {
    const { isOpen } = props

    const state = useLocalStore<CustomizeRasterOptions>(() => initialState)

    const close = () => {
      Object.assign(state, initialState)
      props.onClose()
    }

    const { getRootProps, getInputProps } = useDropzone({
      onDropAccepted: (files) => {
        const reader = new FileReader()
        reader.onload = async () => {
          const ctxOriginal = await loadImageUrlToCanvasCtxWithMaxSize(
            reader.result as string,
            1000
          )
          state.originalUrl = ctxOriginal.canvas.toDataURL()
          state.processedThumbnailUrl = state.originalUrl

          // state.removeLightBackground = !hasTransparentPixels(
          //   ctxOriginal.canvas
          // )
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
              {!state.originalUrl && (
                <Box
                  {...getRootProps({ className: 'dropzone' })}
                  py="4"
                  tabIndex={-1}
                  outline="none !important"
                >
                  <input {...getInputProps({})} />
                  <p>
                    Click or drag image files here - JPEG and PNG files are
                    supported.
                  </p>
                  <Text color="gray.500">File size limit: 5 Mb.</Text>
                  <Button mt="4" colorScheme="accent" size="lg">
                    Click to choose file...
                  </Button>
                </Box>
              )}

              {state.originalUrl && state.processedThumbnailUrl && (
                <CustomizeRasterImage
                  value={state}
                  onChange={(data) => {
                    set(state, data)
                  }}
                />
              )}
            </ModalBody>

            <ModalFooter>
              {state.originalUrl && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    state.originalUrl = ''
                    state.processedThumbnailUrl = ''
                  }}
                >
                  Choose another image
                </Button>
              )}
              {state.originalUrl && (
                <Button
                  colorScheme="accent"
                  onClick={() => {
                    props.onSubmit(state)
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
