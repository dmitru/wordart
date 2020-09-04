import React, { useState } from 'react'
import {
  Alert,
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
  Input,
} from '@chakra-ui/core'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import { loadImageUrlToCanvasCtxWithMaxSize } from 'lib/wordart/canvas-utils'
import { set } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import { useDropzone } from 'react-dropzone'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import Link from 'next/link'
import { Api } from 'services/api/api'
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

const initialState: CustomizeRasterOptions & { importImageUrl: string } = {
  processedThumbnailUrl: '',
  originalUrl: '',
  importImageUrl: '',
  removeLightBackgroundThreshold: 50,
  removeLightBackground: true,
  removeEdges: 70,
  fill: 'original',
  fillColor: '#a33',
}

const MAX_FILE_SIZE_LIMIT_BYTES = 8 * 1024 * 1024 // 8 Mb

export const AddCustomImageModal: React.FC<AddCustomImageModalProps> = observer(
  (props) => {
    const { isOpen } = props
    const toasts = useToasts()

    const {
      authStore: { profile },
    } = useStore()

    const state = useLocalStore(() => initialState)
    const upgradeModal = useUpgradeModal()

    const close = () => {
      Object.assign(state, initialState)
      props.onClose()
    }

    const handleImageUrl = async (url: string) => {
      const ctxOriginal = await loadImageUrlToCanvasCtxWithMaxSize(url, 1600)
      state.originalUrl = ctxOriginal.canvas.toDataURL()
      state.processedThumbnailUrl = state.originalUrl
    }

    const { getRootProps, getInputProps } = useDropzone({
      onDropAccepted: (files) => {
        const file = files[0]

        if (file.size > MAX_FILE_SIZE_LIMIT_BYTES) {
          toasts.showWarning({
            title: 'File is too large',
            description: 'Maximum file size is 8Mb',
          })
          return
        }

        const lowercaseName = file.name.toLowerCase()
        console.log('file: ', file, name, lowercaseName)
        if (
          !lowercaseName.endsWith('jpeg') &&
          !lowercaseName.endsWith('jpg') &&
          !lowercaseName.endsWith('png')
        ) {
          toasts.showWarning({
            title: 'Please upload an image file',
            description: 'JPEG and PNG images are supported',
          })
          return
        }

        const reader = new FileReader()
        reader.onload = async () => {
          try {
            await handleImageUrl(reader.result as string)
          } catch (error) {
            toasts.showError({
              title: 'Please upload an image file',
              description: 'JPEG and PNG images are supported',
            })
            console.error(error)
          }
        }

        reader.readAsDataURL(file)
      },
    })

    const hasChosenImage = !!state.originalUrl

    const [isImportingImage, setIsImportingImage] = useState(false)

    const handleImportFromUrl = async () => {
      try {
        setIsImportingImage(true)
        const result = await Api.extractor.imageFromUrl({
          url: state.importImageUrl.trim(),
        })
        await handleImageUrl(result.data)
        state.importImageUrl = ''
      } catch (error) {
        toasts.showError({
          title: 'Could not load the image',
          description:
            'Please check that the link is to a JPEG or PNG images smaller than 5Mb',
        })
      } finally {
        setIsImportingImage(false)
      }
    }

    return (
      <Modal isOpen={isOpen} onClose={close} trapFocus={false}>
        <ModalOverlay>
          <ModalContent maxWidth="630px">
            <ModalHeader>
              {hasChosenImage ? 'Customize Image' : 'Choose Image to Upload'}
            </ModalHeader>

            <ModalBody>
              {!hasChosenImage && (
                <Text color="gray.500">
                  JPEG and PNG files are supported. Maximum file size is 8Mb.
                </Text>
              )}
              {!hasChosenImage && (
                <Box mt="4">
                  <Text mb="3">Paste an image URL below:</Text>
                  <Box flexDirection="row" display="flex">
                    <Input
                      placeholder="Image URL, https://images.com/example.jpg"
                      value={state.importImageUrl}
                      onChange={(evt: any) => {
                        state.importImageUrl = evt.target.value
                      }}
                    />
                    <Button
                      colorScheme="accent"
                      isDisabled={!state.importImageUrl}
                      isLoading={isImportingImage}
                      onClick={handleImportFromUrl}
                    >
                      Import
                    </Button>
                  </Box>
                </Box>
              )}
              {/* {profile && !profile.limits.canUploadCustomImages && !state.originalUrl && (
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
              )} */}

              {profile &&
                !profile.limits.canUploadCustomImages &&
                !state.originalUrl && (
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
                      download your designs, but you won't be able to save these
                      designs to your account.
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
                  mt="6"
                  tabIndex={-1}
                  outline="none !important"
                >
                  <input {...getInputProps({})} />
                  <Text mb="0">Or choose a file from your computer.</Text>
                  <Button mt="3" colorScheme="accent" size="lg">
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
