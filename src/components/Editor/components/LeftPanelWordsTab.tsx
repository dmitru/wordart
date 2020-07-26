import {
  Box,
  Checkbox,
  InputGroup,
  InputProps,
  InputRightElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuList,
  MenuTransition,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/core'
import { AddIcon, ChevronDownIcon, SmallCloseIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { TextFields } from '@styled-icons/material-twotone/TextFields'
import { DragIndicator } from '@styled-icons/material/DragIndicator'
import { FindAndReplaceModal } from 'components/Editor/components/FindAndReplaceModal'
import { ImportWordsModal } from 'components/Editor/components/ImportWordsModal'
import { LeftPanelTargetLayerDropdown } from 'components/Editor/components/TargetLayerDropdown'
import { WordConfigId } from 'components/Editor/editor-store'
import { TargetKind } from 'components/Editor/lib/editor'
import {
  mkBgStyleConfFromOptions,
  mkShapeStyleConfFromOptions,
} from 'components/Editor/style'
import { WordListEntry } from 'components/Editor/style-options'
import { Button } from 'components/shared/Button'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { DeleteButton } from 'components/shared/DeleteButton'
import { Input } from 'components/shared/Input'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'
import { SearchInput } from 'components/shared/SearchInput'
import { capitalize, noop } from 'lodash'
import { observable, runInAction } from 'mobx'
import { observer, Observer } from 'mobx-react'
import pluralize from 'pluralize'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  Droppable,
} from 'react-beautiful-dnd'
import { FaCog } from 'react-icons/fa'
import { FiSearch, FiDownload } from 'react-icons/fi'
import { MdFormatSize } from 'react-icons/md'
import AutoSizer from 'react-virtualized-auto-sizer'
import {
  areEqual,
  FixedSizeList as List,
  ListChildComponentProps,
} from 'react-window'
import { useStore } from 'services/root-store'
import { useToasts } from 'use-toasts'
import { CustomizeWordPopover } from './CustomizeWord'
import { FiRefreshCw } from 'react-icons/fi'

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
  isShowingFindAndReplace: false,
  textFilter: '',
  newWordText: '',
  selectedWords: new Set<WordConfigId>(),
})

let ignoreBlur = false

export const LeftPanelWordsTab: React.FC<LeftPanelWordsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const shapeStyle = store.styleOptions.shape
    const bgStyle = store.styleOptions.bg
    const words = style.items.words

    const toasts = useToasts()

    useEffect(() => {
      state.selectedWords.clear()
    }, [target])

    const listRef = useRef<List>(null)
    const newWordInputRef = useRef<HTMLInputElement>(null)

    const focusNewWordInput = () => {
      newWordInputRef.current?.focus()
    }

    const handleAddWord = (word = '') => {
      store.addWord(target, word)
      store.animateVisualize(false)
      setTimeout(
        () => listRef.current?.scrollToItem(words.wordList.length - 1),
        10
      )

      focusNewWordInput()
    }

    const handleNewWordInputSubmit = () => {
      const text = state.newWordText.trim()
      if (text === '') {
        // do nothing
      } else {
        handleAddWord(text)
        state.newWordText = ''

        newWordInputRef.current?.blur()
        setTimeout(() => {
          newWordInputRef.current?.focus()
        }, 10)
      }
    }

    const textFilterValue = state.textFilter.trim().toLocaleLowerCase()
    const allWords = words.wordList
    const filteredWords = textFilterValue
      ? words.wordList.filter((w) =>
          w.text.trim().toLocaleLowerCase().includes(textFilterValue)
        )
      : allWords

    const selectedOrAllWords =
      state.selectedWords.size > 0
        ? allWords.filter((w) => state.selectedWords.has(w.id))
        : allWords

    const [isDragging, setIsDragging] = useState(false)

    const selectedCount = state.selectedWords.size
    const wordsToProcess =
      selectedCount === 0
        ? allWords
        : allWords.filter((w) => state.selectedWords.has(w.id))

    const updateSelectedWords = () => {
      const existingWordIds = new Set(allWords.map((w) => w.id))
      const newSelectedWordIds = new Set(
        [...state.selectedWords.values()].filter((wId) =>
          existingWordIds.has(wId)
        )
      )
      if (newSelectedWordIds.size !== state.selectedWords.size) {
        state.selectedWords = newSelectedWordIds
      }
    }

    const focusNextField = () => {
      const focusedEl = document.querySelector('.word-input:focus')
      const wordInputs = [
        ...document.getElementsByClassName('word-input'),
      ] as HTMLInputElement[]
      const currentInputIndex = wordInputs.findIndex((el) => focusedEl === el)
      if (currentInputIndex > -1) {
        wordInputs[currentInputIndex + 1]?.focus()
        wordInputs[currentInputIndex + 1]?.select()
      }
    }

    const focusPrevField = () => {
      const focusedEl = document.querySelector('.word-input:focus')
      const wordInputs = [
        ...document.getElementsByClassName('word-input'),
      ] as HTMLInputElement[]
      const currentInputIndex = wordInputs.findIndex((el) => focusedEl === el)
      if (currentInputIndex > -1) {
        wordInputs[currentInputIndex - 1]?.focus()
        wordInputs[currentInputIndex - 1]?.select()
      }
    }

    const topToolbar = (
      <Stack direction="row" mb="6" spacing="2">
        <Button
          colorScheme="primary"
          leftIcon={<AddIcon />}
          onClick={focusNewWordInput}
        >
          Add
        </Button>

        <Box ml="auto">
          <Button
            variant="outline"
            onClick={() => {
              state.isShowingImport = true
            }}
          >
            Import
          </Button>
        </Box>
      </Stack>
    )

    const handleExportCSVClick = () => {
      alert('TODO')
    }
    const handleFindAndReplaceClick = () => {
      state.isShowingFindAndReplace = true
    }

    const hasCustomizations =
      selectedOrAllWords.find(hasWordCustomizations) != null

    const handleResetDefaults = () => {
      runInAction(() => {
        selectedOrAllWords.forEach((word) => {
          resetWordDefaults(word)
        })
      })
      onAfterColorChange()
    }

    const toolbar = (
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
          /* background: hsla(225, 0%, 95%, 1); */
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

        {/* Words / selection actions */}
        <Box flex="1" ml="auto" display="flex" justifyContent="flex-end">
          <Menu isLazy placement="bottom-end">
            {selectedCount === 0 && (
              <MenuButton
                as={MenuDotsButton}
                size="sm"
                variant="ghost"
                mr="-10px"
              />
            )}
            {selectedCount > 0 && (
              <MenuButton
                as={Button}
                colorScheme="accent"
                rightIcon={<ChevronDownIcon />}
                size="sm"
              >
                {selectedCount} {pluralize('words', selectedCount)}
              </MenuButton>
            )}
            <Portal>
              <MenuTransition>
                {(styles) => (
                  // @ts-ignore
                  <MenuList css={styles}>
                    <MenuItemWithIcon
                      onClick={handleFindAndReplaceClick}
                      icon={<FiSearch />}
                    >
                      Find and replace...
                    </MenuItemWithIcon>

                    <MenuDivider />

                    <MenuItemWithIcon
                      icon={<MdFormatSize />}
                      onClick={() => {
                        for (const w of wordsToProcess) {
                          w.text = capitalize(w.text)
                        }
                        store.animateVisualize(false)
                      }}
                    >
                      Capitalize
                    </MenuItemWithIcon>
                    <MenuItemWithIcon
                      icon={<MdFormatSize />}
                      onClick={() => {
                        for (const w of wordsToProcess) {
                          w.text = w.text.toLocaleUpperCase()
                        }
                        store.animateVisualize(false)
                      }}
                    >
                      UPPERCASE
                    </MenuItemWithIcon>
                    <MenuItemWithIcon
                      icon={<MdFormatSize />}
                      onClick={() => {
                        for (const w of wordsToProcess) {
                          w.text = w.text.toLocaleLowerCase()
                        }
                        store.animateVisualize(false)
                      }}
                    >
                      lowercase
                    </MenuItemWithIcon>

                    {hasCustomizations && (
                      <MenuItemWithIcon
                        onClick={handleResetDefaults}
                        icon={<FiRefreshCw />}
                      >
                        Reset defaults
                      </MenuItemWithIcon>
                    )}

                    {selectedCount === 0 && (
                      <>
                        <MenuDivider />

                        <MenuItemWithIcon
                          onClick={handleExportCSVClick}
                          icon={<FiDownload />}
                        >
                          Export as CSV
                        </MenuItemWithIcon>
                      </>
                    )}

                    <MenuDivider />

                    <MenuItemWithIcon
                      icon={<SmallCloseIcon />}
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
                      {selectedCount > 0 ? 'Delete selected' : 'Clear the list'}
                    </MenuItemWithIcon>
                  </MenuList>
                )}
              </MenuTransition>
            </Portal>
          </Menu>
        </Box>
      </Stack>
    )

    const handleWordColorChange = useCallback(() => {
      if (target === 'shape') {
        store.editor?.setShapeItemsStyle(
          mkShapeStyleConfFromOptions(shapeStyle).items
        )
      } else {
        store.editor?.setBgItemsStyle(mkBgStyleConfFromOptions(bgStyle).items)
      }
    }, [])

    const handleWordDelete = useCallback(
      (word: WordListEntry) => {
        store.deleteWord(target, word.id)
        store.animateVisualize(false)
        if (words.wordList.length === 0) {
          focusNewWordInput()
        }
        updateSelectedWords()
      },
      [target]
    )

    const handleWordEditsSubmit = useCallback(
      (word: WordListEntry) => {
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
        updateSelectedWords()
      },
      [target]
    )

    const handleSelectionChange = useCallback(
      (word: WordListEntry, isSelected: boolean) => {
        if (isSelected) {
          state.selectedWords.add(word.id)
        } else {
          state.selectedWords.delete(word.id)
        }
      },
      [target]
    )

    return (
      <Box overflow="hidden" height="calc(100vh - 60px)">
        <>
          <Box
            px="5"
            py="6"
            pb="0"
            zIndex={100}
            position="relative"
            css={
              allWords.length > 0 &&
              css`
                box-shadow: 0 0 10px 0 #0003;
              `
            }
          >
            <LeftPanelTargetLayerDropdown />
            {topToolbar}
            {allWords.length > 0 && toolbar}
          </Box>

          <Box
            px="5"
            overflowY="hidden"
            overflowX="hidden"
            mx="-20px"
            display="flex"
            flexDirection="column"
            height="calc(100vh - 258px)"
          >
            {allWords.length > 0 && (
              <Box flex="1" width="100%" py="3">
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
                  <Droppable
                    droppableId="droppable"
                    mode="virtual"
                    renderClone={(provided, snapshot, rubric) => (
                      <WordListRow
                        style={provided.draggableProps.style}
                        isSelected={state.selectedWords.has(
                          filteredWords[rubric.source.index].id
                        )}
                        provided={provided}
                        snapshot={snapshot}
                        word={filteredWords[rubric.source.index]}
                        showDragHandle={!state.textFilter}
                      />
                    )}
                  >
                    {(provided, snapshot) => {
                      const itemsCount = snapshot.isUsingPlaceholder
                        ? filteredWords.length + 1
                        : filteredWords.length

                      return (
                        <AutoSizer defaultWidth={300} defaultHeight={600}>
                          {({ height, width }) => (
                            <List
                              overscanCount={3}
                              height={height}
                              itemCount={itemsCount}
                              itemSize={40}
                              width={width}
                              ref={listRef}
                              outerRef={provided.innerRef}
                              itemData={{
                                words: filteredWords,
                                props: {
                                  onSelectedChange: handleSelectionChange,
                                  focusNextField,
                                  focusPrevField,
                                  onDelete: handleWordDelete,
                                  onSubmit: handleWordEditsSubmit,
                                  onAfterColorChange: handleWordColorChange,
                                },
                              }}
                            >
                              {ListRow}
                            </List>
                          )}
                        </AutoSizer>
                      )
                    }}
                  </Droppable>
                </DragDropContext>
              </Box>
            )}

            {allWords.length === 0 && (
              <Box px="20px" mt="1rem" mb="5">
                <EmptyStateWordsUi target={target} />
              </Box>
            )}

            {/* NEW WORD INPUT */}
            {!state.textFilter && (
              <Observer>
                {() => (
                  <NewWordInput
                    isPinned={allWords.length > 0}
                    onAddClick={() => handleNewWordInputSubmit()}
                    inputRef={newWordInputRef}
                    inputProps={{
                      value: state.newWordText,
                      onChange: (e: any) => {
                        state.newWordText = e.target.value
                      },
                      onKeyDown: (e: React.KeyboardEvent) => {
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
                      },
                    }}
                  />
                )}
              </Observer>
            )}
          </Box>
        </>

        <ImportWordsModal
          isOpen={state.isShowingImport}
          onClose={() => {
            state.isShowingImport = false
          }}
          onImported={({ words, clearExistingBeforeImporting }) => {
            if (clearExistingBeforeImporting) {
              style.items.words.wordList = []
            }
            store.addWords(target, words)

            store.animateVisualize(false)
            state.isShowingImport = false
          }}
        />

        <FindAndReplaceModal
          onSubmit={({ find, replace }) => {
            state.isShowingFindAndReplace = false

            let count = 0
            for (const w of wordsToProcess) {
              if (w.text.includes(find)) {
                count++
              }
              w.text = w.text.replace(find, replace)
            }

            toasts.showSuccess({
              title: `Replaced ${count} ${pluralize('occurance', count)}`,
            })
          }}
          isOpen={state.isShowingFindAndReplace}
          onClose={() => {
            state.isShowingFindAndReplace = false
          }}
        />
      </Box>
    )
  }
)

const ListRow = React.memo<ListChildComponentProps>(
  ({ data, index, style }) => {
    const word = data.words[index]
    if (!word) {
      return null
    }
    return (
      <Draggable key={word.id} draggableId={word.id} index={index}>
        {(provided, snapshot) => (
          <WordListRow
            provided={provided}
            snapshot={snapshot}
            word={word}
            showDragHandle={!state.textFilter}
            isSelected={state.selectedWords.has(word.id)}
            style={{ ...provided.draggableProps.style, ...style }}
            {...data.props}
          />
        )}
      </Draggable>
    )
  },
  areEqual
)

const WordListRow: React.FC<
  {
    style?: React.CSSProperties
    isSelected: boolean
    onSelectedChange?: (word: WordListEntry, isSelected: boolean) => void
    provided: DraggableProvided
    snapshot: DraggableStateSnapshot
    word: WordListEntry
    showDragHandle?: boolean
    onDelete?: (word: WordListEntry) => void
    onSubmit?: (word: WordListEntry) => void
    onAfterColorChange?: () => void
    focusNextField?: () => void
    focusPrevField?: () => void
  } & { [key: string]: any }
> = observer(
  ({
    word,
    isSelected,
    onSelectedChange = noop,
    onAfterColorChange = noop,
    showDragHandle = true,
    provided,
    snapshot,
    onSubmit = noop,
    onDelete = noop,
    focusNextField = noop,
    focusPrevField = noop,
    style = {},
    ...otherProps
  }) => {
    const handleResetDefaults = () => {
      runInAction(() => {
        resetWordDefaults(word)
      })
      onAfterColorChange()
    }

    let customizeTrigger = (
      <WordCustomizeButton
        color="gray.500"
        width="40px"
        size="sm"
        variant="ghost"
        css={css`
          height: 40px;
        `}
      >
        <FaCog />
      </WordCustomizeButton>
    )

    const hasCustomizations = hasWordCustomizations(word)

    if (hasCustomizations) {
      customizeTrigger = (
        <Button
          color="gray.500"
          size="sm"
          variant="ghost"
          css={css`
            height: 40px;
          `}
        >
          {(word.repeats ?? -1) !== -1 && <Box mr="2">{word.repeats}</Box>}
          {word.color != null && (
            <ColorSwatchButton
              as="span"
              kind="color"
              color={word.color || 'black'}
              css={css`
                margin-right: 5px;
                min-width: 30px;
                width: 30px;
                height: 30px;
              `}
            />
          )}
          <FaCog />
        </Button>
      )
    }

    let repeatValue = 'repeat'
    if (word.repeats === 1) {
      repeatValue = 'once'
    } else if ((word.repeats ?? -1) > 1) {
      repeatValue = 'custom'
    }

    const wordCustomizeControl = (
      <CustomizeWordPopover
        trigger={customizeTrigger}
        word={word}
        onAfterColorChange={onAfterColorChange}
      />
    )

    const wordMenu = (
      <Menu isLazy placement="bottom-end">
        <MenuButton
          as={WordMenuButton}
          ml="2"
          size="sm"
          mr="-10px"
          variant="ghost"
        />

        <Portal>
          <MenuTransition>
            {(styles) => (
              // @ts-ignore
              <MenuList css={styles}>
                {hasCustomizations && (
                  <MenuItemWithIcon
                    icon={<FiRefreshCw />}
                    onClick={handleResetDefaults}
                  >
                    Reset defaults
                  </MenuItemWithIcon>
                )}
                <MenuItemWithIcon
                  icon={<SmallCloseIcon />}
                  onClick={() => {
                    onDelete(word)
                  }}
                >
                  Delete
                </MenuItemWithIcon>
              </MenuList>
            )}
          </MenuTransition>
        </Portal>
      </Menu>
    )

    return (
      <WordRow
        {...otherProps}
        aria-label=""
        ref={provided.innerRef}
        tabIndex={-1}
        css={css`
          ${snapshot.isDragging &&
          `
          box-shadow: 0 0 10px 0 #0003;
          border-bottom: none !important;
          background: white;
        `}

          &:hover, &:focus-within {
            background-color: hsla(220, 71%, 98%, 1);
          }

          ${isSelected &&
          `
            background-color: hsla(220, 71%, 95%, 1);

            &:hover, &:focus-within {
              background-color: hsla(220, 71%, 94%, 1);
            }
          `}
        `}
        {...provided.draggableProps}
        style={style}
      >
        <Box color="gray.400" {...provided.dragHandleProps}>
          <DragIndicator
            size="20px"
            css={css`
              visibility: ${!showDragHandle ? 'hidden' : 'visible'};
              position: relative;
              top: -2px;
              cursor: grab;
            `}
          />
        </Box>

        <Checkbox
          isChecked={isSelected}
          onChange={() => {
            onSelectedChange(word, !isSelected)
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
            word.text = e.target.value
          }}
          onBlur={() => {
            onSubmit(word)
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              onSubmit(word)
              focusNextField()
            } else if (e.key === 'Tab') {
              onSubmit(word)
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

        {wordCustomizeControl}
        {wordMenu}
      </WordRow>
    )
  }
)

const NewWordInput: React.FC<{
  isPinned?: boolean
  inputRef: any
  inputProps: InputProps
  onAddClick: () => void
}> = ({ inputProps, inputRef, onAddClick, isPinned }) => {
  return (
    <WordRowNewInput
      css={css`
        ${isPinned &&
        `
        box-shadow: 0 0 8px 0 #00000025;
        // background-color: hsla(225, 0%, 95%, 1);
        padding-bottom: 16px;
        `}
      `}
    >
      <InputGroup flex={1}>
        <WordInput
          {...inputProps}
          className="word-input"
          autocomplete="off"
          spellcheck="false"
          autocorrect="off"
          flex="1"
          ref={inputRef}
          hasBorder
          placeholder="Type new word here..."
        />
        <InputRightElement
          px="0"
          width="80px"
          children={
            <Button
              px="3"
              width="100%"
              colorScheme="primary"
              onClick={onAddClick}
            >
              Add
            </Button>
          }
        />
      </InputGroup>
    </WordRowNewInput>
  )
}

const resetWordDefaults = (word: WordListEntry) => {
  word.repeats = -1
  word.color = undefined
  word.angle = undefined
  word.fontId = undefined
}

const hasWordCustomizations = (word: WordListEntry) =>
  word.angle != null ||
  word.fontId != null ||
  (word.repeats ?? -1) != -1 ||
  word.color != null

const WordInput = styled(Input)<{ hasBorder?: boolean }>`
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

const WordMenuButton = styled(MenuDotsButton)``
const WordDeleteButton = styled(DeleteButton)``
const WordCustomizeButton = styled(Button)``

const WordRow = styled(Box)`
  width: 100%;
  padding: 0;
  padding-left: 10px;
  padding-right: 20px;

  display: flex;
  align-items: center;

  ${WordDeleteButton}, ${WordCustomizeButton}, ${WordMenuButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  position: relative;
  z-index: 19;

  &:hover {
    z-index: 20;
    ${WordDeleteButton}, ${WordCustomizeButton}, ${WordMenuButton} {
      opacity: 1;
    }
  }
`

const WordRowNewInput = styled(WordRow)`
  padding: 8px 16px;
  padding-top: 16px;
  border: none;
  position: relative;
  z-index: 100;
`

const EmptyStateWordsUi: React.FC<{
  target: TargetKind
  children?: React.ReactNode
}> = ({ target, children }) => (
  <Box
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
      After you add words, hit Visualize
      <br /> to see the result!
    </Text>

    {children}
  </Box>
)
