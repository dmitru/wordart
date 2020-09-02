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
  icon?: boolean
  header?: string
  content?: string
  isOpen: boolean
  onClose: () => void
}

export const WarningModal: React.FC<WarningModalProps> = observer(
  ({ icon = true, isOpen, onClose, header, content, children }) => {
    return (
      <Modal size="md" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay>
          <ModalContent>
            {header && <ModalHeader>{header}</ModalHeader>}
            <ModalBody>
              <Box display="flex" alignItems="center" flexDirection="column">
                {icon && (
                  <Box
                    mr="1rem"
                    mb="6"
                    bg="red.50"
                    color="red.300"
                    minWidth="80px"
                    height="80px"
                    fontSize="60px"
                    borderRadius="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FaExclamationCircle />
                  </Box>
                )}

                <Box>
                  {content && <Text>{content}</Text>}
                  {children}
                </Box>
              </Box>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="primary" onClick={onClose}>
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
