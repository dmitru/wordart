import { Box } from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import Link from 'next/link'
import React from 'react'
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'
import { Urls } from 'urls'

export type FooterProps = {}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <FooterWrapper bg="gray.100" py="4">
      <ContentContainer
        display="flex"
        alignItems="center"
        flexDirection="column"
      >
        <Box
          mt="1"
          css={css`
            @media screen and (max-width: 768px) {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
          `}
        >
          <FooterLink
            target="_blank"
            href="https://www.facebook.com/wordcloudy"
          >
            <FaFacebook
              css={css`
                margin-right: 5px;
              `}
            />
            Facebook
          </FooterLink>
          <FooterLink
            target="_blank"
            href="https://www.instagram.com/wordcloudy/"
          >
            <FaInstagram
              css={css`
                margin-right: 5px;
              `}
            />
            Instagram
          </FooterLink>
          {/* <FooterLink target="_blank" href="https://twitter.com/wordcloudy">
            <FaTwitter
              css={css`
                margin-right: 5px;
              `}
            />
            Twitter
          </FooterLink> */}
          {/* <FooterLink
            target="_blank"
            href="https://www.youtube.com/channel/UC9I9FoBa7XNGItUSmWr3e7A/"
          >
            <FaYoutube
              css={css`
                margin-right: 5px;
              `}
            />
            YouTube
          </FooterLink> */}
        </Box>

        <Box
          css={css`
            margin-top: 20px;

            @media screen and (max-width: 768px) {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
          `}
        >
          <Link href={Urls.contact} passHref>
            <FooterLink>Contact</FooterLink>
          </Link>
          <FooterLink target="_blank" href="https://wordcloudy.com/blog">
            Blog
          </FooterLink>
          <Link href={Urls.privacyPolicy} passHref>
            <FooterLink>Privacy Policy</FooterLink>
          </Link>
          <Link href={Urls.termsOfUse} passHref>
            <FooterLink>Terms of Use</FooterLink>
          </Link>
        </Box>

        <Box mt="6" color="gray.500">
          Wordcloudy. Copyright ©2020. Made with ❤️ in Canada 🇨🇦
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
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  white-space: nowrap;
`
