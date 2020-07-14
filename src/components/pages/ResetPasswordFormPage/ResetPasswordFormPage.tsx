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
import qs from 'query-string'
import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaChevronRight } from 'react-icons/fa'
import { Api } from 'services/api/api'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import * as Yup from 'yup'

export type ResetPasswordFormFormValues = {
  password: string
  passwordRepeat: string
}

const ResetPasswordFormSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Must be at least 8 symbols long')
    .required('Please enter your email'),
  passwordRepeat: Yup.string()
    .min(8, 'Must be at least 8 symbols long')
    .required('Please enter your email'),
})

export const ResetPasswordFormPage = observer(() => {
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, errors, formState } = useForm<
    ResetPasswordFormFormValues
  >({
    resolver: yupResolver(ResetPasswordFormSchema),
  })

  const onSubmit = async (values: ResetPasswordFormFormValues) => {
    try {
      const passwordResetToken = qs.parse(window.location.search)
        ?.passwordResetToken as string
      if (!passwordResetToken) {
        throw new Error('no token')
      }
      await Api.auth.resetPassword({
        newPassword: values.password,
        passwordResetToken,
      })
      setHasSubmitted(true)
    } catch (error) {
      setError(
        'Sorry, there was a problem. Most likely the the link is correct or has expired.'
      )
    }
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
              Your password is updated
            </h1>

            <Text mt="6" textAlign="center">
              You may now use your new password to sign in.
            </Text>

            <Link href={Urls.login} passHref>
              <Button
                width="100%"
                mt="5"
                colorScheme="accent"
                as="a"
                rightIcon={<FaChevronRight />}
              >
                Sign in
              </Button>
            </Link>
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
              Reset password
            </h1>

            <Stack spacing="2rem" mt="6">
              <Stack
                flex="2"
                as="form"
                onSubmit={handleSubmit(onSubmit)}
                spacing="4"
              >
                <Text mb="0">Choose your new password:</Text>

                <FormControl id="password">
                  <Input
                    placeholder="Password"
                    type="password"
                    name="password"
                    ref={register}
                  />
                  {errors.password && (
                    <FormHelperText color="red.500">
                      {errors.password?.message}
                    </FormHelperText>
                  )}
                </FormControl>

                <FormControl id="passwordRepeat">
                  <Input
                    placeholder="Repeat same password again"
                    type="passwordRepeat"
                    name="passwordRepeat"
                    ref={register}
                  />
                  {errors.password && (
                    <FormHelperText color="red.500">
                      {errors.password?.message}
                    </FormHelperText>
                  )}
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="primary"
                  isLoading={formState.isSubmitting}
                >
                  Save password
                </Button>

                {error && <Text color="red.500">{error}</Text>}
              </Stack>
            </Stack>
          </>
        )}
      </Box>
    </SiteFormLayout>
  )
})
