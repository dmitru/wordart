import { Box, Button, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import React from 'react'
import { FaStar } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import fromNow from 'fromnow'

export function AccountUsage() {
  const {
    authStore: { profile },
    wordcloudsStore,
  } = useStore()
  const upgradeModal = useUpgradeModal()

  let content = null
  if (
    profile &&
    profile.limits.isActiveUnlimitedPlan &&
    !!profile.unlimitedPlanExpiresAt
  ) {
    content = (
      <>
        <Text color="gray.600" mt="0" fontSize="sm" mb="0">
          Your unlimited plan expires in <br />
          {`${fromNow(profile.unlimitedPlanExpiresAt!)} (at ${new Date(
            profile.unlimitedPlanExpiresAt!
          ).toLocaleString()})`}
          .
        </Text>
      </>
    )
  }

  if (profile && !profile.limits.isActiveUnlimitedPlan) {
    content = (
      <>
        <Text color="gray.600" mt="0" fontSize="sm" mb="0">
          <strong>Free account limits:</strong>{' '}
          {wordcloudsStore.wordclouds.length} / {profile.limits.maxWordclouds}{' '}
          designs
        </Text>
        <Button
          colorScheme="primary"
          size="sm"
          mt="3"
          onClick={() => upgradeModal.show('generic')}
        >
          <FaStar
            css={css`
              margin-right: 5px;
            `}
          />{' '}
          Upgrade to Unlimited
        </Button>
      </>
    )
  }

  if (!content) {
    return null
  }

  return (
    <Box bg="gray.100" p="3" borderRadius="lg">
      {content}
    </Box>
  )
}
