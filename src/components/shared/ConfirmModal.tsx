import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/core'
import { Button } from 'components/shared/Button'
import { observer } from 'mobx-react'
import { useState } from 'react'

export type ConfirmModalProps = {
  children?: React.ReactNode
  title: string
  isOpen: boolean
  submitText?: string
  cancelText?: string
  onCancel: () => void
  onSubmit: () => Promise<void>
}

export const ConfirmModal: React.FC<ConfirmModalProps> = observer(
  ({
    title,
    children,
    isOpen,
    cancelText = 'Cancel',
    submitText = 'Yes',
    onCancel,
    onSubmit,
  }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
      setIsSubmitting(true)
      try {
        await onSubmit()
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Modal size="sm" isOpen={isOpen} onClose={onCancel}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>

          <ModalBody>{children}</ModalBody>

          <ModalFooter>
            <Button ml="3" variant="ghost" onClick={() => onCancel()}>
              {cancelText}
            </Button>
            <Button
              ml="3"
              variantColor="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {submitText}
            </Button>
          </ModalFooter>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
    )
  }
)
