import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'
import styled from '@emotion/styled'
import css from '@emotion/css'
import { Button, Box } from '@chakra-ui/core'
import AwesomeSlider from 'react-awesome-slider'
// @ts-ignore

// import AwesomeSliderStyles from 'react-awesome-slider/src/styled/scale-out-animation.scss'

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
              Easy-to-use online art generator. Produce attractive, print-ready
              designs with no prior graphics skills.
            </HeaderSubtitle>
            <HeaderCtaContainer>
              <HeaderCreateNowButton colorScheme="accent" size="lg">
                Create now
              </HeaderCreateNowButton>
              <HeaderCtaInfo>It's free, no sign-up required!</HeaderCtaInfo>
            </HeaderCtaContainer>
          </HeaderTitleContainer>

          <HeaderSliderContainer>
            <HeaderSlider>
              <AwesomeSlider>
                <div data-src="/gallery/gallery-0.png" />
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
            />
          </svg>
        </div>
      </HeaderContainer>
    </SiteLayout>
  )
})

const HeaderSliderContainer = styled.div`
  box-shadow: 0 0 8px 0 #0003;
  transform: rotate(1deg);
  border-radius: 8px;
  margin-top: 100px;
  width: 800px;
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

  padding: 0 20px;

  display: flex;
  align-items: flex-start;
`

const HeaderContainer = styled.div`
  position: relative;
  min-height: 100vh;
  min-height: calc(100vh - 90px);

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
    width: calc(128% + 1.3px);
    height: 137px;
  }

  .custom-shape-divider-bottom-1594969392 .shape-fill {
    fill: #fff;
  }
`

const HeaderTitleContainer = styled.div`
  max-width: 430px;
  margin-top: 60px;
  margin-right: 80px;
`

const HeaderTitle = styled.h1`
  position: relative;
  color: #3c526f;
  border-bottom: none;
  font-size: 48px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
`
const HeaderSubtitle = styled.h2`
  color: #3c526f;
  font-family: 'Nunito', sans-serif;
  font-size: 20px;
  font-weight: 300;
  line-height: 24px;
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

const HeaderCtaInfo = styled.span`
  margin-top: 20px;
  font-size: 20px;
  font-family: 'Nunito', sans-serif;
  color: #3c526f;
`
