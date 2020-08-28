import { Box, Button, Stack, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { AnimatePresence, motion } from 'framer-motion'
import { SiteLayoutFullWidth } from 'components/layouts/SiteLayout/SiteLayout'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React from 'react'
import AwesomeSlider from 'react-awesome-slider'
// @ts-ignore
import withAutoplay from 'react-awesome-slider/dist/autoplay'
import { GiCupcake } from 'react-icons/gi'
import { Urls } from 'urls'
import { MdColorLens } from 'react-icons/md'
import { BsGrid3X3GapFill } from 'react-icons/bs'
import { GoSettings } from 'react-icons/go'
import { AiFillPrinter } from 'react-icons/ai'
import { IoIosChatbubbles } from 'react-icons/io'
import { ChevronRightIcon } from '@chakra-ui/icons'

const Slider = withAutoplay(AwesomeSlider)

const mobileHeaderBreakpoint = `@media screen and (max-width: 1100px)`
const xsBreakpoint = `@media screen and (max-width: 500px)`

export const LandingPage = observer(() => {
  return (
    <SiteLayoutFullWidth>
      <HeaderContainer>
        <HeaderContentWidthLimit>
          <HeaderTitleContainer>
            <HeaderTitle>
              Create unique word designs <em>in no time</em>.
            </HeaderTitle>
            <HeaderSubtitle>
              Easy-to-use word art generator for social media posts, prints,
              merchandise and more. <br /> <br /> No design skills required.
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
                Try without a sign-up!
              </HeaderCtaInfo>
            </HeaderCtaContainer>
          </HeaderTitleContainer>

          <HeaderSliderContainer
            initial={{ opacity: 0 }}
            transition={{ ease: 'easeInOut', duration: 0.5 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
          >
            <HeaderSlider>
              <Slider play={true} cancelOnInteraction={false} interval={3000}>
                <div data-src="/gallery/gallery-11.jpeg" />
                <div data-src="/gallery/gallery-9.jpeg" />
                <div data-src="/gallery/gallery-10.jpeg" />
                <div data-src="/gallery/gallery-8.jpeg" />
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

      <UseCasesSectionContainer mb="4rem" mx="auto" mt="20px">
        <Box
          css={useCaseStyle}
          p="4"
          mx="20px"
          boxShadow="md"
          borderColor="gray.200"
          borderStyle="solid"
          borderWidth="1px"
        >
          <Text fontSize="xl" fontWeight="medium" color="gray.500">
            For bloggers
          </Text>
          <Text>
            <strong>Grab attention and evoke strong emotions</strong> in your
            audience by the combined power of words, typography, shapes and
            colors!
          </Text>
        </Box>

        <Box
          css={useCaseStyle}
          p="4"
          mx="20px"
          boxShadow="md"
          borderColor="gray.200"
          borderStyle="solid"
          borderWidth="1px"
        >
          <Text fontSize="xl" fontWeight="medium" color="gray.500">
            For merchandise
          </Text>
          <Text>
            <strong>Delight your customers with new awesome products!</strong>{' '}
            Quickly produce print-ready art for your next top-selling item:{' '}
            canvas prints, posters, t-shirts and more.
          </Text>
        </Box>

        <Box
          css={useCaseStyle}
          p="4"
          mx="20px"
          boxShadow="md"
          borderColor="gray.200"
          borderStyle="solid"
          borderWidth="1px"
        >
          <Text fontSize="xl" fontWeight="medium" color="gray.500">
            For presenters & educators
          </Text>
          <Text>
            <strong>Captivate and engage</strong> your audience or students with
            unique and entertaining content or presentation slides.
          </Text>
        </Box>

        <Box
          css={useCaseStyle}
          p="4"
          mx="20px"
          boxShadow="md"
          borderColor="gray.200"
          borderStyle="solid"
          borderWidth="1px"
        >
          <Text fontSize="xl" fontWeight="medium" color="gray.500">
            For designers
          </Text>
          <Text>
            <strong>
              Save your time creating unique graphic assets and backgrounds.
            </strong>
            Export your designs as SVG to import in your favorite design tool.
          </Text>
        </Box>
      </UseCasesSectionContainer>

      <FeaturesSection
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
            No design skills required
          </Text>
          <Text color="gray.500">
            Wordcloudy is fun and easy to use – anyone can be a creator!
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <GoSettings />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Customize anything
          </Text>
          <Text color="gray.500">
            Choose shape, placement density, layout, fonts, colors... anything
            can be tweaked!
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <AiFillPrinter />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Crisp image quality
          </Text>
          <Text color="gray.500">
            Export your designs at high resolution as PNG, JPEG images or as
            scalable vector graphics (SVG).
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <MdColorLens />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Built-in color themes
          </Text>
          <Text color="gray.500">
            Quickly find that right feel with our carefully crafted color themes
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot border="gray.500">
            <BsGrid3X3GapFill />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Huge styles library
          </Text>
          <Text color="gray.500">
            Pick from thousands build-in fonts and shapes, or upload your own!
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <IoIosChatbubbles />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Multi-language support
          </Text>
          <Text color="gray.500">
            Create designs in world's most common languages!
          </Text>
        </UiFeature>
      </FeaturesSection>

      <CtaFooterSection>
        <h1>Ready to create your own unique designs?</h1>
        <Text mt="0" mb="6">
          It's fast and fun with Wordcloudy – the world's leading word designs
          generator app.
        </Text>

        <Stack spacing="3" direction="row" justifyContent="center">
          <Link href={Urls.editor.create} passHref>
            <Button as="a" size="lg" colorScheme="accent">
              Start creating
            </Button>
          </Link>

          <Button
            as="a"
            target="_blank"
            href="https://wordcloudy.com/blog/getting-started-in-5-minutes/"
            size="lg"
            variant="outline"
          >
            See tutorial
          </Button>
        </Stack>
      </CtaFooterSection>
    </SiteLayoutFullWidth>
  )
})

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
  position: relative;
  z-index: 2;
  max-width: 430px;
  margin-top: 80px;
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

    &:before {
      content: '';
      display: block;
      position: absolute;
      background: hsl(358, 80%, 65%);
      height: 6px;
      width: 100%;
      bottom: 3px;
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
  transform: rotate(1deg);
  border-radius: 8px;
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
    transform: none;
  }
`
const HeaderSlider = styled.div`
  .awssld__container {
    height: 590px;

    ${xsBreakpoint} {
      height: 50vh;
    }
  }
`

// ----------- Use-cases section ---------------
const UseCasesSectionContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
})

const useCaseStyle = css`
  margin-bottom: 40px;

  max-width: 300px;
  width: 100%;

  @media screen and (max-width: 1100px) {
    max-width: 300px;
  }
`

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

// ----------- CtaFooterSection --------------
const CtaFooterSection = styled(Box)`
  text-align: center;

  margin: 0 20px;

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

  margin-top: 80px;
  margin-bottom: 120px;
`
