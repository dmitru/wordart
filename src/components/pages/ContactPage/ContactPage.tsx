import { Box, Text } from '@chakra-ui/core'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { ContactForm } from 'components/shared/ContactForm'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React from 'react'
import { Helmet } from 'react-helmet'
import { config } from 'config'
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

            <Box maxWidth="600px">
              <Text>
                You can contact us with this form, or send us an email to{' '}
                <a href={`mailto://${config.supportEmail}`}>
                  {config.supportEmail}
                </a>
                .
              </Text>
              <Text>We're trying to answer all messages within 24 hours.</Text>
            </Box>

            <Box>
              <ContactForm />
            </Box>
          </Box>
        </Box>
      </Box>
    </SiteLayout>
  )
})
