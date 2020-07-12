import { Box, Text } from '@chakra-ui/core'
import { css } from '@emotion/core'
import { SiteFormLayout } from 'components/layouts/SiteLayout/SiteFormLayout'
import { observer } from 'mobx-react'
import React from 'react'

export const SignupCompletedPage = observer(() => {
  return (
    <SiteFormLayout>
      <Box
        bg="white"
        mt="3rem"
        mx="auto"
        maxWidth="520px"
        p="6"
        boxShadow="lg"
        borderRadius="lg"
        textAlign="center"
      >
        <h2
          css={css`
            border: none;
            margin-top: 1rem;
            text-align: center;
          `}
        >
          Almost there!
        </h2>

        <Text mt="6" fontSize="lg">
          To finish setting up your account, please verify your email.
          <br />
          Click on the verification link we've sent to you.
        </Text>

        <Text color="gray.500" mt="6" fontSize="sm">
          Didn't receive the email? Please wait for up to 10 minutes and don't
          forget to check your Spam folder.
          <br />
          <br /> Still having problems? Contact our support for help.
        </Text>
      </Box>
    </SiteFormLayout>
  )
})
