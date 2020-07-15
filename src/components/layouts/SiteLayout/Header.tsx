import React from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import {
  Box,
  Menu,
  MenuButton,
  Portal,
  MenuTransition,
  MenuList,
} from '@chakra-ui/core'
import { Urls } from 'urls'
import { Button } from 'components/shared/Button'
import { FaRegUserCircle, FaSignOutAlt } from 'react-icons/fa'
import { useRouter } from 'next/dist/client/router'
import css from '@emotion/css'
import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { TopNavButton } from 'components/shared/TopNavButton'
import { useToasts } from 'use-toasts'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'

export type HeaderProps = {
  fullWidth?: boolean
  hideCreate?: boolean
}

export const Header: React.FC<HeaderProps> = observer(
  ({ fullWidth = false, hideCreate = false }) => {
    const { authStore } = useStore()
    const toasts = useToasts()
    const router = useRouter()
    const { pathname } = router

    const isLoggedIn = authStore.isLoggedIn === true
    const isNotLoggedIn = authStore.isLoggedIn === false
    const isLoggedInAndNotVerified =
      authStore.isLoggedIn === true && !authStore.isEmailConfirmed

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

            <Link href={Urls.contact} passHref>
              <TopNavLink active={pathname === Urls.contact} ml="5">
                Contact
              </TopNavLink>
            </Link>
          </Box>

          <Box
            flex="1"
            justifyContent="flex-end"
            alignItems="center"
            display="flex"
          >
            {!hideCreate &&
              pathname !== Urls.yourDesigns &&
              !isLoggedInAndNotVerified && (
                <Link href={Urls.editor._next} as={Urls.editor.create} passHref>
                  <Button colorScheme="accent" leftIcon={<AddIcon />} mr="3">
                    Create
                  </Button>
                </Link>
              )}
            {isLoggedIn && (
              <>
                {!isLoggedInAndNotVerified && (
                  <Link href={Urls.yourDesigns} passHref>
                    <TopNavLink active={pathname === Urls.yourDesigns}>
                      Your Designs
                    </TopNavLink>
                  </Link>
                )}

                {/* Account menu */}
                <Menu placement="bottom-end">
                  <MenuButton as={TopNavMenuButton} py="2" px="3">
                    <Box mr="2">
                      <FaRegUserCircle />
                    </Box>
                    Account
                    <Box mr="2">
                      <ChevronDownIcon />
                    </Box>
                  </MenuButton>

                  <Portal>
                    <MenuTransition>
                      {(styles) => (
                        <MenuList
                          // @ts-ignore
                          css={styles}
                        >
                          <MenuItemWithIcon
                            icon={<FaRegUserCircle />}
                            title="Your account"
                            onClick={() => {
                              router.push(Urls.account)
                            }}
                          />
                          <MenuItemWithIcon
                            icon={<FaSignOutAlt />}
                            title="Log out"
                            onClick={() => {
                              authStore.logout()
                              toasts.showInfo({ title: 'You have logged out' })
                              router.replace(Urls.login)
                            }}
                          />
                        </MenuList>
                      )}
                    </MenuTransition>
                  </Portal>
                </Menu>
              </>
            )}
            {isNotLoggedIn && (
              <>
                <Link href={Urls.signup} passHref>
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

const topNavLink = (p: { active?: boolean }) => css`
  color: white;
  display: inline-flex;
  align-items: center;
  height: 60px;
  padding: 0 15px;
  position: relative;
  box-sizing: content-box;
  text-transform: uppercase;
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  cursor: pointer;
  box-shadow: none !important;

  background: transparent !important;
  ${p.active && `background: #0002 !important;`}

  color: #fefeff;

  &:hover,
  &:focus {
    text-decoration: none;
    background: #fff2 !important;

    background: ${p.active ? '#0002' : '#00000014'} !important;
  }
`

const TopNavLink = styled.a<{
  active?: boolean
}>`
  ${topNavLink}
`

const TopNavMenuButton = styled.button<{
  active?: boolean
}>`
  ${topNavLink}
`
