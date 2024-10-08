import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Input,
  Stack,
  Divider,
  Text,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import { yupResolver } from '@hookform/resolvers'
import { SiteFormLayout } from 'components/layouts/SiteLayout/SiteFormLayout'
import { observer } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import Link from 'next/link'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiResponseError } from 'services/api/api-client'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import * as Yup from 'yup'
import { Helmet } from 'react-helmet'
import { getTabTitle } from 'utils/tab-title'
import { FaFacebook, FaGoogle } from 'react-icons/fa'

export type LoginFormValues = {
  email: string
  password: string
}

const loginEmailSchema = Yup.object().shape({
  email: Yup.string()
    .email('Must be a valid email')
    .required('Please enter your email'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 symbols long')
    .required('Please enter your password'),
})

export const LoginPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()

  const [error, setError] = useState('')

  const { register, handleSubmit, errors, formState } = useForm<
    LoginFormValues
  >({
    resolver: yupResolver(loginEmailSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await authStore.loginWithEmail(values)
      router.replace(Urls.loginRedirect)
    } catch (error) {
      if (
        error.isAxiosError &&
        (error as ApiResponseError).response.status === 401
      ) {
        setError('Email or password is incorrect.')
      } else {
        setError(
          'Sorry, there was a problem on our end. Please contact our support or try again later.'
        )
      }
    }
  }

  return (
    <SiteFormLayout>
      <Helmet>
        <title>{getTabTitle('Log in')}</title>
      </Helmet>

      <Box
        bg="white"
        mx="auto"
        maxWidth="420px"
        p="6"
        boxShadow="lg"
        borderRadius="lg"
      >
        <Text
          as="h1"
          fontSize="1.5rem"
          css={css`
            border: none;
            margin-top: 1rem;
            text-align: center;
            margin-bottom: 0;
          `}
        >
          Log in to Your Account
        </Text>

        <Stack spacing="6" mt="6">
          <Stack flex="1" spacing="3" mb="5" justifyContent="center">
            <Button
              as="a"
              colorScheme="red"
              leftIcon={<FaGoogle />}
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`}
            >
              Sign in with Google
            </Button>
            <Button
              as="a"
              colorScheme="facebook"
              leftIcon={<FaFacebook />}
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/facebook`}
            >
              Sign in with Facebook
            </Button>
          </Stack>

          <Divider />

          <Stack
            flex="2"
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            spacing="4"
          >
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

            <Button
              type="submit"
              colorScheme="primary"
              isLoading={formState.isSubmitting}
            >
              Log in
            </Button>

            <Box mt="3" mb="3">
              <Link passHref href={Urls.resetPasswordRequest}>
                <a>Forgot your password?</a>
              </Link>
            </Box>

            {error && <Text color="red.500">{error}</Text>}
          </Stack>
        </Stack>

        <Box mt="1rem" display="flex" flexDirection="column">
          <Text color="gray.500" mt="6" fontSize="lg" textAlign="center">
            Don't have an account?
          </Text>
          <Link passHref href={Urls.signup}>
            <Button as="a" colorScheme="accent">
              Create an account
            </Button>
          </Link>
        </Box>
      </Box>
    </SiteFormLayout>
  )
})
