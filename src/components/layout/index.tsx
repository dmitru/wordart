import React from 'react'
import styled from '@emotion/styled'
import { Header } from 'components/header'

export type LayoutProps = {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutWrapper>
      <Header />
      <div>{children}</div>
    </LayoutWrapper>
  )
}

export const LayoutWrapper = styled.div``
