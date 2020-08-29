import { Box, Button, Tag, Stack, Text } from '@chakra-ui/core'
import { ChevronRightIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { SiteLayoutFullWidth } from 'components/layouts/SiteLayout/SiteLayout'
import { PricingPlans } from 'components/pages/PricingPage/PricingPlans'
import { motion } from 'framer-motion'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React, { useEffect } from 'react'
import AwesomeSlider from 'react-awesome-slider'
import { useStore } from 'services/root-store'
// @ts-ignore
import withAutoplay from 'react-awesome-slider/dist/autoplay'
import { Urls } from 'urls'
import { Question } from 'components/pages/FaqPage/FaqPage'

const Slider = withAutoplay(AwesomeSlider)

const mobileHeaderBreakpoint = `@media screen and (max-width: 1100px)`
const xsBreakpoint = `@media screen and (max-width: 500px)`

export const LandingPage = observer(() => {
  const { authStore } = useStore()

  useEffect(() => {
    const video = document.getElementById('ui-video') as HTMLVideoElement
    video.playbackRate = 1.5
  }, [])

  const launchSalePlacesLeft = authStore.launchCoupon
    ? authStore.launchCoupon.allowed_uses - authStore.launchCoupon.times_used
    : 0
  const showLaunchSale = launchSalePlacesLeft > 0

  return (
    <SiteLayoutFullWidth>
      <HeaderContainer>
        <HeaderContentWidthLimit>
          <HeaderTitleContainer>
            <Box
              style={{ display: showLaunchSale ? 'inline-block' : 'none' }}
              mt="1rem"
              mb="-1rem"
            >
              <Tag
                colorScheme="purple"
                mx="auto"
                fontSize="lg"
                p="3"
                display="inline-block"
              >
                {'🔥 '}33% sale – only {launchSalePlacesLeft} places left!
              </Tag>
            </Box>
            <HeaderTitle>
              Create unique word designs <em>in no time</em>.
            </HeaderTitle>
            <HeaderSubtitle>
              Easy-to-use & powerful word art generator for personalized gifts,
              prints, social media and more. <br /> <br /> No design skills
              required!
            </HeaderSubtitle>

            <HeaderCtaContainer>
              <Stack
                spacing="3"
                direction={['column', 'row']}
                alignItems="center"
              >
                <Link href={Urls.editor.create} passHref>
                  <HeaderCreateNowButton
                    // @ts-ignore
                    as="a"
                    colorScheme="accent"
                    size="lg"
                    rightIcon={<ChevronRightIcon />}
                  >
                    Create your design
                  </HeaderCreateNowButton>
                </Link>
              </Stack>

              <HeaderCtaInfo mb="3" mt="4">
                Try without a sign-up.
              </HeaderCtaInfo>
            </HeaderCtaContainer>
          </HeaderTitleContainer>

          <HeaderSliderContainer
            initial={{ opacity: 0, rotate: '2deg' }}
            transition={{ ease: 'easeInOut', duration: 0.5 }}
            animate={{ x: 0, y: 0, opacity: 1, rotate: '2deg' }}
          >
            <HeaderSlider>
              <Slider play cancelOnInteraction={false} interval={3000}>
                <div data-src="/gallery/gallery-12.jpeg" />
                <div data-src="/gallery/gallery-11.jpeg" />
                <div data-src="/gallery/gallery-8.jpeg" />
                <div data-src="/gallery/gallery-10.jpeg" />
                <div data-src="/gallery/gallery-9.jpeg" />
                <div data-src="/gallery/gallery-7.jpeg" />
                <div data-src="/gallery/gallery-4.jpeg" />
                <div data-src="/gallery/gallery-6.jpeg" />
                {/* <div data-src="/gallery/gallery-3.jpeg" /> */}
              </Slider>
            </HeaderSlider>
          </HeaderSliderContainer>
        </HeaderContentWidthLimit>

        <div className="custom-shape-divider-bottom-1594969392">
          <svg
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              className="shape-fill"
            ></path>
          </svg>
        </div>
      </HeaderContainer>

      {/* UI Video header */}
      <SectionHeader
        mb="30px"
        initial={{ opacity: 0, y: '40px' }}
        // @ts-ignore
        transition={{
          ease: 'easeInOut',
          duration: 0.5,
          delay: 0.5,
        }}
        animate={{ x: 0, y: 0, opacity: 1 }}
      >
        <h1>Generate beautiful designs, easily</h1>
        <Text mt="0" mb="0" mx="auto" maxWidth="670px">
          Let Wordcloudy do the job. Save your time for more important things!
        </Text>
      </SectionHeader>

      {/* UI video */}
      <Box
        boxShadow="md"
        borderColor="gray.200"
        borderStyle="solid"
        borderWidth="1px"
        borderRadius="lg"
        mt="0"
        p="5"
        css={css`
          position: relative;
          z-index: 3;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          margin-bottom: 70px;
          display: flex;
          align-items: flex-start;

          video {
            max-width: calc(850 / 560 * 90vh);
            margin: 0 auto;
          }

          @media (--break-tablet-down) {
            padding: 40px;
          }

          @media (--break-mobile-down), (max-height: 800px) {
            padding: 20px;
          }

          @media (--break-mobile-small-down) {
            padding: 10px;
          }
        `}
      >
        <video
          id="ui-video"
          playsInline
          muted
          loop
          autoPlay
          width="100%"
          height="auto"
          preload="metadata"
        >
          <source
            src="https://wordcloudy.sfo2.digitaloceanspaces.com/media/landing-video-loop.mp4"
            type="video/mp4"
          />
        </video>
      </Box>

      {/* Use cases */}
      <SectionHeader
        mb="30px"
        mt="6rem"
        initial={{ opacity: 0, y: '40px' }}
        // @ts-ignore
        transition={{
          ease: 'easeInOut',
          duration: 0.5,
          delay: 0.25,
        }}
        animate={{ x: 0, y: 0, opacity: 1 }}
      >
        <h1>Helps you achieve your goals</h1>
        <Text mt="0" mb="0" maxWidth="600px" mx="auto">
          Use the awesome power of typography, words, shapes and colors!
        </Text>
      </SectionHeader>

      <UseCasesSectionContainer mb="4rem" mx="auto" mt="3rem">
        <UseCase
          my="2rem"
          initial={{ opacity: 0, y: '40px' }}
          // @ts-ignore
          transition={{
            ease: 'easeInOut',
            duration: 0.5,
            delay: 0.25,
          }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          p="4"
          mx="20px"
          display="flex"
        >
          <Box maxWidth="300px" width="100%" css={useCaseImgStyle} mr="2rem">
            <img src="/landing/undraw_add_to_cart_vkjp.svg" />
          </Box>
          <Box>
            <Text fontSize="2rem" color="teal.600" css={useCaseTitleStyle}>
              For Creative Entrepreneurs
            </Text>
            <Text fontSize="20px" as="ul" color="gray.700">
              <li>
                <strong>Delight your customers</strong> with beautiful{' '}
                <strong>personalized items</strong>.
              </li>
              <li>
                <strong>Quickly generate new designs</strong> for your next
                top-selling items.
              </li>
            </Text>
          </Box>
        </UseCase>

        <UseCase
          my="2rem"
          initial={{ opacity: 0, y: '40px' }}
          // @ts-ignore
          transition={{
            ease: 'easeInOut',
            duration: 0.5,
            delay: 0.25,
          }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          p="4"
          mx="20px"
          display="flex"
          flexDirection="row-reverse"
        >
          <Box maxWidth="300px" width="100%" css={useCaseImgStyle} ml="2rem">
            <img src="/landing/undraw_blogging_vpvv.svg" />
          </Box>
          <Box>
            <Text fontSize="2rem" color="blue.600" css={useCaseTitleStyle}>
              For Bloggers
            </Text>
            <Text fontSize="20px" as="ul" color="gray.700">
              <li>
                <strong>Grab attention and evoke emotion</strong> in your
                audience.
              </li>
              <li>
                <strong>Enhance your message and stand out</strong> with
                memorable and effective word art.
              </li>
            </Text>
          </Box>
        </UseCase>

        <UseCase
          my="2rem"
          initial={{ opacity: 0, y: '40px' }}
          // @ts-ignore
          transition={{
            ease: 'easeInOut',
            duration: 0.5,
            delay: 0.25,
          }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          p="4"
          mx="20px"
          display="flex"
          flexDirection="row"
        >
          <Box maxWidth="300px" width="100%" css={useCaseImgStyle} mr="2rem">
            <img src="/landing/undraw_add_color_19gv.svg" />
          </Box>
          <Box>
            <Text fontSize="2rem" color="pink.600">
              For Designers
            </Text>
            <Text fontSize="20px" color="gray.700">
              <strong>Save your time creating</strong>
              {' unique design assets and backgrounds. '}
              Export your creations in{' '}
              <strong>high-resolution or as SVG</strong> and use them in your
              favorite design tool.
            </Text>
          </Box>
        </UseCase>

        <UseCase
          my="2rem"
          initial={{ opacity: 0, y: '40px' }}
          // @ts-ignore
          transition={{
            ease: 'easeInOut',
            duration: 0.5,
            delay: 0.25,
          }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          p="4"
          mx="20px"
          display="flex"
          flexDirection="row-reverse"
        >
          <Box maxWidth="300px" width="100%" css={useCaseImgStyle} ml="2rem">
            <img src="/landing/undraw_Presentation_62e1.svg" />
          </Box>
          <Box>
            <Text fontSize="2rem" color="orange.600">
              For Presenters and Educators
            </Text>
            <Text fontSize="20px" color="gray.700">
              <strong>Captivate and engage</strong> your audience or students
              with <strong>unique and entertaining</strong> content or
              presentation slides.
            </Text>
          </Box>
        </UseCase>
      </UseCasesSectionContainer>

      {/* Features */}

      {/* <FeaturesSection
        spacing="4"
        mx="auto"
        maxWidth="900px"
        direction="row"
        display="flex"
        flexWrap="wrap"
        alignItems="flex-start"
        justifyContent="center"
      >
        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <GiCupcake />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            No design skills needed
          </Text>
          <Text fontSize="lg" color="gray.500">
            Wordcloudy is fun and easy to use – anyone can be a creator!
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <MdTimer />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Save time & money
          </Text>
          <Text fontSize="lg" color="gray.500">
            Easily generate awesome designs yourself, without the need for a
            designer.
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot border="gray.500">
            <GoSettings />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Customize anything
          </Text>
          <Text fontSize="lg" color="gray.500">
            Tweak anything and pick from thousands of built-in fonts and shapes.
          </Text>
        </UiFeature>
      </FeaturesSection> */}

      {/* Pricing */}
      <Box mb="5rem" id="pricing">
        <SectionHeader mb="30px" mt="5rem">
          <h1>Flexible pricing that works for you</h1>
          <Text mt="0" mb="0" maxWidth="600px" mx="auto">
            Purchase download packs that never expire or go for unlimited plan
            for a period of time.
          </Text>
        </SectionHeader>

        <PricingPlans showOneTimePaymentNotice={false} />
      </Box>

      <SectionHeader mb="30px" mt="5rem">
        <h1>Frequently Asked Questions</h1>
      </SectionHeader>

      <Box mx="auto" maxWidth="600px" mb="5rem">
        <Question title="Can I customize the designs?">
          Yes, almost everything can be customized! Fonts, colors, layout,
          words. You can even move and resize individual words!
        </Question>
        <Question title="Are these plans subscriptions?">
          No, all our plans are one-time payments. You will be charged only
          once.
        </Question>
        <Question title="Do you offer discounts?">
          We offer generous discounts for teachers, students and non-profits.
          Contact us for more information.
        </Question>
        <Question title="Can I get a refund?">
          Absolutely! If you're unhappy with our product we offer refunds within
          7 days of purchase.
        </Question>
        <Question title="I have more questions!">
          Please check our our{' '}
          <Link passHref href={Urls.faq}>
            <a>FAQ page</a>
          </Link>{' '}
          for more details or{' '}
          <Link passHref href={Urls.contact}>
            <a>ask us</a>
          </Link>
          .
        </Question>
      </Box>

      {/* FAQ */}

      {/* Footer CTA */}
      <StartCreatingCta />
    </SiteLayoutFullWidth>
  )
})

export const StartCreatingCta = () => (
  <SectionHeader mb="120px" mt="80px">
    <h1>Ready to create your own unique designs?</h1>
    <Text mt="0" mb="6">
      It's fast and fun with Wordcloudy – advanced and user-friendly word
      designs generator.
    </Text>

    <Stack spacing="3" direction="row" justifyContent="center">
      <Link href={`${Urls.landing}#pricing`} passHref>
        <Button as="a" size="lg" colorScheme="accent">
          Start creating
        </Button>
      </Link>
    </Stack>
  </SectionHeader>
)

const widthLimit = css`
  max-width: 1300px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
`

const HeaderContentWidthLimit = styled.div`
  ${widthLimit}

  padding: 0 60px;

  display: flex;
  align-items: flex-start;

  ${mobileHeaderBreakpoint} {
    max-width: unset;
    padding: 0 30px;
    padding-bottom: 150px;
    flex-direction: column;
  }
`

const HeaderContainer = styled.div`
  position: relative;
  min-height: 750px;

  ${mobileHeaderBreakpoint} {
    min-height: unset;
  }

  background: #f6fafe;
  background-image: url(/landing/header-bg.jpeg);
  background-size: contain;

  .custom-shape-divider-bottom-1594969392 {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    overflow: hidden;
    line-height: 0;
    transform: rotate(180deg);
  }

  .custom-shape-divider-bottom-1594969392 svg {
    position: relative;
    display: block;
    width: calc(168% + 1.3px);
    height: 140px;

    ${xsBreakpoint} {
      width: calc(268% + 1.3px);
    }
  }

  .custom-shape-divider-bottom-1594969392 .shape-fill {
    fill: #fff;
  }
`

const HeaderTitleContainer = styled.div`
  &:before {
    content: ' ';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    z-index: -1;
    background: #fff7;
    filter: blur(10px);
  }

  position: relative;
  z-index: 2;
  max-width: 430px;
  margin-top: 50px;
  margin-right: 80px;

  /* @media screen and (max-width: 1200px) {
    margin-top: 10px;
  } */

  ${mobileHeaderBreakpoint} {
    max-width: 600px;
    text-align: center;
    margin-top: 30px;
    margin-right: auto;
    margin-left: auto;
  }

  ${xsBreakpoint} {
    margin-top: 10px;
  }
`

const HeaderTitle = styled.h1`
  position: relative;
  color: #3c526f;
  border-bottom: none;
  font-size: 48px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;

  ${xsBreakpoint} {
    font-size: 36px;
  }

  em {
    position: relative;
    display: inline-block;
    z-index: 2;
    font-style: normal;

    &:before {
      content: '';
      display: block;
      position: absolute;
      background: hsl(358, 80%, 65%);
      height: 6px;
      width: 100%;
      bottom: -3px;
      z-index: -1;
      left: 0;
      border-radius: 8px;
    }
  }
`
const HeaderSubtitle = styled.h2`
  color: #3c526f;
  font-family: 'Nunito', sans-serif;
  font-size: 26px;
  font-weight: 300;
  line-height: 30px;
  border-bottom: none;

  ${xsBreakpoint} {
    font-size: 20px;
    line-height: 26px;
  }
`

const HeaderCtaContainer = styled.div`
  margin-top: 60px;
  display: flex;
  flex-direction: column;

  ${mobileHeaderBreakpoint} {
    margin-top: 20px;
    align-items: center;
  }
`

const HeaderCreateNowButton = styled(Button)`
  max-width: 240px;
  width: 100%;
`

const HeaderCtaInfo = styled(Box)`
  font-size: 18px;
  font-family: 'Nunito', sans-serif;
  font-weight: 300;
  color: #3c526f;

  ${xsBreakpoint} {
    display: none;
    font-size: 18px;
    line-height: 26px;
  }
`

const HeaderSliderContainer = styled(motion.div)`
  box-shadow: 0 0 8px 0 #0003;
  border-radius: 16px;
  margin-top: 65px;
  width: 800px;
  z-index: 2;

  @media screen and (max-width: 1200px) {
    margin-right: -40px;
  }

  ${mobileHeaderBreakpoint} {
    margin-right: 0;
    margin-top: 50px;
    width: 100%;
    transform: none !important;
  }
`
const HeaderSlider = styled.div`
  border-radius: 16px;
  .awssld__content {
    border-radius: 16px;
  }

  .awssld__container {
    height: 590px;

    ${xsBreakpoint} {
      height: 50vh;
    }
  }
`

// ----------- Use-cases section ---------------

const useCaseImgStyle = css`
  @media screen and (max-width: 670px) {
    display: none;
  }
`

const useCaseTitleStyle = css`
  margin-left: 30px;
  @media screen and (max-width: 670px) {
    margin-left: 0;
  }
`

const UseCasesSectionContainer = styled(Box)`
  max-width: 850px;
`

const useCaseStyle = css`
  margin-bottom: 40px;

  max-width: 300px;
  width: 100%;

  @media screen and (max-width: 1100px) {
    max-width: 300px;
  }
`

const UseCase = styled(motion.custom(Box))``

// ---------- Features section -----------------

const FeaturesSection = styled(Stack)`
  margin-bottom: 60px;

  margin-top: -10px;
  @media screen and (max-height: 850px) {
    margin-top: 40px;
  }

  ${mobileHeaderBreakpoint} {
    margin-top: -50px;
  }
`

const UiFeature = styled(Box)`
  min-width: 250px;
  color: #3c526f;
`

const UiScreenshot = styled(Box)`
  position: relative;
  width: 110px;
  height: 110px;
  border-width: 3px;
  border-radius: 50%;
  background-clip: padding-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  margin-bottom: 25px;

  svg {
    width: 70px;
    height: 70px;
    * {
      fill: hsl(206, 56%, 37%);
    }
  }

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    margin: 0;
    padding: 0;
  }
`

// ----------- FAQ -------------

// ----------- CtaFooterSection --------------
const SectionHeader = styled(motion.custom(Box))`
  text-align: center;
  margin-left: 20px;
  margin-right: 20px;

  h1 {
    color: #3c526f;
    border-bottom: none;
    font-size: 36px;
    font-weight: 800;
    font-family: 'Nunito', sans-serif;
    margin-bottom: 10px;
  }

  button {
    max-width: 300px;
    width: 100%;
  }

  p {
    font-size: 20px;
    font-family: 'Nunito', sans-serif;
    font-weight: 300;
    color: #3c526f;
  }
`
