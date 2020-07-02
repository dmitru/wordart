import React from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { Box } from '@chakra-ui/core'
import { Urls } from 'urls'
import { TopNavButton } from 'components/shared/TopNavButton'
import { Button } from 'components/shared/Button'
import { FaRegUserCircle } from 'react-icons/fa'
import { useRouter } from 'next/dist/client/router'
import css from '@emotion/css'

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
        <ContentContainer fullWidth={fullWidth}>
          <Box>
            <Link href="/" passHref>
              <LogoLink>
                <img
                  src="/images/logo-white-text.svg"
                  css={css`
                    height: 40px;
                  `}
                />
              </LogoLink>
            </Link>
          </Box>
          <Box
            flex="1"
            justifyContent="flex-end"
            alignItems="center"
            display="flex"
          >
            {isLoggedIn && (
              <>
                {pathname !== Urls.dashboard && (
                  <Link
                    href={Urls.editor._next}
                    as={Urls.editor.create}
                    passHref
                  >
                    <Button variantColor="accent" leftIcon="add" mr="3">
                      Create
                    </Button>
                  </Link>
                )}

                <Link href={Urls.dashboard} passHref>
                  <TopNavButton variant>Your Designs</TopNavButton>
                </Link>
                <Link href={Urls.pricing} passHref>
                  <TopNavButton>Pricing</TopNavButton>
                </Link>
                <Link href={Urls.account} passHref>
                  <TopNavButton>
                    <Box mr="2">
                      <FaRegUserCircle />
                    </Box>
                    Account
                  </TopNavButton>
                </Link>
              </>
            )}
            {isNotLoggedIn && (
              <>
                <Link href={Urls.login} passHref>
                  <Button variantColor="accent">Sign up</Button>
                </Link>
                <Link href={Urls.login} passHref>
                  <Button variant="outline">Log in</Button>
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
