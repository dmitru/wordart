import {
  Badge,
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from '@chakra-ui/core'
import { noop } from 'lodash'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { FontPicker } from 'components/Editor/components/FontPicker/FontPicker'
import { SectionLabel } from 'components/Editor/components/shared'
import { BaseBtn } from 'components/shared/BaseBtn'
import { Button } from 'components/shared/Button'
import { FontConfig, FontStyleConfig } from 'data/fonts'
import { sortBy, capitalize } from 'lodash'
import { observer, useLocalStore } from 'mobx-react'
import { useEffect, useMemo } from 'react'
import { useStore } from 'services/root-store'
import { animateElement } from 'utils/animation'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { SelectedFontThumbnail } from 'components/Editor/components/FontPicker/components'

export type FontPickerModalProps = {
  title?: string
  isOpen: boolean
  submitText?: string
  cancelText?: string
  onSubmit: (font: FontConfig, fontStyle: FontStyleConfig) => void
  selectedFontId: string
  showCancel?: boolean
  onClose: () => void
  onHighlighted?: (font: FontConfig, fontStyle: FontStyleConfig) => void
}

export const FontPickerModal: React.FC<FontPickerModalProps> = observer(
  (props) => {
    const {
      title = 'Choose font',
      isOpen,
      cancelText = 'Cancel',
      submitText = 'Choose font',
      showCancel = true,
      selectedFontId,
      onSubmit,
      onClose,
      onHighlighted = noop,
    } = props
    const { editorPageStore: store } = useStore()

    const state = useLocalStore(() => ({
      selectedFontId: null as string | null,
    }))

    useEffect(() => {
      state.selectedFontId = selectedFontId
    }, [selectedFontId])

    const allFonts = store.getAvailableFonts()

    const selectedFont = useMemo(
      () =>
        allFonts.find((f) =>
          f.font.styles.find((s) => s.fontId === state.selectedFontId)
        ),
      [state.selectedFontId]
    )
    const selectedFontStyle = useMemo(
      () =>
        selectedFont
          ? selectedFont.font.styles.find(
              (s) => s.fontId === state.selectedFontId
            )
          : undefined,
      [selectedFont]
    )

    return (
      <>
        <Modal size="sm" isOpen={isOpen} onClose={onClose}>
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>{title}</ModalHeader>

              <ModalBody height="calc(100vh - 240px)">
                <Box display="flex" flexDirection="column" height="100%">
                  {selectedFont && (
                    <>
                      <Box>
                        {selectedFontStyle && (
                          <SelectedFontThumbnail mb="0" p="3">
                            <img src={selectedFontStyle.thumbnail} />
                          </SelectedFontThumbnail>
                        )}

                        <Box mt="3">
                          <Menu placement="bottom-start">
                            <MenuButton
                              isDisabled={selectedFont.font.styles.length < 2}
                              marginLeft="auto"
                              as={Button}
                              outline="none"
                              aria-label="menu"
                              rightIcon={<ChevronDownIcon />}
                              color="gray.600"
                              size="sm"
                              variant="ghost"
                              display="inline-flex"
                            >
                              {'Style: '}
                              {selectedFontStyle &&
                                capitalize(selectedFontStyle.fontStyle)}
                              {', '}
                              {selectedFontStyle &&
                                selectedFontStyle.fontWeight}
                            </MenuButton>

                            <MenuList>
                              {sortBy(
                                selectedFont.font.styles,
                                (fs) => fs.fontStyle,
                                (fs) => fs.fontWeight
                              ).map((style) => (
                                <MenuItem
                                  key={style.fontId}
                                  onClick={() => {
                                    state.selectedFontId = style.fontId
                                    onHighlighted(selectedFont.font, style)
                                  }}
                                >
                                  {capitalize(style.fontStyle)}
                                  {', '}
                                  {style.fontWeight}
                                </MenuItem>
                              ))}
                            </MenuList>
                          </Menu>
                        </Box>
                      </Box>
                    </>
                  )}

                  <Box
                    mt="1rem"
                    display="flex"
                    flexDirection="column"
                    flex="1"
                    borderTop="1px solid #efefef"
                  >
                    <FontPicker
                      onHighlighted={(font, fontStyle) => {
                        state.selectedFontId = fontStyle.fontId
                        if (showCancel) {
                          animateElement(
                            document.getElementById('font-picker-done')!,
                            'pulsate-fwd-subtle'
                          )
                        }
                        onHighlighted(font, fontStyle)
                      }}
                      selectedFontId={state.selectedFontId}
                    />
                  </Box>
                </Box>
              </ModalBody>

              <ModalFooter>
                <Button ml="3" variant="ghost" onClick={onClose}>
                  {cancelText}
                </Button>
                <Button
                  ml="3"
                  colorScheme="primary"
                  onClick={() => {
                    if (!selectedFont || !selectedFontStyle) {
                      return
                    }
                    onSubmit(selectedFont.font, selectedFontStyle)
                  }}
                >
                  {submitText}
                </Button>
              </ModalFooter>

              <ModalCloseButton />
            </ModalContent>
          </ModalOverlay>
        </Modal>
      </>
    )
  }
)
