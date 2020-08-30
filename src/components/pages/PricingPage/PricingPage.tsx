import { Box, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { SiteLayoutFullWidth } from 'components/layouts/SiteLayout/SiteLayout'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React from 'react'
import { Helmet } from 'react-helmet'
import { FaCheck } from 'react-icons/fa'
import { MdClose } from 'react-icons/md'
import { Urls } from 'urls'
import { getTabTitle } from 'utils/tab-title'
import { PricingPlans } from './PricingPlans'

const CheckIcon = () => (
  <Box
    as="span"
    mr="2"
    display="inline-block"
    color="green.500"
    fontSize="xl"
    css={css`
      position: relative;
      bottom: -4px;
    `}
  >
    <FaCheck />
  </Box>
)
const CrossIcon = () => (
  <Box
    as="span"
    mr="2"
    display="inline-block"
    color="gray.500"
    fontSize="xl"
    css={css`
      position: relative;
      bottom: -4px;
    `}
  >
    <MdClose />
  </Box>
)

export const PricingPage = observer(() => {
  // const noLimitsHelpIcon = (
  //   <HelpTooltipIcon label="Enjoy no limits as long as there are unused HQ downloads in your account + 1 week after that" />
  // )

  const qualityHelpIcon = (
    <HelpTooltipIcon
      label={
        <>
          <ul>
            <li>
              <strong>Standard quality:</strong> PNG or JPEG format, up to
              1024px
            </li>
            <li>
              <strong>High Quality (HQ):</strong> PNG, JPEG (up to 4096px) or
              SVG vector format
            </li>
          </ul>
        </>
      }
    />
  )

  const commercialUseHelp = (
    <HelpTooltipIcon
      css={css`
        position: relative;
        top: 3px;
      `}
      label="Commercial use includes selling, distribution or any other uses of designs created with Wordcloudy for commercial purposes"
    />
  )

  const comparisonSection = (
    <Box
      boxShadow="lg"
      borderColor="gray.300"
      borderStyle="solid"
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      maxWidth="800px"
      mx="auto"
    >
      <Box mt="0.5rem" p="5">
        <ComparisonTable>
          <thead>
            <tr>
              <th></th>
              <th>FREE</th>
              <th>ANY PAID PLAN</th>
              {/* <th>HQ DOWNLOAD PACKS</th> */}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>High quality downloads</th>
              <MainDetailsTableCell main={<CrossIcon />} />
              <MainDetailsTableCell main={<CheckIcon />} />
              {/* <MainDetailsTableCell
                main={
                  <>
                    Limited
                    <HelpTooltipIcon label="Limited number of HQ downloads, depending on the package" />
                  </>
                }
              /> */}
            </tr>

            <tr>
              <th>
                Commercial use
                <HelpTooltipIcon label="HQ downloads can be used for any commercial purposes. Standard-quality downloads may still not be used commercially" />
              </th>
              <MainDetailsTableCell main={<CrossIcon />} />
              <MainDetailsTableCell main={<CheckIcon />} />
              {/* <MainDetailsTableCell
                main={
                  <>
                    Commercial
                    <HelpTooltipIcon label="HQ downloads can be used for any commercial purposes. Standard-quality downloads may still not be used commercially" />
                  </>
                }
              /> */}
            </tr>

            <tr>
              <th>Unlimited designs</th>
              <MainDetailsTableCell
                main={
                  <>
                    <CrossIcon />
                    Max. 10 designs
                  </>
                }
              />
              <MainDetailsTableCell main={<CheckIcon />} />
              {/* <MainDetailsTableCell main={<>Unlimited {noLimitsHelpIcon}</>} /> */}
            </tr>

            <tr>
              <th>Custom fonts and image shapes</th>
              <MainDetailsTableCell
                main={
                  <>
                    <CrossIcon />
                    Partial support
                    <HelpTooltipIcon label="You can create and download your designs with custom images and fonts, but you won't be able to save them to your Wordcloudy account" />{' '}
                  </>
                }
              />
              <MainDetailsTableCell main={<CheckIcon />} />
              {/* <MainDetailsTableCell main="Yes" /> */}
            </tr>
          </tbody>
        </ComparisonTable>
      </Box>
    </Box>
  )

  return (
    <SiteLayoutFullWidth>
      <Box maxWidth="1200px" mx="auto" px={['2', '3', '6']}>
        <Helmet>
          <title>{getTabTitle('Pricing')}</title>
        </Helmet>

        <Box mb="4rem">
          <Box
            display="flex"
            flexDirection="column"
            maxWidth="660px"
            textAlign="center"
            mx="auto"
          >
            <Text as="h1" textAlign="center">
              Get the right plan for you!
            </Text>

            <Text
              textAlign="center"
              maxWidth="480px"
              mx="auto"
              fontSize={['sm', 'lg']}
              color="gray.600"
            >
              WordCloudy is free for <em>non-commercial</em> use. Try it as long
              as you like to see if it's right for you.
            </Text>
          </Box>

          <Box mt="3rem">
            <PricingPlans />
          </Box>

          <Box mt="3rem">
            <Text as="h1" textAlign="center">
              Compare Free and Paid Features
            </Text>
            {comparisonSection}
          </Box>

          <Box
            mt={['1rem', '1rem', '2rem']}
            mb="3rem"
            display="flex"
            flexDirection="column"
            maxWidth="600px"
            textAlign="center"
            mx="auto"
          >
            <Text as="h1" id="pricing-faq" textAlign="center">
              Pricing FAQ
            </Text>

            <Text
              textAlign="center"
              maxWidth="480px"
              mx="auto"
              fontSize="lg"
              color="gray.600"
            >
              Find answers to common questions about our plans and pricing.
            </Text>
          </Box>

          <Box id="pricing-faq" mt="1.5rem" maxWidth="700px" mx="auto">
            <Question>
              <h2>
                <QuestionLink href="#are-plans-subscriptions">#</QuestionLink>
                Are these plans subscriptions?
              </h2>
              <p>
                No, all our plans are one-time payments. You will only be
                charged once at the moment of purchase and no other automatic
                charges will be made in the future.
              </p>
            </Question>

            <Question>
              <h2>
                <QuestionLink href="#refund-policy">#</QuestionLink>If I'm not
                happy with my purchase, can I get a refund?
              </h2>
              <p>
                Absolutely! We prodive full refund within 7 days after the
                purchase if you're not 100% satisfied.
              </p>
            </Question>

            <Question>
              <h2>
                <QuestionLink href="#hq-sd-difference">#</QuestionLink>
                What are Standard Quality and High Quality downloads? What's the
                difference?
              </h2>

              <p>
                Any design you create in Wordcloudy can be downloaded in one of
                2 ways: as Standard Quality or High Quality (HQ) download. Here
                are the differences:
              </p>

              <strong>Standard Quality downloads:</strong>
              <ul>
                <li>Can only be used for personal, non-commercial purposes</li>
                <li>
                  Can be downloaded as PNG or JPEG images with maximum
                  dimensions of 1,024 px
                </li>
              </ul>

              <strong>High Quality (HQ) downloads:</strong>
              <ul>
                <li>Can be used commercially without any limits</li>
                <li>
                  Has much better quality: can be downloaded as PNG or JPEG
                  images with maximum dimensions of 4,024 px or as a vector SVG
                  graphics for the highest possible quality.
                </li>
                <li>
                  Available only for users who purchased either Unlimited plan,
                  or a HQ download pack.
                </li>
              </ul>
            </Question>

            <Question>
              <h2>
                <QuestionLink href="#can-i-sell-designs">#</QuestionLink>
                Can I sell my images to my clients or on stock image sites?
              </h2>
              <p>Yes, you can sell images downloaded in High Quality (HQ).</p>
              <p>
                You cannot however sell images downloaded in Standard Quality –
                please purchase one of our plans and download HQ images.
              </p>
            </Question>

            <Question>
              <h2>
                <QuestionLink href="#getting-help">#</QuestionLink>
                Where can I get help or ask more questions?
              </h2>
              <p>
                For any questions, please use our{' '}
                <Link passHref href={Urls.contact}>
                  <a>Contact Form</a>
                </Link>{' '}
                to get in touch with us. We're trying to answer all questions
                within 24 hours.
              </p>
            </Question>
          </Box>
        </Box>
      </Box>
    </SiteLayoutFullWidth>
  )
})

export const ComparisonTable = styled.table`
  th {
    vertical-align: top;
  }
`

const QuestionLink = (props: any) => (
  <Text as="a" mr="2" my="0" color="gray.500" {...props} />
)

export const MainDetailsTableCell: React.FC<{
  main: React.ReactNode
  details?: React.ReactNode
}> = ({ main, details }) => (
  <td
    css={css`
      vertical-align: top;
    `}
  >
    {/* <Box display="flex" alignItems="flex-start"> */}
    {main}
    {/* </Box> */}
    {details && (
      <>
        <br />
        <Text fontSize="sm" color="gray.500">
          {details}
        </Text>
      </>
    )}
  </td>
)

const Question = styled(Box)`
  margin-bottom: 3rem;
`
