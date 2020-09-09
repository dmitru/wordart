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
    video.playbackRate = 0.8
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
            {/* <Box
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
            </Box> */}
            <HeaderTitle>
              Instantly create
              <br /> <em className="first">unique word art</em>
              <br />
              without design skills.
            </HeaderTitle>
            <HeaderSubtitle>
              Powerful & easy-to-use word art generator for personalized prints,
              gifts and more.
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
                No account needed!
              </HeaderCtaInfo>
            </HeaderCtaContainer>
          </HeaderTitleContainer>

          <HeaderSliderContainer>
            <HeaderSlider>
              <Slider play cancelOnInteraction={false} interval={3000}>
                <div data-src="https://wordcloudy.sfo2.digitaloceanspaces.com/media/Untitled%20design.jpg" />
                <div data-src="https://wordcloudy.sfo2.digitaloceanspaces.com/media/landing-slides-jessica.jpg" />
                <div data-src="https://wordcloudy.sfo2.digitaloceanspaces.com/media/landing-sliders-portrait.jpg" />
                <div data-src="https://wordcloudy.sfo2.digitaloceanspaces.com/media/landing-slides-50.jpg" />
                {/* <div data-src="/gallery/gallery-11.jpeg" />
                <div data-src="/gallery/gallery-8.jpeg" />
                <div data-src="/gallery/gallery-10.jpeg" />
                <div data-src="/gallery/gallery-9.jpeg" />
                <div data-src="/gallery/gallery-7.jpeg" />
                <div data-src="/gallery/gallery-4.jpeg" />
                <div data-src="/gallery/gallery-6.jpeg" /> */}
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

      {/* Gifts */}
      {/* <SectionHeader
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
        <h1>Use your own words for special, thoughtful gifts</h1>
        <Text mt="0" mb="0" mx="auto" maxWidth="700px">
          Create, personalize and order high-quality printed gifts from our
          store.
        </Text>
      </SectionHeader> */}

      {/* TODO: gifts gallery */}
      {/* <CreateCtaButton /> */}

      {/* UI video */}
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
        <h1>Your own unique designs – in no time</h1>
        <Text mt="0" mb="0" mx="auto" fontSize="24px" maxWidth="700px">
          Being creative is easy and fun with our user-friendly word art
          generator.
        </Text>
      </SectionHeader>

      {/* UI video */}
      <Box
        boxShadow="md"
        borderColor="gray.200"
        borderStyle="solid"
        borderWidth="1px"
        borderRadius="lg"
        p="5"
        css={css`
          position: relative;
          z-index: 3;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          margin-bottom: 50px;
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

      <Box mt="1rem" mb="3rem">
        <CreateCtaButton />
      </Box>

      {/* Use cases: personal */}
      <Box
        css={css`
          background: linear-gradient(56deg, #f6faff, #f7f9ffeb);
          padding-top: 20px;
          padding-bottom: 20px;
        `}
      >
        <Box>
          <SectionHeader mb="30px">
            <h1>Delight your friends & special ones</h1>
            <Text mt="0" mb="0" maxWidth="600px" mx="auto">
              Life is too short for off-the-shelf gifts. Your loved ones deserve
              better!
            </Text>
          </SectionHeader>

          <UseCasesSectionContainer mb="0rem" mx="auto" mt="3rem">
            <UseCase
              my="2rem"
              p="4"
              mx="20px"
              display="flex"
              flexDirection="row-reverse"
            >
              <Box
                maxWidth="280px"
                width="100%"
                css={useCaseImgStyle}
                ml="2rem"
                display="flex"
                justifyContent="center"
              >
                <img src="/landing/undraw_loving_story_0j59.svg" />
              </Box>
              <Box>
                <Text fontSize="20px" as="ul" color="gray.700">
                  <li>
                    <strong>Start with a template</strong>, then{' '}
                    <strong>add your own words</strong> to make it special.
                  </li>
                  <li>
                    <strong>Add personal touch</strong> by choosing shape and
                    colors.
                  </li>
                  <li>
                    Have your designs <strong>printed and shipped</strong> from
                    our store (as posters, frame prints, t-shirts and more –
                    coming soon!)
                  </li>
                  <li>
                    <strong>No design skills needed</strong> – you too can
                    create amazing word art in minutes!
                  </li>
                </Text>
              </Box>
            </UseCase>
          </UseCasesSectionContainer>
        </Box>
      </Box>

      {/* Use cases */}
      <SectionHeader mb="30px" mt="6rem">
        <h1>For your business & work</h1>
        <Text mt="0" mb="0" maxWidth="600px" mx="auto">
          Use the awesome power of typography and words to your advantage.
        </Text>
      </SectionHeader>

      <UseCasesSectionContainer mb="0rem" mx="auto" mt="3rem">
        <UseCase my="2rem" p="4" mx="20px" display="flex">
          <Box maxWidth="260px" width="100%" css={useCaseImgStyle} mr="2rem">
            <img src="/landing/undraw_add_to_cart_vkjp.svg" />
          </Box>
          <Box>
            <Text fontSize="2rem" color="teal.600" css={useCaseTitleStyle}>
              For Gift Stores
            </Text>
            <Text fontSize="20px" as="ul" color="gray.700">
              <li>
                <strong>Get ahead of competition</strong> and{' '}
                <strong>find new happy customers</strong> with personalized
                items.
              </li>
              <li>
                <strong>Save time creating custom designs</strong> tailored for
                your clients.
              </li>
              <li>
                <strong>Sell designs as high-quality prints</strong>
                {' or as digital downloads in your store.'}
              </li>
            </Text>
          </Box>
        </UseCase>

        {/* <UseCase
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
          <Box maxWidth="260px" width="100%" css={useCaseImgStyle} ml="2rem">
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
                <strong>Enhance your message</strong> with memorable and
                powerful visuals.
              </li>
            </Text>
          </Box>
        </UseCase> */}

        <UseCase
          my="2rem"
          p="4"
          mx="20px"
          display="flex"
          flexDirection="row-reverse"
        >
          <Box maxWidth="300px" width="100%" css={useCaseImgStyle} ml="2rem">
            <img src="/landing/undraw_add_color_19gv.svg" />
          </Box>
          <Box>
            <Text fontSize="2rem" color="pink.600" css={useCaseTitleStyle}>
              For Artists & Designers
            </Text>
            <Text fontSize="20px" color="gray.700" as="ul">
              <li>
                <strong>Explore new design territory</strong> with 100%
                customizable word designs
              </li>
              <li>
                <strong>Save time</strong> creating unique design assets and
                backgrounds
              </li>
              <li>
                Export designs in <strong>high-res raster or vector</strong>{' '}
                formats.
              </li>
            </Text>
          </Box>
        </UseCase>

        {/* <UseCase
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
            <img src="/landing/undraw_Preparation_re_t0ce.svg" />
          </Box>
          <Box>
            <Text fontSize="2rem" color="orange.600">
              For Presenters and Educators
            </Text>
            <Text fontSize="20px" color="gray.700">
              <strong>Captivate and engage</strong> your audience and students
              with <strong>unique and entertaining</strong> content and slides.
            </Text>
          </Box>
        </UseCase> */}
      </UseCasesSectionContainer>

      <CreateCtaButton />

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
      <Box
        mt="3rem"
        css={css`
          background: linear-gradient(56deg, #f6faff, #f7f9ffeb);
          padding-top: 20px;
          padding-bottom: 10px;
        `}
        id="pricing"
      >
        <Box mb="3rem">
          <SectionHeader mb="30px">
            <h1>Flexible pricing that works for you</h1>
            <Text mt="0" mb="0" maxWidth="600px" mx="auto">
              Purchase digitals downloads in highest quality,
              <br />
              for personal or commercial use.
            </Text>
          </SectionHeader>

          <PricingPlans showOneTimePaymentNotice={false} />
        </Box>
      </Box>

      <SectionHeader mb="30px" mt="4rem">
        <h1>Frequently Asked Questions</h1>
      </SectionHeader>

      <Box mx="auto" maxWidth="700px" mb="5rem" px="6">
        <Question title="What's your refund policy?">
          If you're unhappy with our product we'll give you a refund within 14
          days of purchase.
        </Question>
        <Question title="Are these plans subscriptions?">
          No, all our plans are one-time payments. You will only be charged
          once.
        </Question>
        <Question title="Can I use Wordcloudy for free?">
          You can use Wordcloudy for free for personal use. If you'd like to use
          designs created with Wordcloudy for any commercial purpose (e.g.
          selling digital or physical goods), please purchase one of our plans.
        </Question>
        <Question title="Do you offer discounts?">
          We offer generous discounts for teachers, students and non-profits.
          Contact us for more information.
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
  <SectionHeader mb="120px" mt="120px">
    <h1>Ready to create your own unique designs?</h1>
    <Text mt="0" mb="6">
      It's fast and fun with Wordcloudy – no account required.
    </Text>

    <CreateCtaButton />
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
  max-width: 400px;
  min-width: 370px;
  width: 100%;
  margin-top: 70px;
  margin-right: 30px;

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
      height: 1.1em;
      width: 100%;
      width: calc(100% + 0.5em);
      bottom: -0.05em;
      z-index: -2;
      left: 0;
      left: calc(0px - 0.25em);
      /* border-radius: 0.5em; */
    }

    &.first {
      color: white;
      &:before {
        background: #ff8a8f;
      }
    }

    &.second {
      color: white;
      &:before {
        background: #33bec0;
      }
    }
  }
`
const HeaderSubtitle = styled.h2`
  color: #3c526f;
  font-family: 'Nunito', sans-serif;
  font-size: 26px;
  font-weight: 400;
  line-height: 36px;
  border-bottom: none;

  em {
    position: relative;
    display: inline-block;
    z-index: 2;
    font-style: normal;

    &:before {
      content: '';
      display: block;
      position: absolute;
      height: 1em;
      width: 100%;
      width: calc(100% + 0.5em);
      z-index: -2;
      height: 1.2em;
      bottom: -0.1em;
      left: 0;
      left: calc(0px - 0.25em);
      border-radius: 8px;
    }

    &.first {
      color: white;
      &:before {
        background: #ff7c81;
      }
    }

    &.second {
      color: white;
      &:before {
        background: #33bec0;
      }
    }
  }

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
  max-width: 300px;
  font-size: 1.3rem;
  width: 100%;
`

const HeaderCtaInfo = styled(Box)`
  font-size: 20px;
  font-family: 'Nunito', sans-serif;
  font-weight: 300;
  color: #3c526f;

  ${xsBreakpoint} {
    display: none;
    font-size: 18px;
    line-height: 26px;
  }
`

const CreateCtaButton = () => (
  <Box textAlign="center">
    <Link href={Urls.editor.create} passHref>
      <HeaderCreateNowButton
        // @ts-ignore
        as="a"
        colorScheme="accent"
        size="lg"
        rightIcon={<ChevronRightIcon />}
      >
        Start creating
      </HeaderCreateNowButton>
    </Link>
  </Box>
)

const HeaderSliderContainer = styled(motion.div)`
  box-shadow: 0 0 8px 0 #0003;
  border-radius: 16px;
  margin-top: 65px;
  max-width: 800px;
  width: 100%;
  z-index: 2;

  margin-right: -100px;

  @media screen and (max-width: 1200px) {
    margin-right: -40px;
  }

  ${mobileHeaderBreakpoint} {
    margin-right: auto;
    margin-left: auto;
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
  max-width: 800px;
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
    font-size: 22px;
    font-family: 'Nunito', sans-serif;
    font-weight: 300;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
    color: #3c526f;
  }
`
