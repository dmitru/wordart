import React from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'
import { Box } from 'components/shared/Box'
import { Urls } from 'urls'

export type FooterProps = {}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <FooterWrapper>
      <ContentContainer>
        Copyright 2020
        <Link href={Urls.privacyPolicy} passHref>
          <FooterLink>Privacy Policy</FooterLink>
        </Link>
        <Link href={Urls.termsOfUse} passHref>
          <FooterLink>Terms of Use</FooterLink>
        </Link>
      </ContentContainer>
    </FooterWrapper>
  )
}

export const FooterWrapper = styled(Box)`
  background: ${(p) => p.theme.colors.light1};
`

export const ContentContainer = styled(Box)`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px 20px;
`

export const FooterLink = styled.a`
  padding: 10px;
  color: ${({ theme }) => theme.colors.primary};
`
