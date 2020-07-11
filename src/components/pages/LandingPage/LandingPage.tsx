import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'
import styled from '@emotion/styled'
import css from '@emotion/css'
import { Button } from '@chakra-ui/core'
import AwesomeSlider from 'react-awesome-slider'
// @ts-ignore

// import AwesomeSliderStyles from 'react-awesome-slider/src/styled/scale-out-animation.scss'

export const LandingPage = observer(() => {
  return (
    <SiteLayout fullWidth>
      <HeaderContainer>
        <img
          src="/landing/wave-header.svg"
          css={css`
            position: absolute;
            width: 100%;
            min-width: 100%;
            height: auto;
            max-width: unset;
            z-index: -1;
            left: 0;
            bottom: 20vh;
          `}
        />
        <HeaderContentWidthLimit>
          <HeaderTitleContainer>
            <HeaderTitle>
              Create print-ready, <em>unique</em> word designs in no time!
            </HeaderTitle>
            <HeaderSubtitle>Easy-to-use online art generator</HeaderSubtitle>
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
`

const HeaderTitleContainer = styled.div`
  max-width: 430px;
  margin-top: 60px;
  margin-right: 80px;
`

const HeaderTitle = styled.h1`
  color: #474e5b;
  border-bottom: none;
  font-size: 48px;
`
const HeaderSubtitle = styled.h2`
  color: #9ba1ac;
  font-size: 28px;
  font-weight: 300;
  border-bottom: none;
`

const HeaderCtaContainer = styled.div`
  margin-top: 60px;
  display: flex;
  flex-direction: column;
`

const HeaderCreateNowButton = styled(Button)`
  max-width: 300px;
`

const HeaderCtaInfo = styled.span`
  margin-top: 20px;
  font-size: 20px;
  color: #9ba1ac;
`
