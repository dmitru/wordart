import { Box } from '@chakra-ui/core'
import styled from '@emotion/styled'
import { Footer } from 'components/layouts/SiteLayout/Footer'
import { Header } from 'components/layouts/SiteLayout/Header'
import React from 'react'
import { Helmet } from 'react-helmet'
import { getTabTitle } from 'utils/tab-title'

export type SiteLayoutProps = {
  children: React.ReactNode
  darkenBg?: boolean
  fullWidth?: boolean
  fullHeight?: boolean
  noFooter?: boolean
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({
  children,
  fullWidth = false,
  fullHeight = false,
  noFooter = false,
  darkenBg = false,
}) => {
  return (
    <SiteLayoutWrapper bg={darkenBg ? 'gray.100' : undefined}>
      <Helmet>
        <title>{getTabTitle()}</title>
      </Helmet>
      <Header fullWidth={fullWidth} />
      <ContentWrapper fullWidth={fullWidth} fullHeight={fullHeight}>
        {children}
      </ContentWrapper>
      {!noFooter && <Footer />}
    </SiteLayoutWrapper>
  )
}

const ContentWrapper = styled(Box)<{
  fullWidth?: boolean
  fullHeight?: boolean
}>`
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  ${(p) => !p.fullWidth && 'max-width: 1000px; padding: 10px 20px 60px;'};
  ${(p) =>
    p.fullHeight &&
    'height: 100vh; height: calc(100vh - 60px); overflow: hidden;'};
  margin: 0 auto;
  flex: 1 0 auto;
`

const SiteLayoutWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
`
