import React from 'react'
import styled from '@emotion/styled'
import { Header } from 'components/layouts/SiteLayout/Header'
import { Footer } from 'components/layouts/SiteLayout/Footer'
import { Box } from '@chakra-ui/core'

export type SiteLayoutProps = {
  children: React.ReactNode
  fullWidth?: boolean
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({
  children,
  fullWidth = false,
}) => {
  return (
    <SiteLayoutWrapper>
      <Header />
      <ContentWrapper fullWidth={fullWidth}>{children}</ContentWrapper>
      <Footer />
    </SiteLayoutWrapper>
  )
}

const ContentWrapper = styled(Box)<{ fullWidth?: boolean }>`
  width: 100%;
  ${(p) => !p.fullWidth && 'max-width: 1000px'};
  padding: 10px 20px;
  margin: 0 auto;
  flex: 1 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
`

const SiteLayoutWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100%;
`
