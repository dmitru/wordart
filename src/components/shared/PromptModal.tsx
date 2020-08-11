import {
  Button,
  Input,
  InputProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/core'
import { observer } from 'mobx-react'
import { ChangeEvent, useEffect, useState } from 'react'

export type PromptModalProps = {
  title: string
  initialValue?: string
  submitText?: string
  isSubmitEnabled?: (value: string) => boolean
  isOpen: boolean
  onCancel: () => void
  onSubmit: (value: string) => Promise<void>
  inputProps?: Partial<InputProps>
}

export const PromptModal: React.FC<PromptModalProps> = observer(
  ({
    title,
    isOpen,
    onCancel,
    children = null,
    isSubmitEnabled = () => true,
    onSubmit,
    submitText = 'OK',
    initialValue = '',
    inputProps = {},
  }) => {
    const [value, setValue] = useState(initialValue)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
      setValue(initialValue)
    }, [isOpen, initialValue])

    const handleSubmit = async () => {
      setIsSubmitting(true)
      try {
        await onSubmit(value)
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Modal size="sm" isOpen={isOpen} onClose={onCancel}>
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>{title}</ModalHeader>

            <ModalBody>
              {children}
              <Input
                {...inputProps}
                value={value}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    handleSubmit()
                  }
                }}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setValue(e.target.value)
                }
              />
            </ModalBody>

            <ModalFooter>
              <Button ml="3" variant="ghost" onClick={() => onCancel()}>
                Cancel
              </Button>
              <Button
                ml="3"
                colorScheme="primary"
                onClick={handleSubmit}
                isDisabled={!isSubmitEnabled(value)}
                isLoading={isSubmitting}
              >
                {submitText}
              </Button>
            </ModalFooter>

            <ModalCloseButton />
          </ModalContent>
        </ModalOverlay>
      </Modal>
    )
  }
)
