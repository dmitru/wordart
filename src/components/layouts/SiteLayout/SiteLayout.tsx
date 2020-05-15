import React from 'react'
import styled from '@emotion/styled'
import { Header } from 'components/layouts/SiteLayout/Header'
import { Footer } from 'components/layouts/SiteLayout/Footer'
import { Box } from 'components/shared/Box'

export type SiteLayoutProps = {
  children: React.ReactNode
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({ children }) => {
  return (
    <SiteLayoutWrapper>
      <Header />
      <ContentWrapper>{children}</ContentWrapper>
      <Footer />
    </SiteLayoutWrapper>
  )
}

const ContentWrapper = styled(Box)`
  flex: 1 0 auto;
  overflow-y: auto;
`

const SiteLayoutWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
`
