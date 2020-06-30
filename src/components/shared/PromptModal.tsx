import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  InputProps,
} from '@chakra-ui/core'
import { Button } from 'components/shared/Button'
import { Input } from 'components/shared/Input'
import { observer } from 'mobx-react'
import { useState, useEffect, ChangeEvent } from 'react'

export type PromptModalProps = {
  title: string
  initialValue?: string
  isOpen: boolean
  onCancel: () => void
  onSubmit: (value: string) => Promise<void>
  inputProps?: InputProps
}

export const PromptModal: React.FC<PromptModalProps> = observer(
  ({
    title,
    isOpen,
    onCancel,
    onSubmit,
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
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{title}</ModalHeader>

          <ModalBody>
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
              variantColor="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              OK
            </Button>
          </ModalFooter>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
    )
  }
)
