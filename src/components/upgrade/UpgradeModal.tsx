import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/core'
import { observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import { PricingPlans } from 'components/pages/PricingPage/PricingPlans'
import css from '@emotion/css'

export type UpgradeModalVariant =
  | 'generic'
  | 'hq-download'
  | 'folder-limits'
  | 'design-limits'
  | 'custom-fonts'
  | 'custom-images'

export type UpgradeModalProps = {
  variant: UpgradeModalVariant
  isOpen: boolean
  onClose: () => void
}

export const UpgradeModal: React.FC<UpgradeModalProps> = observer(
  ({ variant, isOpen, onClose }) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose} trapFocus={false}>
        <ModalOverlay>
          <ModalContent
            css={css`
              margin-left: 20px;
              margin-right: 20px;
              width: 100%;
              max-width: 900px;
            `}
          >
            <ModalHeader>Upgrade: {variant}</ModalHeader>

            <ModalBody>
              <PricingPlans />
            </ModalBody>

            <ModalCloseButton />
          </ModalContent>
        </ModalOverlay>
      </Modal>
    )
  }
)

export const state = observable({
  isOpen: false,
  variant: null as UpgradeModalVariant | null,
})

export const UpgradeModalContainer = observer(() => {
  const { isOpen, variant } = state
  return (
    <UpgradeModal
      isOpen={isOpen}
      variant={variant || 'generic'}
      onClose={() => {
        state.isOpen = false
      }}
    />
  )
})

export const useUpgradeModal = () => {
  return {
    show: (variant: UpgradeModalVariant) => {
      runInAction(() => {
        state.variant = variant
        state.isOpen = true
      })
    },
    hide: () => {
      state.isOpen = false
    },
  }
}
