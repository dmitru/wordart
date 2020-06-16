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
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List, ListProps } from 'react-window'
import { AnimatePresence, motion } from 'framer-motion'
import styled from '@emotion/styled'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import { TargetKind } from 'components/Editor/lib/editor'
import { BaseBtn } from 'components/shared/BaseBtn'
import { uniq } from 'lodash'
import { observable } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import { useStore } from 'services/root-store'
import { AddCustomFontModal } from 'components/Editor/components/AddCustomFontModal'
import { FontStyleConfig } from 'data/fonts'
import { Font } from 'opentype.js'
import { FontPicker } from 'components/Editor/components/FontPicker'

export type LeftPanelFontsTabProps = {
  target: TargetKind
}

export const LeftPanelFontsTab: React.FC<LeftPanelFontsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]

    const state = useLocalStore(() => ({
      view: 'font-list' as 'font-list' | 'choose-font',
      isAddingFont: false,
      replacingFontIndex: undefined as undefined | number,
      isAddingCustomFont: false,
    }))

    const fontIds = new Set(style.items.words.fontIds)
    const allFonts = store.getAvailableFonts()
    const fonts = allFonts.filter((f) => fontIds.has(f.style.fontId))

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
        title,
        fontStyle: 'regular',
        fontWeight: '400',
        thumbnail: thumbnailUrl,
        url: url,
      }
      store.customFonts.push({
        popularity: 999,
        isCustom: true,
        styles: [fontStyle],
        title,
        subsets: ['custom'],
        categories: ['custom'],
      })
    }

    return (
      <>
        <Box
          position="relative"
          overflow="auto"
          overflowX="hidden"
          width="100%"
          height="calc(100vh - 255px)"
        >
          <AnimatePresence initial={false}>
            {state.view === 'font-list' && (
              <motion.div
                key="view"
                initial={{ x: -355, y: 0, opacity: 0 }}
                transition={{ ease: 'easeInOut', duration: 0.2 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                exit={{ x: -355, y: 0, opacity: 0 }}
              >
                <Box position="absolute" width="100%">
                  <Box>
                    <Button
                      mr="3"
                      onClick={() => {
                        state.view = 'choose-font'
                      }}
                    >
                      Add another font
                    </Button>

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

                    <Box mt="6" mb="6">
                      {fonts.map((font) => {
                        return (
                          <FontListButton
                            key={font.style.fontId}
                            thumbnail={font.style.thumbnail}
                            title={font.font.title}
                            isCustom={font.font.isCustom}
                            containerProps={{
                              onClick: () => {
                                state.view = 'choose-font'
                              },
                            }}
                          />
                        )
                      })}
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            )}

            {state.view === 'choose-font' && (
              <motion.div
                key="customize"
                initial={{ x: 355, y: 0, opacity: 0 }}
                transition={{ ease: 'easeInOut', duration: 0.2 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                exit={{ x: 355, y: 0, opacity: 0 }}
              >
                <Box position="absolute" width="100%">
                  <Button
                    onClick={() => {
                      state.view = 'font-list'
                    }}
                    variantColor="green"
                  >
                    Done
                  </Button>

                  <FontPicker
                    selectedFontId={style.items.words.fontIds[0]}
                    onSelected={(font, fontStyle) => {
                      style.items.words.fontIds.push([fontStyle.fontId])
                    }}
                  />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

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
