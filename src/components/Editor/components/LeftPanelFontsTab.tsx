import {
  Badge,
  Box,
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
import { uniq } from 'lodash'
import { LeftPanelFontPicker } from 'components/Editor/components/LeftPanelFontPicker'
import { Button } from 'components/shared/Button'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { DeleteButton } from 'components/shared/DeleteButton'

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

    const fontStylesById = store.getAvailableFontStyles()
    const fonts = style.items.words.fontIds
      .map((fontId) => fontStylesById[fontId])
      .filter((f) => f != null)

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
        isCustom: true,
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
          height="calc(100vh - 50px)"
          width="100%"
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
                <Box height="100%" px="5" py="6" position="absolute">
                  <SectionLabel>Fonts to use</SectionLabel>
                  <Box
                    mt="3"
                    mb="6"
                    css={css`
                      width: 340px;
                      /* border-radius: 4px; */
                      /* box-shadow: 0 0 4px 0 #0004; */
                    `}
                  >
                    {fonts.map((fontStyle, index) => {
                      return (
                        <FontListButton
                          key={fontStyle.fontId}
                          thumbnail={fontStyle.thumbnail}
                          title={fontStyle.title}
                          isCustom={fontStyle.isCustom}
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
                              (id) => id !== fontStyle.fontId
                            )
                          }}
                        />
                      )
                    })}
                  </Box>

                  <Box mt="3" display="flex" alignItems="center">
                    <Button
                      mr="3"
                      onClick={() => {
                        state.replacingFontIndex = undefined
                        state.isAddingFont = true
                        state.view = 'choose-font'
                      }}
                      leftIcon="add"
                      variantColor="primary"
                    >
                      Add more fonts
                    </Button>

                    <Menu>
                      <MenuButton as={MenuDotsButton} />

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

                    <Tag
                      ml="auto"
                      size="sm"
                      rounded="full"
                      variant="outline"
                      variantColor="gray"
                    >
                      <TagLabel>{(fonts || []).length} / 8</TagLabel>
                    </Tag>
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
                  width="100%"
                  height="calc(100vh - 100px)"
                  px="5"
                  py="6"
                  position="absolute"
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
                      console.log('onSelected', font, fontStyle)

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
        variantColor="secondary"
        aria-label="Change font"
        size="sm"
        ml="2"
        mr="2"
        onClickCapture={(e: any) => {
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
          aria-label="Delete"
          color="gray.600"
          ml="2"
          mr="2"
          onClickCapture={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
            e.nativeEvent.stopPropagation()
            onDeleteClick()
          }}
        />
      )}
    </FontButtonContainer>
  )
}

const FontChangeButton = styled(Button)`
  position: absolute;
  right: 40px;
`

const Toolbar = styled(Box)``

const FontDeleteButton = styled(DeleteButton)`
  position: absolute;
  right: 0;
  width: 30px;
`

const FontButton = styled(BaseBtn)`
  border: none;
  flex: 1;
  display: inline-flex;
  align-items: center;
  height: 48px;

  img {
    max-width: 270px;
    height: 38px;
    margin: 0;
    object-fit: contain;
  }
`

const FontButtonContainer = styled(Box)<{ theme: any; selected?: boolean }>`
  position: relative;
  box-shadow: 0 0 4px 0 #0004;
  padding: 0.25rem 0.75rem;
  margin-bottom: 1rem;

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
