import React from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'
import { Urls } from 'urls'
import { Box } from '@chakra-ui/core'

export type FooterProps = {}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <FooterWrapper bg="gray.100" py="6">
      <ContentContainer
        display="flex"
        alignItems="center"
        flexDirection="column"
      >
        <Box>
          <Link href={Urls.privacyPolicy} passHref>
            <FooterLink>Privacy Policy</FooterLink>
          </Link>
          <Link href={Urls.termsOfUse} passHref>
            <FooterLink>Terms of Use</FooterLink>
          </Link>
        </Box>
        <Box mt="6" color="gray.500">
          Copyright 2019 – 2020. Made in Canada 🇨🇦
        </Box>
      </ContentContainer>
    </FooterWrapper>
  )
}

export const FooterWrapper = styled(Box)<{ theme: any }>``

export const ContentContainer = styled(Box)<{ theme: any }>`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px 20px;
`

export const FooterLink = styled.a<{ theme: any }>`
  padding: 10px;
  color: ${({ theme }) => theme.colors.primary};
`
