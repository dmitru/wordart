import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { Box } from 'components/shared/Box'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'

export const DashboardPage = observer(() => {
  const { authStore } = useStore()

  return (
    <SiteLayout>
      <Box>
        <h1>Dashboard</h1>

        <Box>TODO</Box>
      </Box>
    </SiteLayout>
  )
})
