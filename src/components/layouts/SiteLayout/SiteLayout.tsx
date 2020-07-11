import React from 'react'
import styled from '@emotion/styled'
import { Header } from 'components/layouts/SiteLayout/Header'
import { Footer } from 'components/layouts/SiteLayout/Footer'
import { Box } from '@chakra-ui/core'

export type SiteLayoutProps = {
  children: React.ReactNode
  fullWidth?: boolean
  fullHeight?: boolean
  noFooter?: boolean
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({
  children,
  fullWidth = false,
  fullHeight = false,
  noFooter = false,
}) => {
  return (
    <SiteLayoutWrapper>
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
  ${(p) => !p.fullWidth && 'max-width: 1000px'};
  ${(p) =>
    p.fullHeight &&
    'height: 100vh; height: calc(100vh - 60px); overflow: hidden;'};
  padding: 10px 20px;
  margin: 0 auto;
  flex: 1 0 auto;
`

const SiteLayoutWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
`
