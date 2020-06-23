import {
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  Icon,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  TagLabel,
} from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import { AddCustomFontModal } from 'components/Editor/components/AddCustomFontModal'
import { TargetKind } from 'components/Editor/lib/editor'
import { FontStyleConfig } from 'data/fonts'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from 'services/root-store'
import { BaseBtn } from 'components/shared/BaseBtn'
import { observer, useLocalStore } from 'mobx-react'
import { SectionLabel } from 'components/Editor/components/shared'
import { keyBy, uniq } from 'lodash'
import { LeftPanelFontPicker } from 'components/Editor/components/LeftPanelFontPicker'

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

    const allFonts = store.getAvailableFonts()
    const fontsById = keyBy(allFonts, (f) => f.style.fontId)
    const fonts = style.items.words.fontIds.map((fontId) => fontsById[fontId])

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
          overflow="hidden"
          width="100%"
          height="calc(100vh - 50px)"
          px="3"
          py="3"
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
                  <SectionLabel>Selected Fonts</SectionLabel>
                  <Box
                    mt="3"
                    mb="6"
                    p="3"
                    css={css`
                      width: 340px;
                      border-radius: 4px;
                      box-shadow: 0 0 4px 0 #0004;
                    `}
                  >
                    {fonts.map((font, index) => {
                      return (
                        <FontListButton
                          key={font.style.fontId}
                          thumbnail={font.style.thumbnail}
                          title={font.font.title}
                          isCustom={font.font.isCustom}
                          showDelete={style.items.words.fontIds.length > 1}
                          containerProps={{
                            onClick: (e) => {
                              if (e.isPropagationStopped()) {
                                return
                              }
                              state.isAddingFont = false
                              state.replacingFontIndex = index
                              state.view = 'choose-font'
                            },
                          }}
                          onChangeClick={() => {
                            state.isAddingFont = false
                            state.replacingFontIndex = index
                            state.view = 'choose-font'
                          }}
                          onDeleteClick={() => {
                            style.items.words.fontIds = style.items.words.fontIds.filter(
                              (id) => id !== font.style.fontId
                            )
                          }}
                        />
                      )
                    })}
                  </Box>

                  <Box mt="3">
                    <Button
                      mr="3"
                      onClick={() => {
                        state.replacingFontIndex = undefined
                        state.isAddingFont = true
                        state.view = 'choose-font'
                      }}
                      leftIcon="add"
                      variantColor="teal"
                    >
                      Add more fonts
                      <Tag
                        ml="3"
                        size="sm"
                        rounded="full"
                        variant="solid"
                        variantColor="light"
                      >
                        <TagLabel>{(fonts || []).length} / 8</TagLabel>
                      </Tag>
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
                <Box
                  height="calc(100vh - 120px)"
                  display="flex"
                  flexDirection="column"
                >
                  <LeftPanelFontPicker
                    showCancel={state.isAddingFont}
                    selectedFontId={
                      style.items.words.fontIds[
                        state.replacingFontIndex != null
                          ? state.replacingFontIndex
                          : 0
                      ]
                    }
                    onCancel={() => {
                      state.view = 'font-list'
                    }}
                    onHighlighted={(font, fontStyle) => {
                      if (state.replacingFontIndex != null) {
                        style.items.words.fontIds[state.replacingFontIndex] =
                          fontStyle.fontId
                        style.items.words.fontIds = uniq(
                          style.items.words.fontIds
                        )
                        store.animateVisualize(false)
                      }
                    }}
                    onSelected={(font, fontStyle) => {
                      if (state.isAddingFont) {
                        style.items.words.fontIds = uniq([
                          ...style.items.words.fontIds,
                          fontStyle.fontId,
                        ])
                      } else if (state.replacingFontIndex != null) {
                        style.items.words.fontIds[state.replacingFontIndex] =
                          fontStyle.fontId
                        style.items.words.fontIds = uniq(
                          style.items.words.fontIds
                        )
                      }
                      state.view = 'font-list'
                      store.animateVisualize(false)
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
  showDelete: boolean
  onDeleteClick: () => void
  onChangeClick: () => void
  containerProps?: React.HTMLAttributes<HTMLDivElement>
}

export const FontListButton: React.FC<FontListButtonProps> = ({
  title,
  isCustom,
  isSelected,
  showDelete,
  onDeleteClick,
  onChangeClick,
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

      <FontChangeButton
        variantColor="accent"
        aria-label="Delete"
        size="sm"
        ml="2"
        mr="2"
        onClickCapture={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.nativeEvent.stopImmediatePropagation()
          e.nativeEvent.stopPropagation()
          onChangeClick()
        }}
      >
        Change
      </FontChangeButton>

      {showDelete && (
        <FontDeleteButton
          isRound
          aria-label="Delete"
          ml="2"
          mr="2"
          icon="close"
          size="xs"
          onClickCapture={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
            e.nativeEvent.stopPropagation()
            onDeleteClick()
          }}
        >
          <Icon name="close" />
        </FontDeleteButton>
      )}
    </FontButtonContainer>
  )
}

const FontChangeButton = styled(Button)`
  position: absolute;
  right: 40px;
`

const Toolbar = styled(Box)``

const FontDeleteButton = styled(IconButton)`
  position: absolute;
  right: 0;
  width: 30px;
`

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
  position: relative;

  ${FontDeleteButton}, ${FontChangeButton} {
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

    ${FontDeleteButton}, ${FontChangeButton} {
      opacity: 1;
    }
  }
`
FontButtonContainer.defaultProps = {
  display: 'flex',
  alignItems: 'center',
}
