import {
  Box,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  InputGroup,
  InputRightElement,
  Stack,
  Checkbox,
  Text,
} from '@chakra-ui/core'
import styled from '@emotion/styled'
import css from '@emotion/css'
import { DragIndicator } from '@styled-icons/material/DragIndicator'
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
import { Observer, observer } from 'mobx-react'
import { useRef, useState, useEffect } from 'react'
import { useStore } from 'services/root-store'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { WordConfigId } from 'components/Editor/editor-store'
import pluralize from 'pluralize'

export type LeftPanelWordsTabProps = {
  target: TargetKind
}

const reorder = (list: any[], startIndex: number, endIndex: number) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

const state = observable({
  isShowingImport: false,
  isShowingEditor: false,
  textFilter: '',
  newWordText: '',
  selectedWords: new Set<WordConfigId>(),
})

let ignoreBlur = false

export const LeftPanelWordsTab: React.FC<LeftPanelWordsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const words = style.items.words

    useEffect(() => {
      state.selectedWords.clear()
    }, [target])

    const newWordInputRef = useRef<HTMLInputElement>(null)

    const focusNewWordInput = () => {
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

    const [isDragging, setIsDragging] = useState(false)

    const selectedCount = state.selectedWords.size
    const wordsToProcess =
      selectedCount === 0
        ? allWords
        : allWords.filter((w) => state.selectedWords.has(w.id))

    const updateSelectedWords = () => {
      const existingWordIds = new Set(allWords)
      state.selectedWords = new Set(
        [...state.selectedWords.values()].filter((wId) =>
          existingWordIds.has(wId)
        )
      )
    }

    const focusNextField = () => {
      const focusedEl = document.querySelector('.word-input:focus')
      const wordInputs = [...document.getElementsByClassName('word-input')]
      const currentInputIndex = wordInputs.findIndex((el) => focusedEl === el)
      if (currentInputIndex > -1) {
        wordInputs[currentInputIndex + 1]?.focus()
        wordInputs[currentInputIndex + 1]?.select()
      }
    }

    const focusPrevField = () => {
      const focusedEl = document.querySelector('.word-input:focus')
      const wordInputs = [...document.getElementsByClassName('word-input')]
      const currentInputIndex = wordInputs.findIndex((el) => focusedEl === el)
      if (currentInputIndex > -1) {
        wordInputs[currentInputIndex - 1]?.focus()
        wordInputs[currentInputIndex - 1]?.select()
      }
    }

    return (
      <Box px="5" py="6" overflow="hidden" height="calc(100vh - 60px)">
        <>
          <Stack direction="row" mb="6" spacing="2">
            <Button
              variantColor="primary"
              leftIcon="add"
              onClick={focusNewWordInput}
            >
              Add
            </Button>

            <Button
              leftIcon="edit"
              variantColor="secondary"
              onClick={() => {
                state.isShowingEditor = true
              }}
            >
              Edit words
            </Button>

            <Box ml="auto">
              <Button
                variant="ghost"
                onClick={() => {
                  state.isShowingImport = true
                }}
              >
                Import
              </Button>
            </Box>
          </Stack>

          {allWords.length > 0 && (
            <Stack
              direction="row"
              alignItems="center"
              mb="4"
              mt="2"
              height="40px"
              css={css`
                margin-bottom: 0;
                margin: 0 -20px;
                padding: 0 20px;
                padding-left: 38px;
                background: hsla(225, 0%, 95%, 1);
              `}
            >
              <Checkbox
                size="lg"
                bg="white"
                isChecked={state.selectedWords.size > 0}
                onChange={() => {
                  if (state.selectedWords.size === 0) {
                    state.selectedWords = new Set(allWords.map((w) => w.id))
                  } else {
                    state.selectedWords.clear()
                  }
                }}
              />
              <Box maxWidth="185px">
                <SearchInput
                  css={css`
                    border-bottom: 1px solid transparent !important;
                  `}
                  placeholder="Filter..."
                  value={state.textFilter}
                  onChange={(value) => {
                    state.textFilter = value
                  }}
                />
              </Box>

              <Box flex="1" ml="auto" display="flex" justifyContent="flex-end">
                <Menu>
                  {selectedCount === 0 && <MenuButton as={MenuDotsButton} />}
                  {selectedCount > 0 && (
                    <MenuButton
                      as={Button}
                      variantColor="accent"
                      rightIcon="chevron-down"
                      size="sm"
                    >
                      {selectedCount} {pluralize('words', selectedCount)}
                    </MenuButton>
                  )}
                  <MenuList zIndex={1000} placement="bottom-end">
                    <MenuItem
                      onClick={() => {
                        for (const w of wordsToProcess) {
                          w.text = capitalize(w.text)
                        }
                        store.animateVisualize(false)
                      }}
                    >
                      Capitalize
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        for (const w of wordsToProcess) {
                          w.text = w.text.toLocaleUpperCase()
                        }
                        store.animateVisualize(false)
                      }}
                    >
                      UPPERCASE
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        for (const w of wordsToProcess) {
                          w.text = w.text.toLocaleLowerCase()
                        }
                        store.animateVisualize(false)
                      }}
                    >
                      lowercase
                    </MenuItem>

                    {selectedCount === 0 && (
                      <>
                        <MenuDivider />
                        <MenuItem>Import CSV...</MenuItem>
                        <MenuItem>Export CSV...</MenuItem>

                        <MenuDivider />
                        <MenuItem>Find and replace...</MenuItem>
                      </>
                    )}

                    <MenuDivider />

                    <MenuItem
                      onClick={() => {
                        if (selectedCount > 0) {
                          for (const w of wordsToProcess) {
                            store.deleteWord(target, w.id)
                          }
                        } else {
                          if (
                            window.confirm(
                              'Are you sure you want to remove all words?'
                            )
                          ) {
                            store.clearWords(target)
                          }
                        }
                        updateSelectedWords()
                        if (words.wordList.length === 0) {
                          focusNewWordInput()
                        }
                      }}
                    >
                      {selectedCount > 0 ? 'Delete' : 'Delete all'}
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Box>
            </Stack>
          )}

          <Box overflowY="hidden" overflowX="hidden" mx="-20px" px="20px">
            <DragDropContext
              onBeforeDragStart={() => setIsDragging(true)}
              onDragEnd={(result) => {
                setIsDragging(false)
                if (!result.destination) {
                  return
                }

                words.wordList = reorder(
                  words.wordList,
                  result.source.index,
                  result.destination.index
                )
              }}
            >
              <Droppable droppableId="droppable">
                {(provided, snapshot) => (
                  <Observer>
                    {() => (
                      <WordList
                        mt="2"
                        overflowY="auto"
                        id="words-list"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
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
                            <Draggable
                              key={word.id}
                              draggableId={word.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <Observer>
                                  {() => (
                                    <WordRow
                                      aria-label=""
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      tabIndex={-1}
                                      css={css`
                                        ${snapshot.isDragging &&
                                        `
                                          box-shadow: 0 0 10px 0 #0003;
                                          border-bottom: none !important;
                                          background: white;
                                        `}

                                        &:hover, &:focus-within {
                                          background-color: hsla(
                                            220,
                                            71%,
                                            98%,
                                            1
                                          );
                                        }

                                        ${state.selectedWords.has(word.id) &&
                                        `
                                          background-color: hsla(220, 71%, 95%, 1);

                                          &:hover, &:focus-within {
                                            background-color: hsla(220, 71%, 94%, 1);
                                          }
                                        `}
                                      `}
                                    >
                                      <Box color="gray.400">
                                        <DragIndicator
                                          size="20px"
                                          css={css`
                                            visibility: ${state.textFilter
                                              ? 'hidden'
                                              : 'visible'};
                                            position: relative;
                                            top: -2px;
                                            cursor: grab;
                                          `}
                                        />
                                      </Box>

                                      <Checkbox
                                        isChecked={state.selectedWords.has(
                                          word.id
                                        )}
                                        onChange={() => {
                                          if (
                                            state.selectedWords.has(word.id)
                                          ) {
                                            state.selectedWords.delete(word.id)
                                          } else {
                                            state.selectedWords.add(word.id)
                                          }
                                        }}
                                        p="10px"
                                        px="8px"
                                        size="lg"
                                        tabIndex={-1}
                                      />

                                      <WordInput
                                        className="word-input"
                                        autocomplete="off"
                                        spellcheck="false"
                                        autocorrect="off"
                                        pl="8px"
                                        flex="1"
                                        value={word.text}
                                        onFocus={(e: any) => {
                                          e.target?.select()
                                        }}
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
                                            focusNextField()
                                          } else if (e.key === 'Tab') {
                                            handleSubmit()
                                            focusNextField()
                                          } else if (e.key === 'ArrowUp') {
                                            e.nativeEvent.preventDefault()
                                            focusPrevField()
                                          } else if (e.key === 'ArrowDown') {
                                            e.nativeEvent.preventDefault()
                                            focusNextField()
                                          }
                                        }}
                                        placeholder="Type here..."
                                      />

                                      {/* <WordMenuButton
                                        tabIndex={-1}
                                        mr="1"
                                        size="sm"
                                        onClick={() => {
                                          store.deleteWord(target, word.id)
                                          store.animateVisualize(false)
                                          if (words.wordList.length === 0) {
                                            focusNewWordInput()
                                          }
                                        }}
                                      /> */}

                                      <WordDeleteButton
                                        tabIndex={-1}
                                        size="sm"
                                        onClick={() => {
                                          store.deleteWord(target, word.id)
                                          store.animateVisualize(false)
                                          if (words.wordList.length === 0) {
                                            focusNewWordInput()
                                          }
                                        }}
                                      />
                                    </WordRow>
                                  )}
                                </Observer>
                              )}
                            </Draggable>
                          )
                        })}

                        {/* NEW WORD INPUT */}
                        {!state.textFilter && !isDragging && (
                          <WordRowNewInput>
                            <InputGroup flex={1}>
                              <WordInput
                                className="word-input"
                                autocomplete="off"
                                spellcheck="false"
                                autocorrect="off"
                                flex="1"
                                ref={newWordInputRef}
                                value={state.newWordText}
                                onChange={(e: any) => {
                                  state.newWordText = e.target.value
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
                                  } else if (e.key === 'ArrowUp') {
                                    e.nativeEvent.preventDefault()
                                    focusPrevField()
                                  } else if (e.key === 'ArrowDown') {
                                    e.nativeEvent.preventDefault()
                                    focusNextField()
                                  }
                                }}
                                hasBorder
                                placeholder="Type new word here..."
                              />
                              <InputRightElement
                                width="80px"
                                children={
                                  <Button
                                    px="3"
                                    width="100%"
                                    // leftIcon="add"
                                    variantColor="primary"
                                    onClick={() => handleNewWordInputSubmit()}
                                  >
                                    Add
                                  </Button>
                                }
                              />
                            </InputGroup>
                          </WordRowNewInput>
                        )}

                        {allWords.length === 0 && (
                          <Box px="20px">
                            <EmptyStateWordsUi target={target} />
                          </Box>
                        )}
                      </WordList>
                    )}
                  </Observer>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
        </>

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

const WordInput = styled(Input)<{ hasBorder: boolean }>`
  background: transparent;
  &:not(:focus) {
    border-color: transparent;
  }

  ${(p) => p.hasBorder && `border-color: hsl(205, 18%, 72%) !important;`}
`

const WordList = styled(Box)`
  margin-left: -20px;
  height: calc(100vh - 200px);
  /* padding-left: 16px; */
  margin-right: -20px;
  /* padding-right: 16px; */
  padding-bottom: 80px;
  /* overflow: visible; */
`

const WordDeleteButton = styled(DeleteButton)``
const WordMenuButton = styled(MenuDotsButton)``

const WordRow = styled(Box)`
  width: 100%;
  padding: 0;
  padding-left: 10px;
  padding-right: 20px;

  display: flex;
  align-items: center;

  ${WordDeleteButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }
  ${WordMenuButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  &:hover {
    /* background: hsla(200, 81%, 97%, 1); */
    ${WordDeleteButton}, ${WordMenuButton} {
      opacity: 1;
    }
  }
`

const WordRowNewInput = styled(WordRow)`
  padding: 8px 16px;
  border: none;
`

const EmptyStateWordsUi: React.FC<{
  target: TargetKind
  children?: React.ReactNode
}> = ({ target, children }) => (
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
      Add words to {target === 'shape' ? 'the shape' : 'the background'}
    </Text>

    <Text mt="4" fontSize="md" flex={1} textAlign="center" color="gray.500">
      After adding words, hit Visualize
      <br /> to see the result!
    </Text>

    {children}
  </Box>
)
