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
} from '@chakra-ui/core'
import css from '@emotion/css'
import { parseFontFromBuffer } from 'lib/wordart/fonts'
import { observer, useLocalStore } from 'mobx-react'
import { Font } from 'opentype.js'
import { useRef } from 'react'
import { sortBy, range } from 'lodash'
import { useDropzone } from 'react-dropzone'
import { createCanvas } from 'lib/wordart/canvas-utils'
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

export const AddCustomFontModal: React.FC<AddCustomFontModalProps> = observer(
  (props) => {
    const { isOpen } = props
    const originalImgCanvas = useRef<HTMLCanvasElement | null>(null)

    const state = useLocalStore<State>(() => initialState)

    const close = () => {
      Object.assign(state, initialState)
      props.onClose()
    }

    const { getRootProps, getInputProps } = useDropzone({
      onDropAccepted: (files) => {
        const reader = new FileReader()
        reader.onload = async () => {
          const fontFile = reader.result as ArrayBuffer
          const font = parseFontFromBuffer(fontFile)
          const url = await arrayBufferToDataUri(fontFile)

          const glyphUnicodes = sortBy(
            range(font.glyphs.length).map(
              (index) => font.glyphs.get(index).unicode
            )
          ).filter((unicode) => unicode > 0)

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
        }
        reader.readAsArrayBuffer(files[0])
      },
    })

    return (
      <Modal isOpen={isOpen} onClose={close}>
        <ModalOverlay>
          <ModalContent maxWidth="350px">
            <ModalHeader>Choose a font to upload</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
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
          </ModalContent>
        </ModalOverlay>
      </Modal>
    )
  }
)

AddCustomFontModal.displayName = 'AddCustomFontModal'
