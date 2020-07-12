import React from 'react'
import styled from '@emotion/styled'
import { Header } from 'components/layouts/SiteLayout/Header'
import { Box } from '@chakra-ui/core'

export type SiteFormLayoutProps = {
  children: React.ReactNode
  darkenBg?: boolean
  fullWidth?: boolean
  fullHeight?: boolean
  noFooter?: boolean
}

export const SiteFormLayout: React.FC<SiteFormLayoutProps> = ({ children }) => {
  return (
    <SiteFormLayoutWrapper bg="gray.100">
      <Header fullWidth={false} hideCreate />
      <ContentWrapper>{children}</ContentWrapper>
    </SiteFormLayoutWrapper>
  )
}

const ContentWrapper = styled(Box)`
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  max-width: 1000px;
  padding: 10px 20px;
  margin: 0 auto;
  flex: 1 0 auto;
`

const SiteFormLayoutWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`
