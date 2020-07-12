import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
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
      <Box
        bg="white"
        mt="3rem"
        mx="auto"
        maxWidth="400px"
        p="6"
        boxShadow="lg"
        borderRadius="lg"
      >
        <h1
          css={css`
            border: none;
            margin-top: 1rem;
            text-align: center;
          `}
        >
          Log in to Your Account
        </h1>

        <Stack spacing="2rem" mt="3rem">
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

            {error && <Text color="red.500">{error}</Text>}
          </Stack>

          <Stack flex="1" spacing="3" pt="1rem" mb="5" justifyContent="center">
            <Button
              as="a"
              colorScheme="primary"
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`}
            >
              Log in with Google
            </Button>
            <Button
              as="a"
              colorScheme="facebook"
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/facebook`}
            >
              Log in with Facebook
            </Button>
          </Stack>
        </Stack>

        <Box mt="1rem" display="flex" flexDirection="column">
          <Text color="gray.500" mt="6" fontSize="lg" textAlign="center">
            Don't have an account?
          </Text>
          <Link passHref href={Urls.signup}>
            <Button as="a" colorScheme="accent">
              Create account
            </Button>
          </Link>
        </Box>
      </Box>
    </SiteFormLayout>
  )
})
