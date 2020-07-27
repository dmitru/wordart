import { Box, Button, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { observer } from 'mobx-react'
import { downloadsPricingPlans, unlimitedPricingPlans } from 'plans'
import React, { useState } from 'react'
import { useStore } from 'services/root-store'

export const PricingPlans = observer(() => {
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
      label="Commercial use includes selling, distribution or any other uses of designs created with Wordcloudy for commercial purposes"
    />
  )

  const downloadPlans = (
    <Box
      mt={['2rem', '2rem', '3rem']}
      mb={['2rem', '2rem', '2rem']}
      mx={[2, 6]}
    >
      <Box width={['300px', '340px', '340px', '360px']}>
        <Box boxShadow="lg" borderRadius="lg">
          <Box
            p="5"
            fontSize={['lg', 'lg', 'xl']}
            bg="gray.100"
            textAlign="center"
            borderRadius="lg"
          >
            High Quality Download Packs
          </Box>

          <Box as="ul" color="gray.500" mt="5" pr="4" fontSize={['sm', 'md']}>
            <li>
              Fixed number of HQ downloads
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

          <Box p="5" pt={['0', '3']}>
            {downloadsPricingPlans.map((plan) => {
              const price = authStore.planPrices.get(plan.id)
              return (
                <Box
                  px="3"
                  py={['3']}
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
                  <Text my="0" flex="1" mr="3" fontSize={['sm', 'md', 'lg']}>
                    {plan.title}
                  </Text>

                  <>
                    <Text
                      my="0"
                      fontWeight="semibold"
                      fontSize={['sm', 'md', 'xl']}
                    >
                      ${price?.price?.net ?? 0}
                    </Text>
                    <Text my="0" ml="3" fontSize="sm" color="gray.500">
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
                Buy now
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  const unlimitedPlans = (
    <Box
      mt={['1rem', '1rem', '3rem']}
      mb={['1rem', '1rem', '1rem']}
      mx={[2, 6]}
    >
      <Box width={['300px', '340px', '340px', '360px']}>
        <Box boxShadow="lg" borderRadius="lg">
          <Box
            p="5"
            fontSize="xl"
            bg="gray.100"
            textAlign="center"
            borderRadius="lg"
          >
            Unlimited Plans
          </Box>

          <Box as="ul" color="gray.500" mt="5" pr="4" fontSize={['sm', 'md']}>
            <li>Unlimited number of HQ downloads</li>
            <li>Commercial use {commercialUseHelp}</li>
            <li>
              More advanced features (
              <a href="#pricing-comparison">Learn more</a>)
            </li>
          </Box>

          <Box p="5" pt={['0', '3']}>
            {unlimitedPricingPlans.map((plan) => {
              const price = authStore.planPrices.get(plan.id)
              return (
                <Box
                  px="3"
                  py={['3']}
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
                  <Text my="0" flex="1" mr="3" fontSize={['sm', 'md', 'lg']}>
                    {plan.title}
                  </Text>

                  <>
                    <Text
                      my="0"
                      fontWeight="semibold"
                      fontSize={['sm', 'md', 'xl']}
                    >
                      ${price?.price?.net ?? 0}
                    </Text>
                    <Text my="0" ml="3" fontSize="sm" color="gray.500">
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
                Buy now
              </Button>
            </Box>
          </Box>
        </Box>
        <Text color="gray.400" fontSize="sm" mt="5" mx="3">
          * All plans are one-time payment, not a recurring subscription.
        </Text>
      </Box>
    </Box>
  )

  return (
    <Box
      display="flex"
      mx="auto"
      alignItems={['center', 'center', 'flex-start']}
      justifyContent="center"
      flexDirection={['column', 'column', 'row']}
    >
      {downloadPlans}
      {unlimitedPlans}
    </Box>
  )
})
