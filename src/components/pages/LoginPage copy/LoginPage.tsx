import { css } from '@emotion/react'
import { SiteLayout } from './node_modules/components/layouts/SiteLayout/SiteLayout'
import { Box } from './node_modules/components/shared/Box'
import { Button } from './node_modules/components/shared/Button'
import { TextInputField } from './node_modules/components/shared/formik/TextInputField'
import { Form, Formik } from 'formik'
import './node_modules/lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from './node_modules/services/root-store'
import * as Yup from 'yup'
import { Urls } from './node_modules/urls'
import { SpinnerSplashScreen } from './node_modules/components/shared/SpinnerSplashScreen'
import { useRouter } from 'next/dist/client/router'

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

          <Formik
            validationSchema={loginSchema}
            initialValues={
              { emailOrUsername: '', password: '' } as LoginFormValues
            }
            onSubmit={(values) => authStore.loginWithEmailOrUsername(values)}
          >
            {({ isSubmitting, errors }) => (
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
              </Form>
            )}
          </Formik>
        </Box>
      )}
    </SiteLayout>
  )
})
