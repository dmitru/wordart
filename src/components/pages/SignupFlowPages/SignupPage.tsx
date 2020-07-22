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
import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiResponseError } from 'services/api/api-client'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import * as Yup from 'yup'
import { Recaptcha } from 'components/shared/Recaptcha'
import { config } from 'config'
import { Helmet } from 'react-helmet'
import { getTabTitle } from 'utils/tab-title'

export type SignupFormValues = {
  email: string
  password: string
  passwordRepeat: string
}

const signupEmailSchema = Yup.object().shape({
  email: Yup.string()
    .email('Must be a valid email')
    .required('Please enter your email'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 symbols long')
    .required('Please enter your password'),
  passwordRepeat: Yup.string().required('Please repeat the same password'),
})

export const SignupPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()
  const recaptchaRef = useRef<Recaptcha>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    errors,
    getValues,
    formState,
    setError: setFormError,
    clearErrors,
  } = useForm<SignupFormValues>({
    resolver: yupResolver(signupEmailSchema),
  })

  const onCaptchaResponse = async (token: string) => {
    recaptchaRef.current?.reset()

    try {
      await authStore.signupWithEmail({ ...getValues(), recaptcha: token })
      router.replace(Urls.signupCompleted)
    } catch (error) {
      if (
        error.isAxiosError &&
        (error as ApiResponseError).response.status === 409
      ) {
        setError('This email is already used.')
      } else {
        setError(
          'Sorry, there was a problem on our end. Please contact our support or try again later.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (values: SignupFormValues) => {
    clearErrors()

    if (!values.password.match(/^[^\s]+$/)) {
      setFormError('password', {
        type: 'manual',
        message: 'Your password must not contain white space',
      })
      return
    }

    if (values.passwordRepeat !== values.password) {
      setFormError('passwordRepeat', {
        message: 'Passwords should match',
        type: 'manual',
      })
      return
    }

    setIsSubmitting(true)
    recaptchaRef.current?.execute()
  }

  return (
    <SiteFormLayout>
      <Helmet>
        <title>{getTabTitle('Sign up')}</title>
      </Helmet>

      <Box
        bg="white"
        mx="auto"
        maxWidth="420px"
        p="6"
        boxShadow="lg"
        borderRadius="lg"
      >
        <h1
          css={css`
            border: none;
            margin-top: 1rem;
            text-align: center;
            margin-bottom: 0;
          `}
        >
          Create Account
        </h1>

        <Stack
          spacing="1rem"
          // direction="row"
          display="flex"
          // alignItems="flex-start"
        >
          <Stack flex="1" spacing="3" mt="6" mb="4" justifyContent="center">
            <Button
              as="a"
              colorScheme="primary"
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`}
            >
              Sign up with Google
            </Button>
            <Button
              as="a"
              colorScheme="facebook"
              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/facebook`}
            >
              Sign up with Facebook
            </Button>
          </Stack>

          <Stack
            flex="2"
            as="form"
            onSubmit={handleSubmit(onSubmit)}
            spacing="4"
          >
            <Recaptcha
              sitekey={config.recaptcha.siteKey}
              size="invisible"
              ref={recaptchaRef}
              onVerify={onCaptchaResponse}
            />

            <FormControl id="email">
              <FormLabel>Email address</FormLabel>
              <Input type="email" name="email" ref={register} />
              <FormHelperText>
                We'll send you a confirmation email. We never share your data
                with anyone.
              </FormHelperText>
              {errors.email && (
                <FormHelperText color="red.500">
                  {errors.email?.message}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl id="password">
              <FormLabel>Password</FormLabel>
              <Input type="password" name="password" ref={register} />
              {errors.password && (
                <FormHelperText color="red.500">
                  {errors.password?.message}
                </FormHelperText>
              )}
            </FormControl>

            <FormControl id="passwordRepeat">
              <FormLabel>Repeat password</FormLabel>
              <Input type="password" name="passwordRepeat" ref={register} />
              {errors.passwordRepeat && (
                <FormHelperText color="red.500">
                  {errors.passwordRepeat?.message}
                </FormHelperText>
              )}
            </FormControl>

            <Button
              type="submit"
              colorScheme="accent"
              isLoading={formState.isSubmitting || isSubmitting}
            >
              Sign up
            </Button>

            {error && <Text color="red.500">{error}</Text>}
          </Stack>
        </Stack>
      </Box>

      <Text color="gray.500" mt="6" textAlign="center">
        Already have an account?{' '}
        <Link passHref href={Urls.login}>
          <a>Sign in here.</a>
        </Link>
      </Text>
    </SiteFormLayout>
  )
})
