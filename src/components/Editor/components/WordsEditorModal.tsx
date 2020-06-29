import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/core'
import styled from '@emotion/styled'
import { TargetKind } from 'components/Editor/lib/editor'
import { Button } from 'components/shared/Button'
import { DeleteButton } from 'components/shared/DeleteButton'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'

export type WordsEditorModalProps = {
  target: TargetKind
  isOpen: boolean
  onClose: () => void
}

const state = observable({})

export const WordsEditorModal: React.FC<WordsEditorModalProps> = observer(
  ({ isOpen, onClose, target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const words = style.items.words

    const fonts = store.getAvailableFonts()

    return (
      <Modal size="md" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit words list</ModalHeader>

          <ModalBody>
            {words.wordList.length > 0 && (
              <WordList mt="2">
                {words.wordList.map((word) => (
                  <WordRow key={word.id} aria-label="">
                    <Editable
                      ml="2"
                      flex={1}
                      value={word.text}
                      onChange={(text) => {
                        store.updateWord(target, word.id, {
                          text,
                        })
                        store.animateVisualize(false)
                      }}
                      selectAllOnFocus
                      placeholder="Type new word here..."
                    >
                      <EditablePreview flex={1} width="100%" />
                      <EditableInput placeholder="Type new word here..." />
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
          </ModalBody>

          <ModalFooter>
            <Button ml="3" variantColor="accent" onClick={onClose}>
              Done
            </Button>
          </ModalFooter>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
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
  padding: 5px 0;
  display: flex;

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
