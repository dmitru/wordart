import {
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  ModalHeader,
  Box,
} from '@chakra-ui/core'
import { Button } from 'components/shared/Button'
import { observer } from 'mobx-react'
import { FaExclamationCircle } from 'react-icons/fa'

export type WarningModalProps = {
  children?: React.ReactNode
  header?: string
  content?: string
  isOpen: boolean
  onClose: () => void
}

export const WarningModal: React.FC<WarningModalProps> = observer(
  ({ isOpen, onClose, header, content, children }) => {
    return (
      <Modal size="md" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          {header && <ModalHeader>{header}</ModalHeader>}
          <ModalBody>
            <Box
              mb="1rem"
              mx="auto"
              bg="primary.50"
              color="primary.300"
              width="90px"
              height="90px"
              fontSize="60px"
              borderRadius="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <FaExclamationCircle />
            </Box>
            {content && <Text>{content}</Text>}
            {children}
          </ModalBody>

          <ModalFooter>
            <Button width="100%" variantColor="primary" onClick={onClose}>
              OK
            </Button>
          </ModalFooter>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
    )
  }
)
