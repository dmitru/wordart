import {
  Badge,
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
} from '@chakra-ui/core'
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

export type LeftPanelFontPickerProps = {
  selectedFontId: string
  showCancel?: boolean
  onCancel: () => void
  onSelected: (font: FontConfig, fontStyle: FontStyleConfig) => void
  onHighlighted: (font: FontConfig, fontStyle: FontStyleConfig) => void
}

export const LeftPanelFontPicker: React.FC<LeftPanelFontPickerProps> = observer(
  (props) => {
    const {
      showCancel = true,
      selectedFontId,
      onSelected,
      onHighlighted,
      onCancel,
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
        {/* <SectionLabel>Selected Font</SectionLabel> */}

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
                      {selectedFontStyle && selectedFontStyle.fontWeight}
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
                            console.log(state.selectedFontId, style.fontId)
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

          <Stack direction="row" spacing="2" display="flex" mt="3" mb="0">
            {showCancel && (
              <Button
                flex="1"
                variant="outline"
                onClick={() => {
                  onCancel()
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              flex="2"
              onClick={() => {
                if (!selectedFont || !selectedFontStyle) {
                  return
                }
                onSelected(selectedFont.font, selectedFontStyle)
              }}
              colorScheme="accent"
              id="font-picker-done"
            >
              {showCancel ? 'Add this font' : 'Done'}
            </Button>
          </Stack>

          <Box
            mt="1rem"
            display="flex"
            flexDirection="column"
            flex="1"
            borderTop="1px solid #efefef"
          >
            {/* <SectionLabel
              css={css`
                margin-bottom: 0;
              `}
            >
              Fonts Catalog
            </SectionLabel> */}

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
      </>
    )
  }
)
