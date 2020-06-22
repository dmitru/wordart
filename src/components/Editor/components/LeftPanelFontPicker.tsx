import {
  Badge,
  Box,
  Button,
  IconButton,
  InputGroup,
  InputLeftElement,
  Icon,
  Text,
  Input,
  InputRightElement,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Heading,
  Stack,
} from '@chakra-ui/core'
import AutoSizer from 'react-virtualized-auto-sizer'
import styled from '@emotion/styled'
import { BaseBtn } from 'components/shared/BaseBtn'
import { observer, useLocalStore } from 'mobx-react'
import { FixedSizeList as List, ListProps } from 'react-window'
import { useStore } from 'services/root-store'
import { useEffect, useMemo } from 'react'
import { FontConfig, FontStyleConfig } from 'data/fonts'
import { uniq, flatten, capitalize } from 'lodash'
import { animateElement } from 'utils/animation'
import { SectionLabel } from 'components/Editor/components/shared'
import css from '@emotion/css'
import { FontPicker } from 'components/Editor/components/FontPicker'

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
      () => allFonts.find((f) => f.style.fontId === state.selectedFontId),
      [state.selectedFontId]
    )

    return (
      <>
        <Stack direction="row" spacing="2" display="flex">
          {showCancel && (
            <Button
              flex="1"
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
              onSelected(selectedFont.font, selectedFont.style)
            }}
            variantColor="accent"
            id="font-picker-done"
          >
            {showCancel ? 'Add this font' : 'Done'}
          </Button>
        </Stack>

        <Box display="flex" flexDirection="column" height="100%">
          {selectedFont && (
            <>
              <Box>
                <SelectedFontThumbnail mb="0" mt="4" p="3">
                  <img src={selectedFont.style.thumbnail} />
                </SelectedFontThumbnail>
              </Box>
            </>
          )}

          <Box mt="2rem" display="flex" flexDirection="column" flex="1">
            <Heading size="lg" mb="4" mt="0">
              Fonts Catalog
            </Heading>

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
