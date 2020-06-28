import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Stack,
  Text,
  InputRightElement,
} from '@chakra-ui/core'
import styled from '@emotion/styled'
import { ImportWordsModal } from 'components/Editor/components/ImportWordsModal'
import { SectionLabel } from 'components/Editor/components/shared'
import { TargetKind } from 'components/Editor/lib/editor'
import { Button } from 'components/shared/Button'
import { DeleteButton } from 'components/shared/DeleteButton'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { capitalize } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { WordsEditorModal } from 'components/Editor/components/WordsEditorModal'

export type LeftPanelWordsTabProps = {
  target: TargetKind
}

const state = observable({
  isShowingImport: false,
  isShowingEditor: false,
  textFilter: '',
})

export const LeftPanelWordsTab: React.FC<LeftPanelWordsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const words = style.items.words

    const handleAddWordClick = () => {
      const wordsList = document.getElementById('words-list')
      const inputs = wordsList
        ? wordsList.getElementsByClassName('word-input')
        : []
      const previews = wordsList
        ? wordsList.getElementsByClassName('word-preview')
        : []
      const firstInput = inputs[0] as HTMLInputElement
      const firstPreview = previews[0] as HTMLElement
      console.log(firstPreview)
      if (firstInput) {
        firstInput.focus()
      } else if (firstPreview) {
        firstPreview.click()
      } else {
        store.addWord(target)
        store.animateVisualize(false)
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
        <SectionLabel>Words list</SectionLabel>

        <Stack spacing="0">
          <Stack direction="row" mb="3" spacing="1">
            <Button
              size="sm"
              variantColor="secondary"
              leftIcon="add"
              onClick={handleAddWordClick}
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

            <Button
              size="sm"
              variant="outline"
              leftIcon="arrow-up"
              onClick={() => {
                state.isShowingImport = true
              }}
            >
              Import
            </Button>

            <Box marginLeft="auto">
              <Menu>
                <MenuButton as={MenuDotsButton} size="sm" />
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
            </Box>
          </Stack>

          <Stack direction="row" mb="4" mt="2">
            <InputGroup flex={1} size="sm">
              <InputLeftElement children={<Icon name="search" />} />
              <Input
                placeholder="Filter..."
                value={state.textFilter}
                onChange={(e: any) => {
                  state.textFilter = e.target.value
                }}
              />
              {!!state.textFilter && (
                <InputRightElement
                  onClick={() => {
                    state.textFilter = ''
                  }}
                  children={<DeleteButton size="sm" aria-label="Clear" />}
                />
              )}
            </InputGroup>
          </Stack>

          {allWords.length === 0 && (
            <Text mt="4" size="lg">
              You haven't added any words yet.
            </Text>
          )}

          {filteredWords.length > 0 && (
            <WordList mt="2" id="words-list">
              {filteredWords.map((word) => (
                <WordRow key={word.id} aria-label="">
                  <Editable
                    ml="2"
                    flex={1}
                    value={word.text}
                    onChange={(text) => {
                      text = text.trim()
                      if (text === '') {
                        store.deleteWord(target, word.id)
                      } else {
                        store.updateWord(target, word.id, {
                          text,
                        })
                      }
                      store.animateVisualize(false)
                    }}
                    selectAllOnFocus
                    placeholder="Type new word here..."
                  >
                    <EditablePreview
                      flex={1}
                      width="100%"
                      py="2"
                      className={word.text ? '' : 'word-preview'}
                    />
                    <EditableInput
                      className="word-input"
                      placeholder="Type new word here..."
                      my="2"
                    />
                  </Editable>

                  <WordDeleteButton
                    ml="2"
                    mr="2"
                    onClick={() => {
                      store.deleteWord(target, word.id)
                      store.animateVisualize(false)
                    }}
                  />
                </WordRow>
              ))}
            </WordList>
          )}
        </Stack>

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

const WordList = styled(Box)`
  height: calc(100vh - 210px);
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
    background: hsla(200, 81%, 97%, 1);
    ${WordDeleteButton} {
      opacity: 1;
    }
  }
`
