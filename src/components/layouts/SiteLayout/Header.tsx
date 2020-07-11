import React from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { Box } from '@chakra-ui/core'
import { Urls } from 'urls'
import { Button } from 'components/shared/Button'
import { FaRegUserCircle } from 'react-icons/fa'
import { useRouter } from 'next/dist/client/router'
import css from '@emotion/css'
import { AddIcon } from '@chakra-ui/icons'
import { TopNavButton } from 'components/shared/TopNavButton'

export type HeaderProps = {
  fullWidth?: boolean
}

export const Header: React.FC<HeaderProps> = observer(
  ({ fullWidth = false }) => {
    const { authStore } = useStore()
    const { pathname } = useRouter()

    const isLoggedIn = authStore.isLoggedIn === true
    const isNotLoggedIn = authStore.isLoggedIn === false

    return (
      <HeaderWrapper>
        <ContentContainer>
          <Box display="flex" alignItems="center">
            <Link href="/" passHref>
              <LogoLink>
                <img
                  src="/images/logo-white-text.svg"
                  css={css`
                    height: 100%;
                    width: auto;
                  `}
                />
              </LogoLink>
            </Link>

            <Link href={Urls.faq} passHref>
              <TopNavLink active={pathname === Urls.faq} ml="5">
                FAQ
              </TopNavLink>
            </Link>
            <Link href={Urls.pricing} passHref>
              <TopNavLink active={pathname === Urls.pricing}>
                Pricing
              </TopNavLink>
            </Link>
          </Box>

          <Box
            flex="1"
            justifyContent="flex-end"
            alignItems="center"
            display="flex"
          >
            {pathname !== Urls.yourDesigns && (
              <Link href={Urls.editor._next} as={Urls.editor.create} passHref>
                <Button colorScheme="accent" leftIcon={<AddIcon />} mr="3">
                  Create
                </Button>
              </Link>
            )}
            {isLoggedIn && (
              <>
                <Link href={Urls.yourDesigns} passHref>
                  <TopNavLink active={pathname === Urls.yourDesigns}>
                    Your Designs
                  </TopNavLink>
                </Link>
                <Link href={Urls.account} passHref>
                  <TopNavLink active={pathname === Urls.account}>
                    <Box mr="2">
                      <FaRegUserCircle />
                    </Box>
                    Account
                  </TopNavLink>
                </Link>
              </>
            )}
            {isNotLoggedIn && (
              <>
                <Link href={Urls.login} passHref>
                  <TopNavButton variant="accent" mr="3">
                    Sign up
                  </TopNavButton>
                </Link>
                <Link href={Urls.login} passHref>
                  <TopNavLink active={pathname === Urls.login}>
                    Log in
                  </TopNavLink>
                </Link>
              </>
            )}
          </Box>
        </ContentContainer>
      </HeaderWrapper>
    )
  }
)

export const LogoLink = styled.a`
  color: white;
  font-size: 1.6rem;
  height: 30px;
  margin-right: 2rem;
  &,
  &:focus,
  &:hover {
    text-decoration: none;
  }
  font-weight: 600;
`

export const HeaderWrapper = styled(Box)<{ theme: any }>`
  background: ${(p) => p.theme.colors.header.bg};
`

export const ContentContainer = styled(Box)<{
  theme: any
  fullWidth?: boolean
}>`
  display: flex;
  width: 100%;
  ${(p) => !p.fullWidth && 'max-width: 1000px;'}
  margin: 0 auto;
  padding: 10px 20px;
  height: 60px;
`

const TopNavLink = styled.a<{
  active?: boolean
}>`
  color: white;
  display: inline-flex;
  align-items: center;
  height: 60px;
  padding: 0 15px;
  position: relative;
  box-sizing: content-box;

  ${(p) => p.active && `background: #0002;`}

  ${(p) =>
    p.active &&
    `
    &::after {
      content: '';
      display: block;
      position: absolute;
      height: 3px;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background: #fff;
      border-radius: 4px;
    }
  `}

  color: #fefeff;

  &:hover,
  &:focus {
    text-decoration: none;
    background: #fff2;

    ${(p) =>
      `
        background: ${p.active ? '#0002' : '#00000014'};
    `}
  }
`
