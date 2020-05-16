import { css } from '@emotion/react'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { Box } from 'components/shared/Box'
import { Button } from 'components/shared/Button'
import { TextInputField } from 'components/shared/formik/TextInputField'
import { Form, Formik } from 'formik'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { useStore } from 'services/root-store'
import * as Yup from 'yup'
import { Urls } from 'urls'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import { useRouter } from 'next/dist/client/router'
import { ApiResponseError } from 'services/api/api-client'

export type LoginFormValues = {
  emailOrUsername: string
  password: string
}

const loginSchema = Yup.object().shape({
  emailOrUsername: Yup.string().required('Please enter your username or email'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 symbols long')
    .required('Please enter your password'),
})

export const LoginPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()

  if (authStore.isLoggedIn === true) {
    router.replace(Urls.loginRedirect)
  }

  const [error, setError] = useState('')

  return (
    <SiteLayout>
      {!authStore.hasInitialized && <SpinnerSplashScreen />}

      {authStore.hasInitialized && (
        <Box
          css={css`
            max-width: 400px;
            margin: 0 auto;
            margin-bottom: 60px;
          `}
        >
          <h1>Log in</h1>

          <a href="http://localhost:3003/auth/google">Google</a>
          <a href="http://localhost:3003/auth/facebook">Facebook</a>

          <Formik
            validationSchema={loginSchema}
            initialValues={
              { emailOrUsername: '', password: '' } as LoginFormValues
            }
            onSubmit={async (values) => {
              try {
                await authStore.loginWithEmailOrUsername(values)
              } catch (error) {
                if (
                  error.isAxiosError &&
                  (error as ApiResponseError).response.status === 401
                ) {
                  setError(
                    'Incorrect email or password, please try another one'
                  )
                } else {
                  setError(
                    'Could not sign you in at this momen, please try again later'
                  )
                }
              }
            }}
          >
            {({ isSubmitting, dirty }) => (
              <Form>
                <TextInputField
                  name="emailOrUsername"
                  label="Username or email"
                />
                <TextInputField
                  type="password"
                  name="password"
                  label="Password"
                />

                <Button mt={4} primary disabled={isSubmitting} type="submit">
                  Log in
                </Button>

                {error && (
                  <Box mt={3} color="danger">
                    {error}
                  </Box>
                )}
              </Form>
            )}
          </Formik>
        </Box>
      )}
    </SiteLayout>
  )
})
