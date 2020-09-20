import { Box, Text, Button } from '@chakra-ui/core'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { ContactForm } from 'components/shared/ContactForm'
import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import { config } from 'config'
import { getTabTitle } from 'utils/tab-title'
import { useToasts } from 'use-toasts'

export const ContactPage = observer(() => {
  const toasts = useToasts()
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleSubmit = () => {
    toasts.showSuccess({ title: 'Your message has been sent!' })
    setHasSubmitted(true)
  }

  return (
    <SiteLayout>
      <Box>
        <Helmet>
          <title>{getTabTitle('Contact')}</title>
        </Helmet>

        <Box mb="6rem">
          <Box mt="1.5rem" maxWidth="700px" mx="auto">
            {hasSubmitted ? (
              <>
                <h1>Thank you!</h1>

                <Text>
                  We've received your message and will try to reply to the
                  provided email within 24 hours.
                </Text>

                <Button variant="link" onClick={() => setHasSubmitted(false)}>
                  Send another message
                </Button>
              </>
            ) : (
              <>
                <h1>Contact Form</h1>

                <Box maxWidth="600px">
                  <Text>
                    Please contact us for any sort of feedback, suggestions,
                    frustrations with the product, ideas for improvement, etc.
                    We're here, listening to you and eager to make WordCloudy
                    better!
                  </Text>

                  <Text fontWeight="medium">
                    The easiest way to contact us is via{' '}
                    <a
                      href={`https://www.facebook.com/wordcloudy`}
                      target="_blank"
                    >
                      our official Facebook page
                    </a>
                    .
                  </Text>

                  <Text>
                    You can also send us an email to{' '}
                    <a href={`mailto://${config.supportEmail}`}>
                      {config.supportEmail}
                    </a>
                    , or use the form below.
                  </Text>
                  <Text>
                    We're trying to answer all messages within 24 hours.
                  </Text>
                </Box>

                <Box>
                  <ContactForm onSubmit={handleSubmit} />
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </SiteLayout>
  )
})
