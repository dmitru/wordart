import {
  Alert,
  Box,
  Button,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/core'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import { loadImageUrlToCanvasCtxWithMaxSize } from 'lib/wordart/canvas-utils'
import { set } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import { useDropzone } from 'react-dropzone'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'
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

const MAX_FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024 // 5 Mb

export const AddCustomImageModal: React.FC<AddCustomImageModalProps> = observer(
  (props) => {
    const { isOpen } = props
    const toasts = useToasts()

    const {
      authStore: { profile },
    } = useStore()

    const state = useLocalStore<CustomizeRasterOptions>(() => initialState)
    const upgradeModal = useUpgradeModal()

    const close = () => {
      Object.assign(state, initialState)
      props.onClose()
    }

    const { getRootProps, getInputProps } = useDropzone({
      onDropAccepted: (files) => {
        const file = files[0]

        if (file.size > MAX_FILE_SIZE_LIMIT_BYTES) {
          toasts.showWarning({
            title: 'File is too large',
            description: 'Maximum file size is 5Mb',
          })
          return
        }

        const reader = new FileReader()
        reader.onload = async () => {
          const ctxOriginal = await loadImageUrlToCanvasCtxWithMaxSize(
            reader.result as string,
            1000
          )
          state.originalUrl = ctxOriginal.canvas.toDataURL()
          state.processedThumbnailUrl = state.originalUrl
        }

        reader.readAsDataURL(file)
      },
    })

    const hasChosenImage = !!state.originalUrl

    return (
      <Modal isOpen={isOpen} onClose={close}>
        <ModalOverlay>
          <ModalContent maxWidth="550px">
            <ModalHeader>
              {hasChosenImage ? 'Customize image' : 'Choose image to upload'}
            </ModalHeader>

            <ModalBody>
              {!profile && (
                <Alert
                  mb="6"
                  status="info"
                  variant="left-accent"
                  flexDirection="column"
                >
                  <p>
                    Please create an account and purchase one of our plans to
                    save designs with custom images.
                  </p>
                  <p>
                    Note: as a free user, you may still use custom images and
                    export your designs, but you won't be able to save them to
                    your account.
                  </p>
                  <Box mt="4">
                    <Link href={Urls.signup} passHref>
                      <Button
                        as="a"
                        target="_blank"
                        colorScheme="primary"
                        onClick={() => {
                          upgradeModal.show('custom-fonts')
                        }}
                        rightIcon={<FaExternalLinkAlt />}
                      >
                        Create an account now
                      </Button>
                    </Link>
                  </Box>
                </Alert>
              )}

              {profile && !profile.limits.canUploadCustomMedia && (
                <Alert
                  mb="6"
                  status="info"
                  variant="left-accent"
                  flexDirection="column"
                >
                  <p>
                    Please purchase one of our plans if you'd like to save
                    designs with custom images to your account.
                  </p>
                  <p>
                    Note: as a free user, you may still use custom images and
                    export your designs, but you won't be able to save them to
                    your account.
                  </p>
                  <Box mt="4">
                    <Button
                      colorScheme="primary"
                      onClick={() => {
                        upgradeModal.show('custom-fonts')
                      }}
                    >
                      Upgrade now
                    </Button>
                  </Box>
                </Alert>
              )}

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
