import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Input,
  Stack,
  Text,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import { yupResolver } from '@hookform/resolvers'
import { SiteFormLayout } from 'components/layouts/SiteLayout/SiteFormLayout'
import { observer } from 'mobx-react'
import Link from 'next/link'
import { useRouter } from 'next/dist/client/router'
import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { ApiResponseError } from 'services/api/api-client'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import * as Yup from 'yup'
import { Recaptcha } from 'components/shared/recaptcha'
import { config } from 'config'
import { Api } from 'services/api/api'

export type ResetPasswordRequestFormValues = {
  email: string
}

const ResetPasswordRequestSchema = Yup.object().shape({
  email: Yup.string()
    .email('Must be a valid email')
    .required('Please enter your email'),
})

export const ResetPasswordRequestPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()
  const recaptchaRef = useRef<Recaptcha>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [error, setError] = useState('')

  const { register, getValues, handleSubmit, errors, formState } = useForm<
    ResetPasswordRequestFormValues
  >({
    resolver: yupResolver(ResetPasswordRequestSchema),
  })

  const onCaptchaResponse = async (token: string) => {
    recaptchaRef.current?.reset()

    try {
      await Api.auth.resetPasswordRequest({ ...getValues(), recaptcha: token })
      setHasSubmitted(true)
    } catch (error) {
      setError(
        'Sorry, there was a problem on our end. Please contact our support or try again later.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (values: ResetPasswordRequestFormValues) => {
    setIsSubmitting(true)
    recaptchaRef.current?.execute()
  }

  return (
    <SiteFormLayout>
      <Box
        bg="white"
        mx="auto"
        maxWidth="400px"
        p="6"
        boxShadow="lg"
        borderRadius="lg"
      >
        {hasSubmitted && (
          <>
            <h1
              css={css`
                border: none;
                margin-top: 1rem;
                text-align: center;
                margin-bottom: 0;
              `}
            >
              Check your email
            </h1>

            <Text mt="6" textAlign="center">
              We've emailed you a link to reset your password.
            </Text>

            <Text color="gray.500" textAlign="center" mt="6">
              Still having problems resetting your password? Please contact our
              support for help.
            </Text>
          </>
        )}

        {!hasSubmitted && (
          <>
            <h1
              css={css`
                border: none;
                margin-top: 1rem;
                text-align: center;
                margin-bottom: 0;
              `}
            >
              Reset your password
            </h1>

            <Stack spacing="2rem" mt="6">
              <Stack
                flex="2"
                as="form"
                onSubmit={handleSubmit(onSubmit)}
                spacing="4"
              >
                <Text>
                  Enter your email below and we'll send you instructions on how
                  to reset your password.
                </Text>

                <Recaptcha
                  sitekey={config.recaptcha.siteKey}
                  size="invisible"
                  ref={recaptchaRef}
                  onVerify={onCaptchaResponse}
                />

                <FormControl id="email">
                  <Input
                    placeholder="Your email"
                    type="email"
                    name="email"
                    ref={register}
                  />
                  {errors.email && (
                    <FormHelperText color="red.500">
                      {errors.email?.message}
                    </FormHelperText>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="primary"
                  isLoading={formState.isSubmitting || isSubmitting}
                >
                  Reset your password
                </Button>

                {error && <Text color="red.500">{error}</Text>}
              </Stack>
            </Stack>
          </>
        )}
      </Box>

      <Text color="gray.500" mt="6" textAlign="center">
        <Link passHref href={Urls.login}>
          <a>Sign in</a>
        </Link>
        {' or '}
        <Link passHref href={Urls.signup}>
          <a>create an account</a>
        </Link>{' '}
        instead.
      </Text>
    </SiteFormLayout>
  )
})
