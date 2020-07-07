import {
  Box,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import { Button } from 'components/shared/Button'
import { DeleteButton } from 'components/shared/DeleteButton'
import { SearchInput } from 'components/shared/SearchInput'
import {
  FontConfig,
  fonts as allAvailableFonts,
  FontStyleConfig,
  popularFonts,
} from 'data/fonts'
import { capitalize, flatten, uniq } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useMemo } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List, ListProps } from 'react-window'
import { useStore } from 'services/root-store'
import { FontListButton } from './components'

export type FontPickerProps = {
  selectedFontId: string | null
  onHighlighted: (font: FontConfig, fontStyle: FontStyleConfig) => void
}

const state = observable({
  query: '',
  style: 'popular',
  language: 'any',
})

export const FontPicker: React.FC<FontPickerProps> = observer((props) => {
  const { selectedFontId, onHighlighted } = props
  const { editorPageStore: store } = useStore()

  const allFonts = store.getAvailableFonts({
    popular: state.style === 'popular',
  })

  const styleOptions = uniq(
    flatten(allFonts.map((f) => f.font.categories || []))
  )
  styleOptions.sort()

  const langOptions = uniq(flatten(allFonts.map((f) => f.font.subsets || [])))
  langOptions.sort()
  langOptions.unshift('any')

  const fonts = allFonts.filter(
    (f) =>
      (state.language === 'any' ||
        (f.font.subsets || []).includes(state.language)) &&
      ((state.style === 'popular' && f.font.isPopular) ||
        (state.style !== 'popular' &&
          state.style !== 'all' &&
          (f.font.categories || [])[0] === state.style) ||
        state.style === 'all') &&
      f.font.title
        .toLocaleLowerCase()
        .startsWith(state.query.toLocaleLowerCase())
  )

  const selectedFont = useMemo(
    () =>
      fonts.find(
        (f) => f.font.styles.find((s) => s.fontId === selectedFontId) != null
      ),
    [selectedFontId]
  )

  const FontListRow: ListProps['children'] = ({ index, style }) => {
    const font = fonts[index]
    const fontStyle = font.defaultStyle
    const isSelected =
      selectedFont && selectedFont.font.title === font.font.title
    return (
      <FontListButton
        isSelected={isSelected}
        thumbnail={font.defaultStyle.thumbnail}
        title={font.font.title}
        isCustom={font.font.isCustom}
        containerProps={{
          style,
          onClick: () => {
            onHighlighted(font.font, fontStyle)
          },
        }}
      />
    )
  }

  return (
    <>
      <Box
        mt="2"
        css={css`
          background: hsl(220, 36%, 95%);
          margin: 0 -20px;
          padding: 8px 20px 4px;
        `}
      >
        <Box display="flex" flexWrap="wrap" alignItems="flex-start">
          <Box
            css={css`
              white-space: nowrap;
            `}
            mr="3"
            mb="2"
          >
            <Menu placement="bottom-start">
              <MenuButton
                variant={state.style !== 'popular' ? 'solid' : 'ghost'}
                colorScheme={state.style !== 'popular' ? 'accent' : undefined}
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="sm"
                mr="1"
              >
                {state.style === 'popular'
                  ? 'Popular fonts'
                  : capitalize(state.style)}
              </MenuButton>
              <MenuList
                css={css`
                  max-height: 300px;
                  overflow: auto;
                `}
              >
                <MenuItem
                  onClick={() => {
                    state.style = 'popular'
                  }}
                >
                  Popular ({popularFonts.length})
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    state.style = 'all'
                  }}
                >
                  All ({allAvailableFonts.length})
                </MenuItem>
                <MenuDivider />
                {styleOptions.map((option, index) => (
                  <MenuItem
                    key={option}
                    onClick={() => {
                      state.style = option
                    }}
                  >
                    {option === 'popular'
                      ? 'Popular fonts'
                      : capitalize(option)}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            {state.style !== 'popular' && (
              <DeleteButton
                size="xs"
                onClick={() => {
                  state.style = 'popular'
                }}
              />
            )}
          </Box>

          <Box
            css={css`
              white-space: nowrap;
            `}
            mr="3"
            mb="2"
          >
            <Menu placement="bottom-start">
              <MenuButton
                mr="1"
                size="sm"
                as={Button}
                colorScheme={state.language === 'any' ? undefined : 'accent'}
                variant={state.language === 'any' ? 'ghost' : 'solid'}
                rightIcon={<ChevronDownIcon />}
              >
                {state.language === 'any'
                  ? 'Any language'
                  : `${capitalize(state.language)}`}
              </MenuButton>
              <MenuList maxHeight="200px" overflowY="auto">
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
              <DeleteButton
                size="xs"
                onClick={() => {
                  state.language = 'any'
                }}
              />
            )}
          </Box>
        </Box>

        <Box display="flex" mb="1">
          <SearchInput
            placeholder="Find font..."
            value={state.query}
            onChange={(value) => {
              state.query = value
            }}
          />
        </Box>
      </Box>

      <Box mt="2" flex="1">
        {fonts.length > 0 && (
          <AutoSizer defaultWidth={900} defaultHeight={700}>
            {({ height }) => (
              <List
                overscanCount={20}
                height={height}
                itemCount={fonts.length}
                itemSize={45}
                width={340}
              >
                {FontListRow}
              </List>
            )}
          </AutoSizer>
        )}

        {fonts.length === 0 && (
          <>
            <Text textAlign="center" color="gray.500" fontSize="lg">
              No fonts found for your search criteria.
            </Text>
            <Button
              mt="3"
              width="100%"
              colorScheme="secondary"
              onClick={() => {
                state.language = 'any'
                state.style = 'popular'
                state.query = ''
              }}
            >
              Clear filters
            </Button>
          </>
        )}
      </Box>
    </>
  )
})
