import { css } from '@emotion/react'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { Box } from 'components/shared/Box'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import React from 'react'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { Button } from 'components/shared/Button'

export const ProfilePage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()

  if (!router) {
    return (
      <SiteLayout>
        <SpinnerSplashScreen />
      </SiteLayout>
    )
  }

  if (authStore.isLoggedIn === false) {
    router.replace(Urls.login)
    return (
      <SiteLayout>
        <SpinnerSplashScreen />
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      {!authStore.hasInitialized && <SpinnerSplashScreen />}

      {authStore.hasInitialized && (
        <Box
          css={css`
            max-width: 400px;
            margin: 0 auto;
          `}
        >
          <h1>Profile</h1>

          <Button
            onClick={() => {
              authStore.logout()
            }}
          >
            Log out
          </Button>

          <pre>{JSON.stringify(authStore.profile, null, 2)}</pre>
        </Box>
      )}
    </SiteLayout>
  )
})
