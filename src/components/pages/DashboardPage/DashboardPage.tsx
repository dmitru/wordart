import { Box } from '@chakra-ui/core'
import { SiteLayoutFullWidth } from 'components/layouts/SiteLayout/SiteLayout'
import { DesignsView } from 'components/pages/DashboardPage/DesignsView'
import { FoldersView } from 'components/pages/DashboardPage/FoldersView'
import { observer } from 'mobx-react'
import React from 'react'
import { Helmet } from 'react-helmet'
import { getTabTitle } from 'utils/tab-title'

export const DashboardPage = observer(() => {
  return (
    <SiteLayoutFullWidth fullHeight noFooter>
      <Helmet>
        <title>{getTabTitle('Your Designs')}</title>
      </Helmet>

      <Box height="100%" display="flex">
        <FoldersView />
        <DesignsView />
      </Box>
    </SiteLayoutFullWidth>
  )
})
