import { Box, Text } from '@chakra-ui/core'
import styled from '@emotion/styled'
import { Theme } from 'chakra'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { ContactForm } from 'components/shared/ContactForm'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React from 'react'
import { Helmet } from 'react-helmet'
import { Urls } from 'urls'
import { getTabTitle } from 'utils/tab-title'

export const ContactPage = observer(() => {
  return (
    <SiteLayout>
      <Box>
        <Helmet>
          <title>{getTabTitle('Contact')}</title>
        </Helmet>

        <Box mb="6rem">
          <Box id="Contact" mt="1.5rem" maxWidth="700px" mx="auto">
            <h1>Contact Form</h1>

            <Box>TODO</Box>

            <Box>
              <ContactForm />
            </Box>
          </Box>
        </Box>
      </Box>
    </SiteLayout>
  )
})
