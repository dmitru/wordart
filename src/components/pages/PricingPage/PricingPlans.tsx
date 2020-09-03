import { Box, Button, Text, Tag } from '@chakra-ui/core'
import css from '@emotion/css'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { observer } from 'mobx-react'
import { unlimitedPricingPlans, downloadsPricingPlans } from 'plans'
import React, { useState } from 'react'
import { FaCheck } from 'react-icons/fa'
import { useStore } from 'services/root-store'

const formatPrice = (priceUsd: number, currency = 'USD') =>
  Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(
    priceUsd
  )

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

export const PricingPlans = observer(
  ({
    showOneTimePaymentNotice = true,
  }: {
    showOneTimePaymentNotice?: boolean
  }) => {
    const { authStore } = useStore()
    const { profile } = authStore

    const launchSalePlacesLeft = authStore.launchCoupon
      ? authStore.launchCoupon.allowed_uses - authStore.launchCoupon.times_used
      : 0
    // const showLaunchSale = launchSalePlacesLeft > 0
    const showLaunchSale = false

    const [selectedUnlimitedPlanId, setSelectedUnlimitedPlanId] = useState(
      unlimitedPricingPlans[1].id
    )
    const [selectedDownloadPlanId, setSelectedDownloadPlanId] = useState(
      downloadsPricingPlans[1].id
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
        // mt={['2rem', '2rem', '3rem']}
        // mb={['2rem', '2rem', '2rem']}
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

            <Box
              color="gray.500"
              mt="5"
              pr="4"
              fontSize={['sm', 'md']}
              css={css`
                > div {
                  margin: 10px 0 10px 20px;
                  display: flex;
                  align-items: center;

                  > *:first-child {
                    margin-right: 10px;
                    color: green;
                  }
                }
              `}
            >
              <div>
                <CheckIcon />
                HQ download packs never expire
                <HelpTooltipIcon
                  mr="3"
                  css={css`
                    top: 4x;
                    position: relative;
                  `}
                  label="HQ downloads never expire. Only unique downloads are counted: you may download the same design multiple times in different formats for free, as long as the design doesn't change. "
                />
              </div>
              <div>
                <CheckIcon />
                Personal or commercial use {commercialUseHelp}
              </div>
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
                      setSelectedDownloadPlanId(plan.id)
                    }}
                    _hover={{
                      bg:
                        plan.id === selectedDownloadPlanId
                          ? 'gray.100'
                          : 'gray.50',
                    }}
                    bg={
                      plan.id === selectedDownloadPlanId
                        ? 'primary.50'
                        : 'white'
                    }
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
                        {formatPrice(price?.price?.gross ?? 0, price?.currency)}
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
                      product: selectedDownloadPlanId,
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
        // mt={['1rem', '1rem', '3rem']}
        // mb={['1rem', '1rem', '1rem']}
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

            <Box
              color="gray.500"
              mt="5"
              pr="4"
              fontSize={['sm', 'md']}
              css={css`
                > div {
                  margin: 10px 0 10px 20px;
                  display: flex;
                  align-items: center;

                  > *:first-child {
                    margin-right: 10px;
                    color: green;
                  }
                }
              `}
            >
              <div>
                <CheckIcon />
                Unlimited HQ downloads
              </div>
              <div>
                <CheckIcon />
                Personal or commercial use {commercialUseHelp}
              </div>
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
                      setSelectedUnlimitedPlanId(plan.id)
                    }}
                    _hover={{
                      bg:
                        plan.id === selectedUnlimitedPlanId
                          ? 'gray.100'
                          : 'gray.50',
                    }}
                    bg={
                      plan.id === selectedUnlimitedPlanId
                        ? 'primary.50'
                        : 'white'
                    }
                    css={css`
                      cursor: pointer;
                    `}
                    borderRadius="lg"
                  >
                    <Text my="0" flex="1" mr="3" fontSize={['sm', 'md', 'lg']}>
                      {plan.title}
                    </Text>

                    {price?.price?.gross != null && (
                      <>
                        <Text
                          my="0"
                          fontWeight="semibold"
                          fontSize={['sm', 'md', 'xl']}
                        >
                          {formatPrice(
                            price?.price?.gross ?? 0,
                            price?.currency
                          )}
                        </Text>
                        <Text my="0" ml="3" fontSize="sm" color="gray.500">
                          {price?.currency ?? 'USD'}
                        </Text>
                      </>
                    )}
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
                      product: selectedUnlimitedPlanId,
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

    return (
      <>
        {showLaunchSale && (
          <Box display="flex" justifyContent="center" mb="2rem">
            <Tag
              colorScheme="purple"
              fontSize="lg"
              p="3"
              display="inline-block"
              mx="30px"
              textAlign="center"
            >
              {'🔥'}
              <strong
                css={css`
                  margin-left: 5px;
                `}
              >
                Limited offer
              </strong>
              : 33% off with LAUNCH coupon at check-out.{' '}
              {
                <strong
                  css={css`
                    margin-left: 5px;
                  `}
                >
                  Only {launchSalePlacesLeft} places left!
                </strong>
              }
            </Tag>
          </Box>
        )}

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
        {showOneTimePaymentNotice && (
          <Text
            color="gray.500"
            fontSize="md"
            mt="5"
            mx="auto"
            textAlign="center"
            maxWidth="500px"
          >
            All plans are one-time payments and don't automatically renew.
            <br />
            You will only be charged once.
          </Text>
        )}
      </>
    )
  }
)
