import {
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
} from '@chakra-ui/core'
import styled from '@emotion/styled'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import { TargetKind } from 'components/Editor/lib/editor'
import { BaseBtn } from 'components/shared/BaseBtn'
import { uniq } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'

export type LeftPanelFontsTabProps = {
  target: TargetKind
}

const FontDeleteButton = styled(IconButton)``

const FontButton = styled(BaseBtn)`
  border: none;
  flex: 1;
  display: inline-flex;
  height: 38px;

  img {
    height: 30px;
    margin: 0;
    object-fit: contain;
  }
`
FontButton.defaultProps = {
  pr: '2',
  py: '1',
}

const FontButtonContainer = styled(Box)<{ selected?: boolean }>`
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

const state = observable({
  isAddingFont: false,
  replacingFontIndex: undefined as undefined | number,
})

const Toolbar = styled(Box)``

export const LeftPanelFontsTab: React.FC<LeftPanelFontsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styles[target]
    const words = style.words

    const fonts = store.getAvailableFonts()

    return (
      <>
        <Stack spacing="0">
          <Stack direction="row">
            <InputGroup flex={1} size="md">
              <InputLeftElement children={<Icon name="search" />} />
              <Input placeholder="Filter..." />
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
                <MenuItem>Upload custom font...</MenuItem>
                <MenuItem>Reset defaults</MenuItem>
              </MenuList>
            </Menu>
          </Stack>

          <Box mt="3">
            {fonts.map((font) => {
              const { style: fontStyle } = font
              const isSelected =
                style.words.fontIds.find((f) => f === fontStyle.fontId) != null
              return (
                <FontButtonContainer
                  key={fontStyle.fontId}
                  aria-label={`Font ${fontStyle.title}`}
                  selected={isSelected}
                >
                  <FontButton
                    onClick={(evt) => {
                      if (evt.metaKey) {
                        style.words.fontIds =
                          isSelected && style.words.fontIds.length > 1
                            ? style.words.fontIds.filter(
                                (f) => f !== fontStyle.fontId
                              )
                            : uniq([...style.words.fontIds, fontStyle.fontId])
                      } else {
                        style.words.fontIds = [fontStyle.fontId]
                      }
                    }}
                  >
                    <img src={fontStyle.thumbnail} />
                  </FontButton>
                </FontButtonContainer>
              )
            })}
          </Box>
        </Stack>
      </>
    )
  }
)
