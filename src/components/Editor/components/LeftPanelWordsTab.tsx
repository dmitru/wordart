import {
  Box,
  Button,
  Icon,
  IconButton,
  Editable,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  Link,
  Text,
  TabPanel,
  Textarea,
  Checkbox,
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
import stopword from 'stopword'

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

const state = observable({
  isShowingImport: false,
  editor: {
    import: {
      textInput: '',
    },
  },
})

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

            <Button
              ml="2"
              leftIcon="arrow-up"
              onClick={() => {
                state.isShowingImport = true
              }}
            >
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
              onClick={() => store.addWord(target)}
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

        <Modal
          size="lg"
          isOpen={state.isShowingImport}
          onClose={() => {
            state.isShowingImport = false
          }}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Import Words</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Tabs size="md" variant="enclosed">
                <TabList>
                  <Tab>Text</Tab>
                  <Tab>CSV / Excel</Tab>
                  <Tab>Web</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <Textarea
                      mt="4"
                      minHeight="200px"
                      placeholder="Enter text..."
                      value={state.editor.import.textInput}
                      onChange={(evt) => {
                        state.editor.import.textInput = evt.target.value
                      }}
                    />
                    <Box mt="4" mb="4">
                      <Stack direction="row" spacing="5">
                        <Checkbox>Remove common words</Checkbox>
                        <Checkbox>Remove numbers</Checkbox>
                      </Stack>
                      <Box>
                        <Checkbox>
                          Word stemming (e.g. treat “love” and “loves” as one
                          word)
                        </Checkbox>
                      </Box>
                    </Box>
                  </TabPanel>
                  <TabPanel>
                    <Box mt="4">
                      <Text>
                        <Link>Learn more</Link> about importing words from CSV,
                        Excel or Google Sheets.
                      </Text>
                      <Textarea
                        mt="3"
                        placeholder="Paste CSV..."
                        value={state.editor.import.textInput}
                        onChange={(evt) => {
                          state.editor.import.textInput = evt.target.value
                        }}
                      />
                      <Box mt="3">
                        <Text>
                          Or you can choose a CSV file:{' '}
                          <Button>Open CSV file...</Button>
                        </Text>
                      </Box>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Checkbox marginRight="auto">
                Clear word list before importing
              </Checkbox>
              <Button
                ml="3"
                variantColor="accent"
                onClick={() => {
                  const rawWords = state.editor.import.textInput
                    .split(' ')
                    .map((word) => word.toLocaleLowerCase().trim())
                  const processedWords = stopword.removeStopwords(rawWords)

                  for (const word of processedWords) {
                    store.addWord(target, word)
                  }
                  state.isShowingImport = false
                }}
              >
                Import
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    )
  }
)
