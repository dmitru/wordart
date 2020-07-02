import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Box,
} from '@chakra-ui/core'
import { Button } from 'components/shared/Button'
import { observer } from 'mobx-react'
import { useState } from 'react'
import { Folder } from 'services/api/types'
import { useStore } from 'services/root-store'
import css from '@emotion/css'
import { Spinner } from 'components/Editor/components/Spinner'
import { FaRegFolder } from 'react-icons/fa'

export type MoveToFolderModalProps = {
  title: string
  children?: React.ReactNode
  isOpen: boolean
  onCancel: () => void
  onSubmit: (folder: Folder | null) => Promise<void>
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = observer(
  ({ title, isOpen, children, onCancel, onSubmit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { wordcloudsStore: store } = useStore()

    const handleSubmit = async (folder: Folder | null) => {
      setIsSubmitting(true)
      try {
        await onSubmit(folder)
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Modal size="sm" isOpen={isOpen} onClose={onCancel}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>

          <ModalBody>
            {children}
            <Box mt="4">
              {isSubmitting && (
                <Box display="flex" alignItems="center" height="100px">
                  <Spinner />
                </Box>
              )}

              {!isSubmitting && (
                <Box maxHeight="400px" overflowY="auto" py="3" px="2">
                  <Box>
                    <Button
                      width="100%"
                      py="3"
                      px="2"
                      justifyContent="flex-start"
                      variant="link"
                      css={css``}
                      onClick={() => handleSubmit(null)}
                    >
                      No folder
                    </Button>
                  </Box>

                  {!isSubmitting &&
                    store.folders.map((f) => (
                      <Box key={f.id}>
                        <Button
                          width="100%"
                          justifyContent="flex-start"
                          py="3"
                          px="2"
                          variant="link"
                          css={css``}
                          onClick={() => handleSubmit(f)}
                        >
                          <Box mr="2" fontSize="lg" color="gray.500">
                            <FaRegFolder />
                          </Box>
                          {f.title}
                        </Button>
                      </Box>
                    ))}
                </Box>
              )}
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button ml="3" variant="ghost" onClick={() => onCancel()}>
              Cancel
            </Button>
          </ModalFooter>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
    )
  }
)
