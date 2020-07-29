import { Box, Button, Spinner, Text } from '@chakra-ui/core'
import { css } from '@emotion/core'
import { SiteFormLayout } from 'components/layouts/SiteLayout/SiteFormLayout'
import { observer } from 'mobx-react'
import Link from 'next/link'
import qs from 'query-string'
import React, { useEffect, useState } from 'react'
import { FaChevronRight } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'

export const VerifyEmailPage = observer(() => {
  const [status, setStatus] = useState('verifying')

  const { authStore } = useStore()

  useEffect(() => {
    const verify = async () => {
      try {
        const emailVerificationToken = qs.parse(window.location.search)
          ?.emailToken as string
        if (!emailVerificationToken) {
          throw new Error('no token')
        }
        await authStore.verifyEmail(emailVerificationToken)
        setStatus('success')
      } catch (error) {
        console.error(error)
        setStatus('error')
      }
    }

    verify()
  }, [])

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
        {status === 'verifying' && (
          <>
            <h2
              css={css`
                border: none;
                margin-top: 1rem;
                text-align: center;
              `}
            >
              Verifying your email...
            </h2>

            <Text mt="6" fontSize="lg">
              Please don't close the page
            </Text>

            <Spinner />
          </>
        )}

        {status === 'success' && (
          <>
            <Text
              as="h2"
              css={css`
                border: none;
                margin-top: 1rem;
                text-align: center;
              `}
            >
              Thank you!
            </Text>

            <Text mt="6">Your account is ready to use.</Text>

            <Link href={Urls.yourDesigns} passHref>
              <Button
                mt="5"
                colorScheme="accent"
                as="a"
                rightIcon={<FaChevronRight />}
              >
                Continue to the app
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <Text
              color="red.500"
              as="h2"
              css={css`
                border: none;
                margin-top: 1rem;
                text-align: center;
              `}
            >
              Sorry, there was a problem
            </Text>

            <Text mt="6">
              Most likely the verification link is invalid. Please follow the
              link we've sent to your email address.
            </Text>

            <Text>
              If the problem persists, please contact our support for help.
            </Text>
          </>
        )}
      </Box>
    </SiteFormLayout>
  )
})
