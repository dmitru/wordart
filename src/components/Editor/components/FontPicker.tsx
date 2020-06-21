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

export type FontPickerProps = {
  selectedFontId: string
  showCancel?: boolean
  onCancel: () => void
  onSelected: (font: FontConfig, fontStyle: FontStyleConfig) => void
  onHighlighted: (font: FontConfig, fontStyle: FontStyleConfig) => void
}

export const FontPicker: React.FC<FontPickerProps> = observer((props) => {
  const {
    showCancel = true,
    selectedFontId: initSelectedFontId,
    onSelected,
    onHighlighted,
    onCancel,
  } = props
  const { editorPageStore: store } = useStore()

  const state = useLocalStore(() => ({
    query: '',
    selectedFontId: null as string | null,
    style: 'all',
    language: 'any',
  }))

  useEffect(() => {
    state.selectedFontId = initSelectedFontId
  }, [initSelectedFontId])

  const allFonts = store.getAvailableFonts()

  const styleOptions = uniq(
    flatten(allFonts.map((f) => f.font.categories || []))
  )
  styleOptions.sort()
  styleOptions.unshift('all')

  const langOptions = uniq(flatten(allFonts.map((f) => f.font.subsets || [])))
  langOptions.sort()
  langOptions.unshift('any')

  const fonts = allFonts.filter(
    (f) =>
      (state.language === 'any' ||
        (f.font.subsets || []).includes(state.language)) &&
      (state.style === 'all' || (f.font.categories || [])[0] === state.style) &&
      f.font.title
        .toLocaleLowerCase()
        .startsWith(state.query.toLocaleLowerCase())
  )

  const FontListRow: ListProps['children'] = ({ index, style }) => {
    const font = fonts[index]
    const fontStyle = font.style
    const isSelected =
      selectedFont && selectedFont.font.title === font.font.title
    return (
      <FontListButton
        isSelected={isSelected}
        thumbnail={font.style.thumbnail}
        title={font.font.title}
        isCustom={font.font.isCustom}
        containerProps={{
          style,
          onClick: () => {
            state.selectedFontId = fontStyle.fontId
            onHighlighted(font.font, fontStyle)
            if (showCancel) {
              animateElement(
                document.getElementById('font-picker-done')!,
                'pulsate-fwd-subtle'
              )
            }
          },
        }}
      />
    )
  }

  const selectedFont = useMemo(
    () => fonts.find((f) => f.style.fontId === state.selectedFontId),
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

        <Box mt="2rem">
          <Heading size="lg" mb="4" mt="0">
            Fonts Catalog
          </Heading>

          <InputGroup mt="5" size="sm" mb="3">
            <InputLeftElement children={<Icon name="search" />} />
            <Input
              _placeholder={{
                color: 'red',
              }}
              placeholder="Find font..."
              value={state.query}
              onChange={(e: any) => {
                state.query = e.target.value
              }}
            />
            {!!state.query && (
              <InputRightElement
                onClick={() => {
                  state.query = ''
                }}
                children={
                  <IconButton
                    aria-label="Clear"
                    icon="close"
                    color="gray"
                    isRound
                    variant="ghost"
                    size="sm"
                  />
                }
              />
            )}
          </InputGroup>

          <Box mb="3" display="flex" flexWrap="wrap" alignItems="flex-start">
            {styleOptions.map((option) => (
              <Button
                key={option}
                size="xs"
                mr="2"
                mb="1"
                variant={state.style === option ? 'solid' : 'outline'}
                variantColor={state.style === option ? 'accent' : undefined}
                onClick={() => {
                  state.style = option
                }}
              >
                {option === 'all' ? 'All styles' : capitalize(option)}
              </Button>
            ))}

            <Menu>
              <MenuButton
                mr="1"
                size="xs"
                as={Button}
                variantColor={state.language === 'any' ? undefined : 'accent'}
                variant={state.language === 'any' ? 'ghost' : 'solid'}
                rightIcon="chevron-down"
              >
                {state.language === 'any'
                  ? 'Language: Any'
                  : `${capitalize(state.language)}`}
              </MenuButton>
              <MenuList
                placement="bottom-start"
                maxHeight="200px"
                overflowY="auto"
                zIndex={100000}
              >
                {langOptions.map((option) => (
                  <MenuItem
                    key={option}
                    onClick={() => {
                      state.language = option
                    }}
                  >
                    {option === 'any' ? 'Any language' : capitalize(option)}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            {state.language !== 'any' && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  state.language = 'any'
                }}
              >
                <Icon name="close" />
              </Button>
            )}
          </Box>
        </Box>

        <Box mt="5" flex="1">
          {fonts.length > 0 && (
            <AutoSizer defaultWidth={900} defaultHeight={700}>
              {({ height }) => (
                <List
                  overscanCount={20}
                  height={height}
                  itemCount={fonts.length}
                  itemSize={35}
                  width={340}
                >
                  {FontListRow}
                </List>
              )}
            </AutoSizer>
          )}

          {fonts.length === 0 && (
            <>
              <Text>No fonts found for your search criteria.</Text>
              <Button
                mt="3"
                width="100%"
                onClick={() => {
                  state.language = 'any'
                  state.style = 'all'
                  state.query = ''
                }}
              >
                Show all fonts
              </Button>
            </>
          )}
        </Box>
      </Box>
    </>
  )
})

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
