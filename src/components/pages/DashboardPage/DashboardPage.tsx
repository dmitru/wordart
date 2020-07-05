import { Box } from '@chakra-ui/core'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { DesignsView } from 'components/pages/DashboardPage/DesignsView'
import { FoldersView } from 'components/pages/DashboardPage/FoldersView'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import { Helmet } from 'react-helmet'
import React from 'react'
import { getTabTitle } from 'utils/tab-title'

export const DashboardPage = observer(() => {
  return (
    <SiteLayout fullWidth fullHeight noFooter>
      <Helmet>
        <title>{getTabTitle('Your Designs')}</title>
      </Helmet>

      <Box height="100%" display="flex">
        <FoldersView />
        <DesignsView />
      </Box>
    </SiteLayout>
  )
})
