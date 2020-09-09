import {
  Box,
  Button,
  Tag,
  Text,
  Stack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { observer } from 'mobx-react'
import Link from 'next/link'
import { unlimitedPricingPlans, downloadsPricingPlans } from 'plans'
import React, { useState } from 'react'
import { FaCheck } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'

const formatPrice = (priceUsd: number, currency = 'USD') =>
  Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(
    priceUsd
  )

const CheckIcon = ({ isInactive }: { isInactive?: boolean }) => (
  <Box
    as="span"
    mr="2"
    display="inline-block"
    color={isInactive ? 'gray.300' : 'green.500'}
    fontSize="xl"
    css={css`
      position: relative;
      bottom: -4px;
    `}
  >
    <FaCheck />
  </Box>
)

export const SeeSamplesPopover = () => (
  <Popover trigger="hover" closeOnEsc placement="bottom" autoFocus={false}>
    <PopoverTrigger>
      <Text mb="0" color="blue.500">
        {'(see samples)'}
      </Text>
    </PopoverTrigger>
    <Portal>
      <PopoverContent width="280px">
        <PopoverArrow />
        <PopoverBody p={5}>
          <Box>
            <Text>
              Download an example HQ image to help you assess the quality of
              generated images:
            </Text>
            <ul>
              <li>
                <a
                  rel="noreferrer"
                  target="_blank"
                  href="https://wordcloudy.sfo2.digitaloceanspaces.com/media/hq-sample-1.png"
                >
                  PNG (recommended)
                </a>
              </li>
              <li>
                <a
                  rel="noreferrer"
                  target="_blank"
                  href="https://wordcloudy.sfo2.digitaloceanspaces.com/media/hq-sample-1.jpeg"
                >
                  JPEG
                </a>
              </li>
              <li>
                <a
                  rel="noreferrer"
                  target="_blank"
                  href="https://wordcloudy.sfo2.digitaloceanspaces.com/media/hq-sample-1.svg"
                >
                  SVG
                </a>
              </li>
            </ul>
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Portal>
  </Popover>
)

export const PricingPlans = observer(
  ({
    showFreePlans = true,
    showOneTimePaymentNotice = true,
  }: {
    showFreePlans?: boolean
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
      unlimitedPricingPlans[0].id
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

    // TODO: add free plans
    const freePlans = (
      <Box
        bg="white"
        // mt={['2rem', '2rem', '3rem']}
        // mb={['2rem', '2rem', '2rem']}
        // mx={[2, 6]}
      >
        <Box width={['300px', '340px', '320px', '320px', '360px']}>
          <Box boxShadow="lg" borderRadius="lg">
            <Box
              p="5"
              fontSize={['lg', 'lg', 'lg', 'xl']}
              borderTopColor="blue.100"
              borderTopWidth="10px"
              borderTopStyle="solid"
              borderBottomColor="gray.100"
              borderBottomWidth="1px"
              borderBottomStyle="solid"
              textAlign="center"
              borderTopRadius="lg"
            >
              Free Plan
            </Box>

            <Box
              color="gray.500"
              mt="5"
              pr="4"
              fontSize={['sm', 'md', 'sm', 'sm', 'md']}
              css={css`
                > div {
                  margin: 10px 0 10px 20px;
                  display: flex;
                  align-items: baseline;

                  > *:first-child {
                    margin-right: 10px;
                    font-size: 1.2em;
                  }
                }
              `}
            >
              <div>
                <CheckIcon />
                <Text mb="0" color="gray.600">
                  Order printed goods with your designs (coming soon)
                </Text>
              </div>
              <div>
                <CheckIcon isInactive />
                Medium quality digital downloads
                <HelpTooltipIcon
                  mr="3"
                  css={css`
                    top: 4x;
                    position: relative;
                  `}
                  label={`Download images in resolution up to 1024 x 1024 px`}
                />
              </div>
              <div>
                <CheckIcon isInactive />
                Personal use only
              </div>
              <div>
                <CheckIcon isInactive />
                No transparent backgrounds
              </div>
            </Box>

            <Box p="5" pt={['0', '3']}>
              <Box mt="5">
                <Link href={Urls.editor.create} passHref>
                  <Button as="a" width="100%" size="lg" colorScheme="accent">
                    Start creating
                  </Button>
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    )

    const downloadPlans = (
      <Box
        bg="white"
        // mt={['2rem', '2rem', '3rem']}
        // mb={['2rem', '2rem', '2rem']}
        // mx={[2, 6]}
      >
        <Box width={['300px', '340px', '320px', '320px', '360px']}>
          <Box boxShadow="lg" borderRadius="lg">
            <Box
              p="5"
              fontSize={['lg', 'lg', 'lg', 'xl']}
              borderTopColor="blue.100"
              borderTopWidth="10px"
              borderTopStyle="solid"
              borderBottomColor="gray.100"
              borderBottomWidth="1px"
              borderBottomStyle="solid"
              textAlign="center"
              borderTopRadius="lg"
            >
              High Quality Download Packs
            </Box>

            <Box
              color="gray.600"
              mt="5"
              pr="4"
              fontSize={['sm', 'md', 'sm', 'sm', 'md']}
              css={css`
                > div {
                  margin: 10px 0 10px 20px;
                  display: flex;
                  align-items: baseline;

                  > *:first-child {
                    margin-right: 10px;
                    font-size: 1.2em;
                  }
                }
              `}
            >
              <div>
                <CheckIcon />
                <div>
                  High quality digital downloads
                  <br />
                  <SeeSamplesPopover />
                </div>
                <HelpTooltipIcon
                  mr="3"
                  css={css`
                    top: 4x;
                    position: relative;
                  `}
                  label={`Download images in high resolution up to 8192 x 8192 px (220dpi for 8" x 10" print), or as scalable vector graphics (SVG)`}
                />
              </div>

              <div>
                <CheckIcon />
                <div>
                  HQ download packs don't expire*
                  <HelpTooltipIcon
                    mr="3"
                    css={css`
                      top: 4x;
                      position: relative;
                    `}
                    label="*HQ downloads don't expire for 3 years. Only unique downloads are counted: you may download the same design multiple times in different formats for free, as long as the design doesn't change. "
                  />
                </div>
              </div>

              <div>
                <CheckIcon />
                Commercial use {commercialUseHelp}
              </div>
              <div>
                <CheckIcon />
                Transparent backgrounds
              </div>
            </Box>

            <Box p="5" pt={['0', '1', '4']}>
              {downloadsPricingPlans.map((plan) => {
                const price = authStore.planPrices.get(plan.id)
                return (
                  <Box
                    px="3"
                    py={['3', '2']}
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
                    <Text my="0" flex="1" mr="3" fontSize={['sm', 'md', 'md']}>
                      {plan.title}
                    </Text>

                    <>
                      <Text
                        my="0"
                        fontWeight="medium"
                        fontSize={['sm', 'md', 'lg']}
                      >
                        {formatPrice(price?.price?.gross ?? 0, price?.currency)}
                      </Text>
                      {/* <Text my="0" ml="3" fontSize="sm" color="gray.500">
                        {price?.currency ?? 'USD'}
                      </Text> */}
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
        // mx={[2, 6]}
        bg="white"
      >
        <Box width={['300px', '340px', '320px', '320px', '360px']}>
          <Box boxShadow="lg" borderRadius="lg">
            <Box
              p="5"
              fontSize="xl"
              textAlign="center"
              borderTopColor="blue.100"
              borderTopWidth="10px"
              borderTopStyle="solid"
              borderBottomColor="gray.100"
              borderBottomWidth="1px"
              borderBottomStyle="solid"
              borderTopRadius="lg"
            >
              Unlimited Plans
            </Box>

            <Box
              color="gray.600"
              mt="5"
              pr="4"
              fontSize={['sm', 'md', 'sm', 'sm', 'md']}
              css={css`
                > div {
                  margin: 10px 0 10px 20px;
                  display: flex;
                  align-items: baseline;

                  > *:first-child {
                    margin-right: 10px;
                    font-size: 1.2em;
                  }
                }
              `}
            >
              <div>
                <CheckIcon />
                <div>
                  High quality digital downloads
                  <br />
                  <SeeSamplesPopover />
                </div>
                <HelpTooltipIcon
                  mr="3"
                  css={css`
                    top: 4x;
                    position: relative;
                  `}
                  label={`Download images in high resolution up to 8192 x 8192 px (220dpi for 8" x 10" print), or as scalable vector graphics (SVG)`}
                />
              </div>
              <div>
                <CheckIcon />
                Unlimited HQ downloads
              </div>
              {/* <div>
                <CheckIcon />
                No watermark
              </div> */}
              <div>
                <CheckIcon />
                Commercial use {commercialUseHelp}
              </div>
              <div>
                <CheckIcon />
                Transparent backgrounds
              </div>
            </Box>

            <Box p="5" pt={['0', '1', '4']}>
              {unlimitedPricingPlans.map((plan) => {
                const price = authStore.planPrices.get(plan.id)
                return (
                  <Box
                    px="3"
                    py={['3', '2']}
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
                    <Text my="0" flex="1" mr="3" fontSize={['sm', 'md', 'md']}>
                      {plan.title}
                    </Text>

                    {price?.price?.gross != null && (
                      <>
                        <Text
                          my="0"
                          fontWeight="medium"
                          fontSize={['sm', 'md', 'lg']}
                        >
                          {formatPrice(
                            price?.price?.gross ?? 0,
                            price?.currency
                          )}
                        </Text>
                        {/* <Text my="0" ml="3" fontSize="sm" color="gray.500">
                          {price?.currency ?? 'USD'}
                        </Text> */}
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

        <Stack
          display="flex"
          mx="auto"
          alignItems={['center', 'center', 'center', 'flex-start']}
          justifyContent="center"
          direction={['column', 'column', 'column', 'row']}
          spacing={['2rem', '2rem', '2rem', '1rem', '2rem']}
        >
          {showFreePlans && freePlans}
          {downloadPlans}
          {unlimitedPlans}
        </Stack>

        <Text
          color="gray.500"
          fontSize="md"
          mt="5"
          mx="auto"
          textAlign="center"
          maxWidth="500px"
        >
          All payments are processed by Paddle.com in a secure way.
        </Text>

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
