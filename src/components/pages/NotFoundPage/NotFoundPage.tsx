import { Box, Text } from '@chakra-ui/core'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { observer } from 'mobx-react'
import React from 'react'
import { NextSeo } from 'next-seo'

export const NotFoundPage = observer(() => {
  return (
    <SiteLayout>
      <Box>
        <NextSeo noindex={true} title="Page not found" />

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
