import {
  Badge,
  Box,
  Button,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/core'
import styled from '@emotion/styled'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import { TargetKind } from 'components/Editor/lib/editor'
import { BaseBtn } from 'components/shared/BaseBtn'
import { uniq } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { AddCustomFontModal } from 'components/Editor/components/AddCustomFontModal'
import { FontStyleConfig } from 'data/fonts'
import { Font } from 'opentype.js'

export type LeftPanelFontsTabProps = {
  target: TargetKind
}

const state = observable({
  isAddingFont: false,
  replacingFontIndex: undefined as undefined | number,
  isAddingCustomFont: false,
})

export const LeftPanelFontsTab: React.FC<LeftPanelFontsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const words = style.items.words

    const fonts = store.getAvailableFonts()

    const handleCustomFontSubmit = ({
      url,
      title,
      thumbnailUrl,
    }: {
      url: string
      title: string
      thumbnailUrl: string
    }) => {
      const fontId = store.customFontIdGen.get()
      const fontStyle: FontStyleConfig = {
        fontId,
        glyphRanges: [],
        title,
        thumbnail: thumbnailUrl,
        url: url,
      }
      store.customFonts.push({
        isCustom: true,
        styles: [fontStyle],
        title,
        categories: ['custom'],
      })
    }

    return (
      <>
        <Stack spacing="0">
          <Stack direction="row">
            <InputGroup flex={1} size="md">
              <InputLeftElement children={<Icon name="search" />} />
              <Input placeholder="Find a font..." />
            </InputGroup>

            <Menu>
              <MenuButton
                marginLeft="auto"
                as={Button}
                outline="none"
                aria-label="menu"
                color="black"
                display="inline-flex"
              >
                <DotsThreeVertical size={18} />
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={() => {
                    state.isAddingCustomFont = true
                  }}
                >
                  Upload custom font...
                </MenuItem>
                <MenuItem>Reset defaults</MenuItem>
              </MenuList>
            </Menu>
          </Stack>

          <Text mb="3" mt="2" fontSize="sm" color="gray.500">
            Hint: ctrl+click to select multiple fonts.
          </Text>

          <Box mt="3">
            {fonts.map((font) => {
              const { style: fontStyle } = font
              const isSelected =
                style.items.words.fontIds.find((f) => f === fontStyle.fontId) !=
                null
              return (
                <FontButtonContainer
                  key={fontStyle.fontId}
                  aria-label={`Font ${fontStyle.title}`}
                  selected={isSelected}
                >
                  <FontButton
                    onClick={(evt) => {
                      if (evt.metaKey) {
                        style.items.words.fontIds =
                          isSelected && style.items.words.fontIds.length > 1
                            ? style.items.words.fontIds.filter(
                                (f) => f !== fontStyle.fontId
                              )
                            : uniq([
                                ...style.items.words.fontIds,
                                fontStyle.fontId,
                              ])
                      } else {
                        style.items.words.fontIds = [fontStyle.fontId]
                      }
                    }}
                  >
                    <img src={fontStyle.thumbnail} />
                    {font.font.isCustom && (
                      <Badge mr="2" ml="auto" variantColor="purple">
                        custom
                      </Badge>
                    )}
                  </FontButton>
                </FontButtonContainer>
              )
            })}
          </Box>
        </Stack>

        <AddCustomFontModal
          isOpen={state.isAddingCustomFont}
          onClose={() => {
            state.isAddingCustomFont = false
          }}
          onSubmit={handleCustomFontSubmit}
        />
      </>
    )
  }
)

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
