import { Box, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import React from 'react'
import { FaStar } from 'react-icons/fa'
import { useStore } from 'services/root-store'

export function AccountUsage() {
  const {
    authStore: { profile },
  } = useStore()

  let content = null
  if (
    profile &&
    profile.limits.isActiveUnlimitedPlan &&
    !!profile.unlimitedPlanExpiresAt
  ) {
    content = (
      <>
        <Text color="white" mt="0" fontSize="sm" mb="0">
          <FaStar
            css={css`
              margin-right: 5px;
              display: inline-block;
            `}
          />{' '}
          Your unlimited plan expires at: <br />
          {new Date(profile.unlimitedPlanExpiresAt).toLocaleString()}
        </Text>
      </>
    )
  }

  if (!content) {
    return null
  }

  return (
    <Box bg="primary.500" p="3" borderRadius="lg">
      {content}
    </Box>
  )
}
