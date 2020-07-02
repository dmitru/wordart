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
import { FontPicker } from 'components/Editor/components/FontPicker'
import { SectionLabel } from 'components/Editor/components/shared'
import { BaseBtn } from 'components/shared/BaseBtn'
import { Button } from 'components/shared/Button'
import { FontConfig, FontStyleConfig } from 'data/fonts'
import { sortBy, capitalize } from 'lodash'
import { observer, useLocalStore } from 'mobx-react'
import { useEffect, useMemo } from 'react'
import { useStore } from 'services/root-store'
import { animateElement } from 'utils/animation'

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
                  <Menu>
                    <MenuButton
                      isDisabled={selectedFont.font.styles.length < 2}
                      marginLeft="auto"
                      as={Button}
                      outline="none"
                      aria-label="menu"
                      rightIcon="chevron-down"
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

                    <MenuList zIndex={100} placement="bottom-start">
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
                if (!selectedFont) {
                  return
                }
                onSelected(selectedFont.font, selectedFontStyle)
              }}
              variantColor="accent"
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

export type FontListButtonProps = {
  title: string
  thumbnail: string
  isCustom?: boolean
  isSelected?: boolean
  containerProps?: React.HTMLAttributes<HTMLDivElement>
}

export const FontListButton: React.FC<FontListButtonProps> = ({
  title,
  isCustom,
  isSelected,
  thumbnail,
  containerProps = {},
}) => {
  return (
    <FontButtonContainer
      aria-label={`Font ${title}`}
      selected={isSelected}
      {...containerProps}
    >
      <FontButton>
        <img src={thumbnail} />
        {isCustom && (
          <Badge mr="2" ml="auto" variantColor="purple">
            custom
          </Badge>
        )}
      </FontButton>
    </FontButtonContainer>
  )
}

const Toolbar = styled(Box)``

const FontDeleteButton = styled(IconButton)``

const FontButton = styled(BaseBtn)`
  border: none;
  flex: 1;
  display: inline-flex;
  align-items: center;
  height: 38px;

  img {
    max-width: 270px;
    height: 30px;
    margin: 0;
    object-fit: contain;
  }
`

const SelectedFontThumbnail = styled(Box)`
  border: none;
  flex: 1;
  display: block;
  align-items: center;
  width: 100%;

  border-radius: 4px;
  box-shadow: 0 0 4px 0 #0004;

  img {
    max-width: 270px;
    height: 50px;
    margin: 0;
    object-fit: contain;
  }
`

const FontButtonContainer = styled(Box)<{ theme: any; selected?: boolean }>`
  ${FontDeleteButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  transition: 0.1s background;

  ${(p) => (p.selected ? `background: ${p.theme.colors.blue['100']};` : '')}

  &:hover {
    background: ${(p) =>
      p.selected
        ? `${p.theme.colors.blue['50']}`
        : p.theme.colors.blackAlpha['50']};
    ${FontDeleteButton} {
      opacity: 1;
    }
  }
`
FontButtonContainer.defaultProps = {
  display: 'flex',
  alignItems: 'center',
}
