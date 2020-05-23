import {
  Box,
  Button,
  Icon,
  IconButton,
  Editable,
  Heading,
  EditablePreview,
  EditableInput,
  InputGroup,
  InputLeftElement,
  Input,
  Stack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
} from '@chakra-ui/core'
import { capitalize } from 'lodash'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { TargetKind } from 'components/Editor/lib/editor'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { FiUploadCloud } from 'react-icons/fi'
import { ColorPicker } from 'components/shared/ColorPicker'
import { Tooltip } from 'components/shared/Tooltip'

export type LeftPanelWordsTabProps = {
  target: TargetKind
}

const WordList = styled(Box)`
  height: calc(100vh - 210px);
  overflow: auto;
`

const WordDeleteButton = styled(IconButton)``

const WordRow = styled(Box)`
  width: 100%;
  padding: 4px 0;
  display: flex;

  ${WordDeleteButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  &:hover {
    background: #eee;
    ${WordDeleteButton} {
      opacity: 1;
    }
  }
`

const state = observable({})

const Toolbar = styled(Box)``

export const LeftPanelWordsTab: React.FC<LeftPanelWordsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styles[target]
    const words = style.words

    const fonts = store.getAvailableFonts()

    return (
      <Box mb="5">
        <Stack spacing="0">
          <Stack direction="row" spacing="0">
            <Tooltip label="Open advanced words editor..." showDelay={300}>
              <Button leftIcon="edit">Open editor...</Button>
            </Tooltip>

            <Button ml="2" leftIcon="arrow-up">
              Import
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
                <MenuGroup title="Formatting">
                  <MenuItem
                    onClick={() => {
                      words.wordList = words.wordList.map((w) => ({
                        ...w,
                        text: capitalize(w.text),
                      }))
                    }}
                  >
                    Capitalize
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      words.wordList = words.wordList.map((w) => ({
                        ...w,
                        text: w.text.toLocaleUpperCase(),
                      }))
                    }}
                  >
                    UPPERCASE
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      words.wordList = words.wordList.map((w) => ({
                        ...w,
                        text: w.text.toLocaleLowerCase(),
                      }))
                    }}
                  >
                    lowercase
                  </MenuItem>
                </MenuGroup>

                <MenuDivider />

                <MenuItem onClick={() => store.clearWords(target)}>
                  <Icon
                    name="small-close"
                    size="20px"
                    color="gray.500"
                    mr="2"
                  />
                  Clear all
                </MenuItem>
              </MenuList>
            </Menu>
          </Stack>

          <Stack direction="row" mt="3">
            <Button
              variantColor="green"
              leftIcon="add"
              onClick={() => store.addEmptyWord(target)}
            >
              Add
            </Button>

            <InputGroup flex={1}>
              <InputLeftElement children={<Icon name="search" />} />
              <Input placeholder="Filter..." />
            </InputGroup>
          </Stack>

          <WordList mt="2">
            {words.wordList.map((word) => (
              <WordRow key={word.id}>
                <Editable
                  ml="2"
                  flex={1}
                  value={word.text}
                  onChange={(text) => {
                    store.updateWord(target, word.id, {
                      text,
                    })
                  }}
                  selectAllOnFocus
                  placeholder="Type new word here..."
                >
                  <EditablePreview flex={1} width="100%" />
                  <EditableInput placeholder="Type new word here..." />
                </Editable>

                {/* <ColorPicker value="#ff7777" mb="0" height="26px" /> */}

                <WordDeleteButton
                  isRound
                  aria-label="Delete"
                  ml="2"
                  mr="2"
                  icon="close"
                  size="xs"
                  onClick={() => store.deleteWord(target, word.id)}
                  // variantColor="red"
                >
                  <Icon name="close" />
                </WordDeleteButton>
              </WordRow>
            ))}
          </WordList>
        </Stack>
      </Box>
    )
  }
)
