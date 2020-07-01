import { Box } from '@chakra-ui/core'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { DesignsView } from 'components/pages/DashboardPage/DesignsView'
import { FoldersView } from 'components/pages/DashboardPage/FoldersView'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'

export const DashboardPage = observer(() => {
  return (
    <SiteLayout fullWidth fullHeight noFooter>
      <Box height="100%" display="flex">
        <FoldersView />
        <DesignsView />
      </Box>
    </SiteLayout>
  )
})
