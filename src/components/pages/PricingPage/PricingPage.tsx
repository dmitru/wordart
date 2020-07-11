import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React, { useEffect, useState } from 'react'
import { useStore } from 'services/root-store'
import { Box, Button, Text } from '@chakra-ui/core'
import { unlimitedPricingPlans, downloadsPricingPlans } from 'plans'
import { Helmet } from 'react-helmet'
import { getTabTitle } from 'utils/tab-title'
import css from '@emotion/css'
import { FaRegCheckCircle } from 'react-icons/fa'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import styled from '@emotion/styled'

export const PricingPage = observer(() => {
  const { authStore } = useStore()
  const { profile } = authStore

  const [selectedPlanId, setSelectedPlanId] = useState(
    unlimitedPricingPlans[0].id
  )

  const commercialUseHelp = (
    <HelpTooltipIcon
      css={css`
        position: relative;
        top: 3px;
      `}
      label="Commercial use includes selling, distribution or any other uses of designs created with Wordcloudy for commercial purposes (e.g. with the intent to earn money)"
    />
  )

  const unlimitedPlans = (
    <Box mt="3rem" mb="5rem" mx="6">
      <Box width="380px">
        <Box boxShadow="lg" borderRadius="lg">
          <Box
            p="5"
            fontSize="xl"
            fontWeight="semibold"
            bg="gray.100"
            textAlign="center"
            borderRadius="lg"
          >
            Unlimited Plans
          </Box>

          <Box as="ul" color="gray.500" mt="5" pr="4">
            <li>Unlimited number of HQ downloads</li>
            <li>Commercial use {commercialUseHelp}</li>
            <li>
              More advanced features (
              <a href="#pricing-comparison">Learn more</a>)
            </li>
          </Box>

          <Box p="5">
            {unlimitedPricingPlans.map((plan) => {
              const price = authStore.planPrices.get(plan.id)
              return (
                <Box
                  px="3"
                  py="1"
                  display="flex"
                  alignItems="center"
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlanId(plan.id)
                  }}
                  _hover={{
                    bg: plan.id === selectedPlanId ? 'gray.100' : 'gray.50',
                  }}
                  bg={plan.id === selectedPlanId ? 'primary.50' : 'white'}
                  css={css`
                    cursor: pointer;
                  `}
                  borderRadius="lg"
                >
                  <Text my="0" flex="1" mr="3" fontSize="xl">
                    {plan.title}
                  </Text>

                  <>
                    <Text my="0" fontWeight="semibold" fontSize="36px">
                      ${price?.price?.net ?? 0}
                    </Text>
                    <Text my="0" ml="3" fontSize="md" color="gray.500">
                      {price?.currency ?? 'USD'}
                    </Text>
                  </>
                </Box>
              )
            })}

            <Box mt="5">
              <Button
                width="100%"
                size="lg"
                colorScheme="accent"
                onClick={() => {
                  window.Paddle.Checkout.open({
                    product: selectedPlanId,
                    email: profile?.email,
                  })
                }}
              >
                Sign up
              </Button>
            </Box>
          </Box>
        </Box>
        <Text color="gray.400" fontSize="sm" mt="5">
          * All plans are one-time payment, not a recurring subscription.
        </Text>
      </Box>
    </Box>
  )

  const downloadPlans = (
    <Box mt="3rem" mb="5rem" mx="6">
      <Box width="380px">
        <Box boxShadow="lg" borderRadius="lg">
          <Box
            p="5"
            fontSize="xl"
            fontWeight="semibold"
            bg="gray.100"
            textAlign="center"
            borderRadius="lg"
          >
            High Quality Download Packs
          </Box>

          <Box as="ul" color="gray.500" mt="5" pr="4">
            <li>
              A limited number of HQ downloads
              <HelpTooltipIcon
                mr="3"
                css={css`
                  top: 4x;
                  position: relative;
                `}
                label="HQ downloads never expire. Only unique downloads are counted: you may download the same design multiple times in different formats for free, as long as the design doesn't change. "
              />
            </li>
            <li>Commercial use {commercialUseHelp}</li>
            <li>
              More advanced features (<a href="#pricing-faq">Learn more</a>)
            </li>
          </Box>

          <Box p="5">
            {downloadsPricingPlans.map((plan) => {
              const price = authStore.planPrices.get(plan.id)
              return (
                <Box
                  px="3"
                  py="1"
                  display="flex"
                  alignItems="center"
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlanId(plan.id)
                  }}
                  _hover={{
                    bg: plan.id === selectedPlanId ? 'gray.100' : 'gray.50',
                  }}
                  bg={plan.id === selectedPlanId ? 'primary.50' : 'white'}
                  css={css`
                    cursor: pointer;
                  `}
                  borderRadius="lg"
                >
                  <Text my="0" flex="1" mr="3" fontSize="xl">
                    {plan.title}
                  </Text>

                  <>
                    <Text my="0" fontWeight="semibold" fontSize="36px">
                      ${price?.price?.net ?? 0}
                    </Text>
                    <Text my="0" ml="3" fontSize="md" color="gray.500">
                      {price?.currency ?? 'USD'}
                    </Text>
                  </>
                </Box>
              )
            })}

            <Box mt="5">
              <Button
                width="100%"
                size="lg"
                colorScheme="accent"
                onClick={() => {
                  window.Paddle.Checkout.open({
                    product: selectedPlanId,
                    email: profile?.email,
                  })
                }}
              >
                Sign up
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  const noLimitsHelpIcon = (
    <HelpTooltipIcon label="Enjoy no limits as long as there are unused HQ downloads in your account + 1 week after that" />
  )

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

  return (
    <SiteLayout>
      <Box>
        <Helmet>
          <title>{getTabTitle('Pricing')}</title>
        </Helmet>

        <Box mb="4rem">
          <Box
            display="flex"
            flexDirection="column"
            maxWidth="600px"
            textAlign="center"
            mx="auto"
          >
            <Text as="h1" textAlign="center" fontSize="42px">
              Get the right plan for you
            </Text>

            <Text
              textAlign="center"
              maxWidth="480px"
              mx="auto"
              fontSize="lg"
              color="gray.600"
            >
              WordCloudy is free for <em>non-commercial</em> use! Try it as long
              as you like to see if it's right for you.
            </Text>
          </Box>

          <Box display="flex" flexWrap="wrap" mx="auto" justifyContent="center">
            {downloadPlans}
            {unlimitedPlans}
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            maxWidth="600px"
            textAlign="center"
            mx="auto"
          >
            <Text
              as="h1"
              textAlign="center"
              fontSize="42px"
              id="pricing-comparison"
            >
              Compare free and paid features
            </Text>
          </Box>

          <Box mt="2rem">
            <ComparisonTable>
              <thead>
                <tr>
                  <th></th>
                  <th>FREE</th>
                  <th>UNLIMITED</th>
                  <th>HQ DOWNLOAD PACKS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Download quality</th>
                  <MainDetailsTableCell main={<>Standard{qualityHelpIcon}</>} />
                  <MainDetailsTableCell
                    main={
                      <>
                        Standard or High
                        {qualityHelpIcon}
                      </>
                    }
                  />
                  <MainDetailsTableCell
                    main={
                      <>
                        Standard or High&nbsp;
                        {qualityHelpIcon}
                      </>
                    }
                  />
                </tr>

                <tr>
                  <th>Allowed use</th>
                  <MainDetailsTableCell main="Personal use only" />
                  <MainDetailsTableCell
                    main={
                      <>
                        Commercial
                        <HelpTooltipIcon label="HQ downloads can be used for any commercial purposes. Standard-quality downloads may still not be used commercially" />
                      </>
                    }
                  />
                  <MainDetailsTableCell
                    main={
                      <>
                        Commercial
                        <HelpTooltipIcon label="HQ downloads can be used for any commercial purposes. Standard-quality downloads may still not be used commercially" />
                      </>
                    }
                  />
                </tr>

                <tr>
                  <th>Number of HQ downloads</th>
                  <MainDetailsTableCell main="0" />
                  <MainDetailsTableCell
                    main={
                      <>
                        Unlimited
                        <HelpTooltipIcon label="No limit for HQ downloads" />
                      </>
                    }
                  />
                  <MainDetailsTableCell
                    main={
                      <>
                        Limited
                        <HelpTooltipIcon label="Limited number of HQ downloads, depending on the package" />
                      </>
                    }
                  />
                </tr>

                <tr>
                  <th>Max. number of saved designs</th>
                  <MainDetailsTableCell main="10" />
                  <MainDetailsTableCell main="Unlimited" />
                  <MainDetailsTableCell
                    main={<>Unlimited {noLimitsHelpIcon}</>}
                  />
                </tr>

                <tr>
                  <th>Custom fonts and image shapes</th>
                  <MainDetailsTableCell
                    main={
                      <>
                        Partial support
                        <HelpTooltipIcon label="You'll be able to create and download your design with custom images and fonts, but you won't be able to save it to your Wordcloudy account" />{' '}
                      </>
                    }
                  />
                  <MainDetailsTableCell main="Yes" />
                  <MainDetailsTableCell main="Yes" />
                </tr>
              </tbody>
            </ComparisonTable>
          </Box>

          <Box
            mt="4rem"
            display="flex"
            flexDirection="column"
            maxWidth="600px"
            textAlign="center"
            mx="auto"
          >
            <Text as="h1" id="pricing-faq" textAlign="center" fontSize="42px">
              Pricing FAQ
            </Text>

            <Text
              textAlign="center"
              maxWidth="480px"
              mx="auto"
              fontSize="lg"
              color="gray.600"
            >
              Find answers to commonly asked questions about our plans and
              pricing.
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
              <p>TODO</p>
            </Question>
          </Box>
        </Box>
      </Box>
    </SiteLayout>
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
    {main}
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
