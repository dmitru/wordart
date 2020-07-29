import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { PricingPlans } from 'components/pages/PricingPage/PricingPlans'
import { observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import Link from 'next/link'
import { Urls } from 'urls'

export type UpgradeModalVariant =
  | 'generic'
  | 'hq-download'
  | 'folder-limits'
  | 'design-limits'
  | 'custom-fonts'
  | 'custom-images'

const getTitle = (variant: UpgradeModalVariant) => {
  if (variant === 'hq-download') {
    return 'Upgrade to download images for commercial use in high quality, use custom images and fonts and more!'
  }
  if (variant === 'folder-limits') {
    return `You've reached a limit on number of folders you can create in your account. Upgrade now to create more folders, download images for commercial use in high quality, use custom images and fonts and more!`
  }
  if (variant === 'design-limits') {
    return `You've reached a limit on number of designs you can save to your account. Upgrade now to save more designs, download images for commercial use in high quality, upload custom images and fonts and more!`
  }
  if (variant === 'custom-fonts') {
    return `Please upgrade to upload your own custom fonts, download images for commercial use in high quality, upload custom images and fonts and more!`
  }
  if (variant === 'custom-images') {
    return `Please upgrade to use your own custom images, download images for commercial use in high quality, upload custom images and fonts and more!`
  }
  return 'Upgrade now to download images for commercial use in high quality, use custom images and fonts and more!'
}

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
            <ModalBody>
              <Text
                textAlign="center"
                mt="1.5rem"
                mb="0"
                fontWeight="normal"
                fontSize="lg"
              >
                {getTitle(variant)}
              </Text>
              <Text textAlign="center" mt="4" mb="0" color="gray.500">
                Learn more about our plans on{' '}
                <Link passHref href={Urls.pricing}>
                  <a target="_blank">our Pricing FAQ page</a>
                </Link>
                .
              </Text>
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
