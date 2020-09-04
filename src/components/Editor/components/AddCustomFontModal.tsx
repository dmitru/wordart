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
} from '@chakra-ui/core'
import css from '@emotion/css'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { parseFontFromBuffer } from 'lib/wordart/fonts'
import { observer, useLocalStore } from 'mobx-react'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'
import { arrayBufferToDataUri } from 'utils/buffers'

export type AddCustomFontModalProps = {
  isOpen: boolean
  onSubmit: (params: {
    title: string
    url: string
    thumbnailUrl: string
  }) => void
  onClose: () => void
}

type State = {
  title?: string
  url: string | null
  thumbnailUrl?: string
}

const initialState: State = {
  title: undefined,
  thumbnailUrl: undefined,
  url: null,
}

const MAX_FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024 // 5 Mb

export const AddCustomFontModal: React.FC<AddCustomFontModalProps> = observer(
  (props) => {
    const { isOpen } = props
    const {
      authStore: { profile },
    } = useStore()
    const toasts = useToasts()
    const state = useLocalStore<State>(() => initialState)

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
          try {
            const fontFile = reader.result as ArrayBuffer
            const font = parseFontFromBuffer(fontFile)
            const url = await arrayBufferToDataUri(fontFile)

            const fontTitle = font.names.fontFamily['en'] || 'Custom'
            const fontPath = font.getPath(fontTitle, 0, 0, 300)
            const bounds = fontPath.getBoundingBox()

            const canvas = createCanvas({
              w: bounds.x2 - bounds.x1,
              h: bounds.y2 - bounds.y1,
            })
            const ctx = canvas.getContext('2d')!
            ctx.translate(-bounds.x1, -bounds.y1)
            fontPath.draw(ctx)

            state.thumbnailUrl = canvas.toDataURL()
            state.url = url
            state.title = fontTitle
          } catch (error) {
            toasts.showError({
              title: 'Unsupported font file',
              description: `Please choose a *.TTF, *.OTF and *.WOFF font file`,
            })
            console.error(error)
          }
        }
        reader.readAsArrayBuffer(file)
      },
    })

    const upgradeModal = useUpgradeModal()

    return (
      <Modal isOpen={isOpen} onClose={close} size="lg">
        <ModalOverlay>
          <ModalContent maxWidth="550px">
            <ModalHeader>Upload custom font file</ModalHeader>
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
                    save designs with custom fonts.
                  </p>
                  <p>
                    Note: as a free user, you may still use custom fonts and
                    export your design, but you won't be able to save it to your
                    account.
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

              {profile && !profile.limits.canUploadCustomFonts && (
                <Alert
                  mb="6"
                  status="info"
                  variant="left-accent"
                  flexDirection="column"
                >
                  <p>
                    Please purchase one of our plans if you'd like to save
                    designs with custom fonts to your account.
                  </p>
                  <p>
                    Note: as a free user, you may still use custom fonts and
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

              <Box
                mt="4"
                css={
                  state.url
                    ? undefined
                    : css`
                        display: none;
                      `
                }
              >
                {state.thumbnailUrl && (
                  <img src={state.thumbnailUrl} width="500" height="auto" />
                )}
              </Box>

              {!state.url && (
                <Box {...getRootProps({ className: 'dropzone' })} py="4">
                  <input {...getInputProps({})} />
                  <p>
                    Click or drag font file here. Supported formats: *.TTF,
                    *.OTF and *.WOFF font files.
                  </p>
                  <Button mt="4" colorScheme="accent" size="lg">
                    Click to choose file...
                  </Button>
                </Box>
              )}
            </ModalBody>

            <ModalFooter>
              {state.url && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    state.url = null
                  }}
                >
                  Choose another file
                </Button>
              )}
              {state.url && (
                <Button
                  colorScheme="accent"
                  onClick={() => {
                    if (!state.url || !state.thumbnailUrl || !state.title) {
                      return
                    }
                    props.onSubmit({
                      title: state.title,
                      url: state.url,
                      thumbnailUrl: state.thumbnailUrl,
                    })
                    close()
                  }}
                >
                  Import font
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

AddCustomFontModal.displayName = 'AddCustomFontModal'
