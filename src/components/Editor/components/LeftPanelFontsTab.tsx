import {
  Badge,
  Box,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  TagLabel,
} from '@chakra-ui/core'
import { AddIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { LeftPanelTargetLayerDropdown } from 'components/Editor/components/TargetLayerDropdown'
import { AddCustomFontModal } from 'components/Editor/components/AddCustomFontModal'
import { FontPickerModal } from 'components/Editor/components/FontPicker/FontPickerModal'
import { SectionLabel } from 'components/Editor/components/shared'
import { TargetKind } from 'components/Editor/lib/editor'
import { BaseBtn } from 'components/shared/BaseBtn'
import { Button } from 'components/shared/Button'
import { DeleteButton } from 'components/shared/DeleteButton'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { Tooltip } from 'components/shared/Tooltip'
import { FontStyleConfig } from 'data/fonts'
import { uniq } from 'lodash'
import { observer, useLocalStore } from 'mobx-react'
import { useStore } from 'services/root-store'

export type LeftPanelFontsTabProps = {
  target: TargetKind
}

export const LeftPanelFontsTab: React.FC<LeftPanelFontsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]

    const state = useLocalStore(() => ({
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

      if (style.items.words.fontIds.length < 8) {
        style.items.words.fontIds.push(fontId)
      }
    }

    return (
      <>
        <Box px="5" py="6">
          <LeftPanelTargetLayerDropdown />

          <SectionLabel>Fonts to use</SectionLabel>
          <Box
            mt="3"
            mb="6"
            css={css`
              width: 340px;
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
                    },
                  }}
                  onChangeClick={() => {
                    state.isAddingFont = false
                    state.replacingFontIndex = index
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
              }}
              leftIcon={<AddIcon />}
              colorScheme="primary"
            >
              Add more fonts
            </Button>

            <Menu isLazy>
              <MenuButton as={MenuDotsButton} variant="ghost" />

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

            <Tooltip label="You can use up to 8 different fonts in your designs">
              <Box ml="auto">
                <Tag rounded="full" colorScheme="gray">
                  <TagLabel>{(fonts || []).length} / 8</TagLabel>
                </Tag>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        <FontPickerModal
          showCancel={state.isAddingFont}
          selectedFontId={
            style.items.words.fontIds[
              state.replacingFontIndex != null ? state.replacingFontIndex : 0
            ]
          }
          isOpen={state.isAddingFont || state.replacingFontIndex != null}
          submitText={state.isAddingFont ? 'Add font' : 'Choose font'}
          onClose={() => {
            state.isAddingFont = false
            state.replacingFontIndex = undefined
          }}
          onHighlighted={(font, fontStyle) => {
            if (state.replacingFontIndex != null) {
              style.items.words.fontIds[state.replacingFontIndex] =
                fontStyle.fontId
              style.items.words.fontIds = uniq(style.items.words.fontIds)
              store.animateVisualize(false)
            }
          }}
          onSubmit={(font, fontStyle) => {
            if (state.isAddingFont) {
              style.items.words.fontIds = uniq([
                ...style.items.words.fontIds,
                fontStyle.fontId,
              ])
            } else if (state.replacingFontIndex != null) {
              style.items.words.fontIds[state.replacingFontIndex] =
                fontStyle.fontId
              style.items.words.fontIds = uniq(style.items.words.fontIds)
            }

            state.isAddingFont = false
            state.replacingFontIndex = undefined

            store.animateVisualize(false)
          }}
        />

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
    <FontButtonContainer aria-label={`Font ${title}`} {...containerProps}>
      <FontButton>
        <img src={thumbnail} />
        {isCustom && (
          <Badge mr="2" ml="auto" colorScheme="purple">
            custom
          </Badge>
        )}

        <FontChangeButton
          colorScheme="secondary"
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
      </FontButton>

      {showDelete && (
        <FontDeleteButton
          aria-label="Delete"
          color="gray.600"
          ml="2"
          mr="2"
          onClickCapture={(e: any) => {
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
  right: 8px;
`

const Toolbar = styled(Box)``

const FontDeleteButton = styled(DeleteButton)`
  position: absolute;
  right: -8px;
  width: 30px;
`

const FontButton = styled(BaseBtn)`
  position: relative;
  box-shadow: 0 0 4px 0 #0004;
  padding: 0.25rem 0.75rem;
  margin-right: 38px;
  border: none;
  flex: 1;
  display: inline-flex;
  align-items: center;
  height: 60px;

  img {
    max-width: 270px;
    height: 38px;
    margin: 0;
    object-fit: contain;
  }
`

const FontButtonContainer = styled(Box)<{ theme: any }>`
  position: relative;
  margin-bottom: 1rem;

  ${FontDeleteButton}, ${FontChangeButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  transition: 0.1s background;

  &:hover {
    ${FontButton} {
      background: ${(p) => p.theme.colors.blackAlpha['50']};
    }

    ${FontDeleteButton}, ${FontChangeButton} {
      opacity: 1;
    }
  }
`
FontButtonContainer.defaultProps = {
  display: 'flex',
  alignItems: 'center',
}
