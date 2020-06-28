import {
  Box,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from '@chakra-ui/core'
import styled from '@emotion/styled'
import { TextFields } from '@styled-icons/material-twotone/TextFields'
import { ImportWordsModal } from 'components/Editor/components/ImportWordsModal'
import { SectionLabel } from 'components/Editor/components/shared'
import { WordsEditorModal } from 'components/Editor/components/WordsEditorModal'
import { TargetKind } from 'components/Editor/lib/editor'
import { Button } from 'components/shared/Button'
import { DeleteButton } from 'components/shared/DeleteButton'
import { Input } from 'components/shared/Input'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { SearchInput } from 'components/shared/SearchInput'
import { capitalize } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useRef } from 'react'
import { useStore } from 'services/root-store'

export type LeftPanelWordsTabProps = {
  target: TargetKind
}

const state = observable({
  isShowingImport: false,
  isShowingEditor: false,
  textFilter: '',
  newWordText: '',
})

let ignoreBlur = false

export const LeftPanelWordsTab: React.FC<LeftPanelWordsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const words = style.items.words

    const newWordInputRef = useRef<HTMLInputElement>(null)

    const focusNewWordInput = () => {
      console.log(newWordInputRef.current)
      newWordInputRef.current?.focus()
    }

    const handleAddWord = (word = '') => {
      store.addWord(target, word)
      store.animateVisualize(false)
      focusNewWordInput()
    }

    const handleNewWordInputSubmit = () => {
      const text = state.newWordText.trim()
      if (text === '') {
        // do nothing
      } else {
        handleAddWord(text)
        state.newWordText = ''
      }
    }

    const textFilterValue = state.textFilter.trim().toLocaleLowerCase()
    const allWords = words.wordList
    const filteredWords = textFilterValue
      ? words.wordList.filter((w) =>
          w.text.trim().toLocaleLowerCase().includes(textFilterValue)
        )
      : allWords

    return (
      <Box mb="5" px="5" py="6">
        <>
          <SectionLabel>Words list</SectionLabel>
          <Stack direction="row" mb="3" spacing="1">
            <Button
              size="sm"
              variantColor="secondary"
              leftIcon="add"
              onClick={focusNewWordInput}
            >
              Add
            </Button>

            <Button
              size="sm"
              leftIcon="edit"
              variantColor="primary"
              onClick={() => {
                state.isShowingEditor = true
              }}
            >
              Edit words
            </Button>

            <Box ml="auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  state.isShowingImport = true
                }}
              >
                Import
              </Button>

              <Menu>
                <MenuButton as={MenuDotsButton} size="sm" ml="2" />
                <MenuList zIndex={1000} placement="bottom-end">
                  <MenuGroup title="Formatting">
                    <MenuItem
                      onClick={() => {
                        words.wordList = words.wordList.map((w) => ({
                          ...w,
                          text: capitalize(w.text),
                        }))
                        store.animateVisualize(false)
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
                        store.animateVisualize(false)
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
                        store.animateVisualize(false)
                      }}
                    >
                      lowercase
                    </MenuItem>
                  </MenuGroup>

                  <MenuDivider />

                  <MenuItem
                    onClick={() => {
                      store.clearWords(target)
                      focusNewWordInput()
                    }}
                  >
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
            </Box>
          </Stack>
          <Stack direction="row" mb="4" mt="2" maxWidth="185px">
            <SearchInput
              placeholder="Filter..."
              value={state.textFilter}
              onChange={(value) => {
                state.textFilter = value
              }}
            />
          </Stack>

          <WordList mt="2" id="words-list">
            {filteredWords.map((word, index) => {
              const handleSubmit = () => {
                const text = word.text.trim()
                if (text === '') {
                  store.deleteWord(target, word.id)
                  store.animateVisualize(false)
                } else if (text !== word.text) {
                  store.updateWord(target, word.id, {
                    text,
                  })
                  store.animateVisualize(false)
                }
              }

              return (
                <WordRow key={word.id} aria-label="">
                  <WordInput
                    ml="2"
                    flex="1"
                    value={word.text}
                    onChange={(e: any) => {
                      store.updateWord(target, word.id, {
                        text: e.target.value,
                      })
                    }}
                    onBlur={() => {
                      handleSubmit()
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter') {
                        handleSubmit()
                      }
                    }}
                    placeholder="Type here..."
                  />

                  <WordDeleteButton
                    tabIndex={-1}
                    ml="2"
                    mr="2"
                    onClick={() => {
                      store.deleteWord(target, word.id)
                      store.animateVisualize(false)
                      if (words.wordList.length === 0) {
                        focusNewWordInput()
                      }
                    }}
                  />
                </WordRow>
              )
            })}

            {/* NEW WORD INPUT */}
            {!state.textFilter && (
              <WordRowNewInput>
                <WordInput
                  flex="1"
                  ref={newWordInputRef}
                  autoFocus
                  value={state.newWordText}
                  onChange={(e: any) => {
                    state.newWordText = e.target.value
                  }}
                  onBlur={() => {
                    if (!ignoreBlur) {
                      handleNewWordInputSubmit()
                    }
                  }}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      handleNewWordInputSubmit()
                    } else if (e.key === 'Escape') {
                      ignoreBlur = true
                      state.newWordText = ''
                      newWordInputRef.current?.blur()
                      setTimeout(() => {
                        ignoreBlur = false
                      }, 100)
                    }
                  }}
                  placeholder="Type new word here..."
                />
              </WordRowNewInput>
            )}
          </WordList>
        </>

        {allWords.length === 0 && <EmptyStateWordsUi />}

        <ImportWordsModal
          isOpen={state.isShowingImport}
          onClose={() => {
            state.isShowingImport = false
          }}
          onImported={(words) => {
            for (const word of words) {
              store.addWord(target, word)
            }

            store.animateVisualize(false)
            state.isShowingImport = false
          }}
        />

        <WordsEditorModal
          target={target}
          isOpen={state.isShowingEditor}
          onClose={() => {
            state.isShowingEditor = false
          }}
        />
      </Box>
    )
  }
)

const WordInput = styled(Input)`
  &:not(:focus) {
    border: none;
  }
`

const WordList = styled(Box)`
  /* height: calc(100vh - 210px); */
  overflow: auto;
`

const WordDeleteButton = styled(DeleteButton)``

const WordRow = styled(Box)`
  width: 100%;
  padding: 0;
  display: flex;
  align-items: center;

  border-bottom: 1px solid #eee;

  ${WordDeleteButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  &:hover {
    /* background: hsla(200, 81%, 97%, 1); */
    ${WordDeleteButton} {
      opacity: 1;
    }
  }
`

const WordRowNewInput = styled(WordRow)`
  padding: 2px;
  border: none;
`

const EmptyStateWordsUi: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <Box
    mt="2rem"
    display="flex"
    alignItems="center"
    flexDirection="column"
    boxShadow="sm"
    borderColor="gray.100"
    borderWidth="1px"
    p="6"
  >
    <Box
      mb="1rem"
      bg="primary.50"
      color="primary.400"
      width="90px"
      height="90px"
      borderRadius="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <TextFields size={60} />
    </Box>

    <Text fontSize="xl" flex={1} textAlign="center" color="gray.600" mb="0">
      It all began with a word...
    </Text>

    <Text mt="4" fontSize="md" flex={1} textAlign="center" color="gray.500">
      Wordcloudy is all about using words to generate beautiful designs.
      <br />
      <br />
      Add a few words and hit Visualize!
    </Text>

    {children}
  </Box>
)
