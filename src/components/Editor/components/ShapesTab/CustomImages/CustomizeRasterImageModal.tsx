import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/core'
import { set } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import { CustomizeRasterImage } from './CustomizeRasterImage'

export type CustomizeRasterImageModalProps = {
  isOpen: boolean
  value: ProcessingParams
  onSubmit: (data: ProcessingParams) => void
  onClose: () => void
}

type ProcessingParams = {
  originalUrl: string
  processedThumbnailUrl: string
  removeLightBackground: boolean
  removeLightBackgroundThreshold: number
  removeEdges: number
  fill: 'fill' | 'invert' | 'original'
  fillColor: string
}

export const CustomizeRasterImageModal: React.FC<CustomizeRasterImageModalProps> = observer(
  (props) => {
    const state = useLocalStore<ProcessingParams>(() => props.value)

    return (
      <Modal isOpen={props.isOpen} onClose={props.onClose} autoFocus={false}>
        <ModalOverlay>
          <ModalContent maxWidth="630px" width="100%">
            <ModalHeader>Customize Image</ModalHeader>

            <ModalBody>
              <CustomizeRasterImage
                value={state}
                onChange={(data) => {
                  set(state, data)
                }}
              />
            </ModalBody>

            <ModalFooter>
              {state.originalUrl && (
                <Button
                  colorScheme="accent"
                  onClick={() => {
                    props.onSubmit(state)
                    props.onClose()
                  }}
                >
                  Done
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

CustomizeRasterImageModal.displayName = 'CustomizeRasterImageModal'
