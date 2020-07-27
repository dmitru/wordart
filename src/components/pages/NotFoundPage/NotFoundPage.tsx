import { Box, Text } from '@chakra-ui/core'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'
import { Helmet } from 'react-helmet'
import { getTabTitle } from 'utils/tab-title'

export const NotFoundPage = observer(() => {
  return (
    <SiteLayout>
      <Box>
        <Helmet>
          <title>{getTabTitle('Page not found')}</title>
        </Helmet>

        <Box mb="6rem">
          <Box
            display="flex"
            flexDirection="column"
            maxWidth="600px"
            textAlign="center"
            mx="auto"
          >
            <Text as="h1" textAlign="center">
              Page not found
            </Text>

            <Text>Sorry, this page is not found or no longer accessible.</Text>
          </Box>
        </Box>
      </Box>
    </SiteLayout>
  )
})
