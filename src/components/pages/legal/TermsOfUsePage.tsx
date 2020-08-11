import { Box, Text } from '@chakra-ui/core'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { observer } from 'mobx-react'
import React from 'react'
import { NextSeo } from 'next-seo'

export const TermsOfUsePage = observer(() => {
  return (
    <SiteLayout>
      <Box>
        <NextSeo noindex={true} title="Terms of Use" />

        <Box mb="6rem">
          <Box
            display="flex"
            flexDirection="column"
            maxWidth="600px"
            textAlign="center"
            mx="auto"
          >
            <Text as="h1" textAlign="center">
              TODO
            </Text>
          </Box>
        </Box>
      </Box>
    </SiteLayout>
  )
})
