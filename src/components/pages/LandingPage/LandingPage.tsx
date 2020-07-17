import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { observer } from 'mobx-react'
import React from 'react'
import styled from '@emotion/styled'
import css from '@emotion/css'
import { Button, Box, Text, Stack } from '@chakra-ui/core'
import AwesomeSlider from 'react-awesome-slider'
import AutoplaySlider from 'react-awesome-slider/hoc/autoplay'

export const LandingPage = observer(() => {
  return (
    <SiteLayout fullWidth>
      <HeaderContainer bg="gray.100">
        <HeaderContentWidthLimit>
          <HeaderTitleContainer>
            <HeaderTitle>
              Create <em>unique</em> word designs in no time!
            </HeaderTitle>
            <HeaderSubtitle>
              Easy-to-use online art generator.
              <br />
              <br /> Create attractive results with no prior design skills, and
              download them in professional print-ready quality.
            </HeaderSubtitle>

            <HeaderCtaContainer>
              <HeaderCtaInfo mb="3">Try without a sign-up!</HeaderCtaInfo>
              <Stack spacing="3" direction="row" alignItems="center">
                <HeaderCreateNowButton
                  colorScheme="accent"
                  size="lg"
                  minWidth="200px"
                >
                  Create now
                </HeaderCreateNowButton>
                <HeaderCtaInfo>or</HeaderCtaInfo>
                <HeaderCreateNowButton
                  colorScheme="accent"
                  variant="outline"
                  size="lg"
                >
                  Sign up
                </HeaderCreateNowButton>
              </Stack>
            </HeaderCtaContainer>
          </HeaderTitleContainer>

          <HeaderSliderContainer>
            <HeaderSlider>
              <AwesomeSlider>
                <div data-src="/gallery/gallery-0.png" />
                <div data-src="/gallery/gallery-1.png" />
                <div data-src="/gallery/gallery-1.png" />
                <div data-src="/gallery/gallery-1.png" />
                <div data-src="/gallery/gallery-1.png" />
                <div data-src="/gallery/gallery-1.png" />
              </AwesomeSlider>
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

      <FeaturesSection
        spacing="4"
        mx="auto"
        maxWidth="900px"
        direction="row"
        display="flex"
        flexWrap="wrap"
        alignItems="flex-start"
        justifyContent="center"
        mt="60px"
      >
        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <img src="https://placehold.it/100x100" />
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
            <img src="https://placehold.it/100x100" />
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
            <img src="https://placehold.it/100x100" />
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
            <img src="https://placehold.it/100x100" />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Huge built-in library
          </Text>
          <Text color="gray.500">
            Pick from thousands build-in fonts and shapes, or upload your own!
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <img src="https://placehold.it/100x100" />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Multi-language support
          </Text>
          <Text color="gray.500">
            Let your designs speak the language of your audience.
          </Text>
        </UiFeature>

        <UiFeature maxWidth="240px" textAlign="center" p="5">
          <UiScreenshot>
            <img src="https://placehold.it/100x100" />
          </UiScreenshot>
          <Text fontWeight="bold" fontSize="lg">
            Crisp image quality
          </Text>
          <Text color="gray.500">
            Export your designs as images in PNG, JPEG at high resolution or as
            SVG.
          </Text>
        </UiFeature>
      </FeaturesSection>

      <CtaFooterSection>
        <h1>Ready to create your unique designs?</h1>
        <Text mt="0" mb="6">
          It's fast and fun with Wordcloudy – the world's leading word designs
          generator app.
        </Text>
        <Button size="lg" colorScheme="accent">
          Start creating
        </Button>
      </CtaFooterSection>
    </SiteLayout>
  )
})

const HeaderSliderContainer = styled.div`
  box-shadow: 0 0 8px 0 #0003;
  transform: rotate(1deg);
  border-radius: 8px;
  margin-top: 80px;
  width: 800px;
  z-index: 2;
`
const HeaderSlider = styled.div`
  .awssld__container {
    height: 590px;
  }
`

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
`

const HeaderContainer = styled.div`
  position: relative;
  min-height: 100vh;
  min-height: calc(100vh - 200px);

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
  }

  .custom-shape-divider-bottom-1594969392 .shape-fill {
    fill: #fff;
  }
`

const HeaderTitleContainer = styled.div`
  max-width: 430px;
  margin-top: 50px;
  margin-right: 80px;
`

const HeaderTitle = styled.h1`
  position: relative;
  color: #3c526f;
  border-bottom: none;
  font-size: 56px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;

  em {
    position: relative;
    z-index: 2;

    &:before {
      content: '';
      display: block;
      position: absolute;
      background: hsl(358, 80%, 65%);
      height: 4px;
      width: 100%;
      bottom: 10px;
      z-index: -1;
      left: 0;
      border-radius: 8px;
    }
  }
`
const HeaderSubtitle = styled.h2`
  color: #3c526f;
  font-family: 'Nunito', sans-serif;
  font-size: 24px;
  font-weight: 300;
  line-height: 30px;
  border-bottom: none;
`

const HeaderCtaContainer = styled.div`
  margin-top: 60px;
  display: flex;
  flex-direction: column;
`

const HeaderCreateNowButton = styled(Button)`
  max-width: 180px;
`

const HeaderCtaInfo = styled(Box)`
  font-size: 20px;
  font-family: 'Nunito', sans-serif;
  font-weight: 300;
  color: #3c526f;
`

// ---------- Features section -----------------

const FeaturesSection = styled(Stack)`
  margin-bottom: 60px;
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
  display: table;
  margin: 0 auto;
  margin-bottom: 25px;

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

  h1 {
    color: #3c526f;
    border-bottom: none;
    font-size: 36px;
    font-weight: 800;
    font-family: 'Nunito', sans-serif;
    margin-bottom: 10px;
  }

  button {
    width: 300px;
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
