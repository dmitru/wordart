import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { Box, Button } from '@chakra-ui/core'

export const ProfilePage = observer(() => {
  const { authStore } = useStore()

  return (
    <SiteLayout>
      <Box>
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
    </SiteLayout>
  )
})
