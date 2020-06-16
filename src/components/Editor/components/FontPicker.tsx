import {
  Badge,
  Box,
  Button,
  IconButton,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  InputRightElement,
} from '@chakra-ui/core'
import styled from '@emotion/styled'
import { BaseBtn } from 'components/shared/BaseBtn'
import { observer, useLocalStore } from 'mobx-react'
import { FixedSizeList as List, ListProps } from 'react-window'
import { useStore } from 'services/root-store'
import { useEffect, useMemo } from 'react'
import { FontConfig, FontStyleConfig } from 'data/fonts'

export type FontPickerProps = {
  selectedFontId: string
  onSelected: (font: FontConfig, fontStyle: FontStyleConfig) => void
}

export const FontPicker: React.FC<FontPickerProps> = observer((props) => {
  const { selectedFontId: initSelectedFontId, onSelected } = props
  const { editorPageStore: store } = useStore()

  const state = useLocalStore(() => ({
    query: '',
    selectedFontId: null as string | null,
  }))

  useEffect(() => {
    state.selectedFontId = initSelectedFontId
  }, [initSelectedFontId])

  const fonts = store
    .getAvailableFonts()
    .filter((f) =>
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
            onSelected(font, fontStyle)
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
      {selectedFont && (
        <>
          <Box>
            <SelectedFontThumbnail mb="4" mt="4" p="3">
              <img src={selectedFont.style.thumbnail} />
            </SelectedFontThumbnail>
          </Box>
        </>
      )}

      <InputGroup mt="5">
        <InputLeftElement children={<Icon name="search" />} />
        <Input
          _placeholder={{
            color: 'red',
          }}
          placeholder="Search shapes..."
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

      <Box mt="5">
        <List
          overscanCount={20}
          height={500}
          itemCount={fonts.length}
          itemSize={35}
          width={340}
        >
          {FontListRow}
        </List>
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
