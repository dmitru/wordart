import {
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/core'
import { Button } from 'components/shared/Button'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

export type FindAndReplaceModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { find: string; replace: string }) => void
}

const state = observable({
  find: '',
  replace: '',
})

export const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = observer(
  ({ isOpen, onClose, onSubmit }) => {
    return (
      <Modal size="md" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay>
          <ModalContent
            as="form"
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit({ find: state.find, replace: state.replace })
            }}
          >
            <ModalHeader>Find and replace</ModalHeader>

            <ModalBody>
              <Stack spacing="2">
                <Input
                  placeholder="Find text (case-sensitive!)"
                  value={state.find}
                  onChange={(e) => {
                    state.find = e.target.value
                  }}
                />
                <Input
                  placeholder="Replace text"
                  value={state.replace}
                  onChange={(e) => {
                    state.replace = e.target.value
                  }}
                />
              </Stack>
            </ModalBody>

            <ModalFooter>
              <Button ml="3" variant="ghost" onClick={onClose}>
                Cancel
              </Button>

              <Button ml="3" colorScheme="primary" type="submit">
                OK
              </Button>
            </ModalFooter>

            <ModalCloseButton />
          </ModalContent>
        </ModalOverlay>
      </Modal>
    )
  }
)
