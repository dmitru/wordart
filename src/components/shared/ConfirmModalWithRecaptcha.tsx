import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
} from '@chakra-ui/core'
import { Button } from 'components/shared/Button'
import { observer } from 'mobx-react'
import { useState, useRef, useEffect } from 'react'
import { Recaptcha } from 'components/shared/Recaptcha'
import { config } from 'config'

export type ConfirmModalWithRecaptchaProps = {
  children?: React.ReactNode
  title: string
  isOpen: boolean
  submitText?: string
  cancelText?: string
  onCancel: () => void
  onSubmit: (recaptcha: string) => Promise<void>
}

export const ConfirmModalWithRecaptcha: React.FC<ConfirmModalWithRecaptchaProps> = observer(
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
    const [hasRenderedCaptcha, setHasRenderedCaptcha] = useState(false)
    const recaptchaRef = useRef<Recaptcha>(null)

    useEffect(() => {
      if (!recaptchaRef.current) {
        setHasRenderedCaptcha(false)
      }
    }, [recaptchaRef.current])

    const handleSubmit = async () => {
      if (!recaptchaRef.current) {
        return
      }

      setIsSubmitting(true)

      recaptchaRef.current.execute()
    }

    const handleCaptchaVerify = async (recpatcha: string) => {
      try {
        recaptchaRef.current?.reset()
        await onSubmit(recpatcha)
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <>
        {isOpen && (
          <Recaptcha
            ref={recaptchaRef}
            onRender={() => setHasRenderedCaptcha(true)}
            size="invisible"
            sitekey={config.recaptcha.siteKey}
            onVerify={handleCaptchaVerify}
          />
        )}

        <Modal size="sm" isOpen={isOpen} onClose={onCancel} autoFocus={false}>
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>{title}</ModalHeader>

              <ModalBody>
                {!hasRenderedCaptcha ? <Spinner /> : children}
              </ModalBody>

              <ModalFooter>
                {hasRenderedCaptcha && (
                  <>
                    <Button ml="3" variant="ghost" onClick={() => onCancel()}>
                      {cancelText}
                    </Button>
                    <Button
                      ml="3"
                      colorScheme="primary"
                      onClick={handleSubmit}
                      isLoading={isSubmitting}
                    >
                      {submitText}
                    </Button>
                  </>
                )}
              </ModalFooter>

              <ModalCloseButton />
            </ModalContent>
          </ModalOverlay>
        </Modal>
      </>
    )
  }
)
