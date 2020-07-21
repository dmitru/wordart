import {
  Box,
  Divider,
  IconButton,
  Button,
  Link as ChakraLink,
  LinkProps,
} from '@chakra-ui/core'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRightIcon, AddIcon, CloseIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { Theme } from 'chakra'
import { observer } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { IoMdMenu } from 'react-icons/io'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'
import { LockBodyScroll } from 'utils/use-lock-body-scroll'
import Headroom from 'react-headroom'

export type MobileHeaderProps = {
  fullWidth?: boolean
  hideCreate?: boolean
}

export const MobileHeader: React.FC<MobileHeaderProps> = observer(
  ({ fullWidth = false, hideCreate = false }) => {
    const { authStore } = useStore()
    const toasts = useToasts()
    const router = useRouter()
    const { pathname } = router

    const [isShowing, setIsShowing] = useState(false)

    // Close menu on navigation
    useEffect(() => {
      setIsShowing(false)
    }, [pathname])

    const isLoggedIn = authStore.isLoggedIn === true
    const isLoggedInAndNotVerified =
      authStore.isLoggedIn === true && !authStore.isEmailConfirmed

    const MobileHeader = (
      <>
        <Headroom style={{ zIndex: 100 }}>
          <MobileHeaderWrapper>
            <ContentContainer>
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

              <BurgerMenuButton onClick={() => setIsShowing(true)}>
                <IoMdMenu
                  css={css`
                    margin-right: 8px;
                  `}
                />{' '}
                Menu
              </BurgerMenuButton>
            </ContentContainer>
          </MobileHeaderWrapper>
        </Headroom>

        <AnimatePresence initial={false}>
          {isShowing && (
            <>
              <motion.nav
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ ease: 'easeOut', duration: 0.3 }}
                variants={{
                  open: { opacity: 1, y: '0%' },
                  closed: { opacity: 0, y: '-100%' },
                }}
                css={css`
                  position: fixed;
                  overflow: auto;
                  background: #fff;
                  padding-bottom: 60px;
                  z-index: 1000;
                  top: 0;
                  left: 0;
                  height: 100%;
                  width: 100%;
                `}
              >
                <Box mt="60px" display="flex" flexDirection="column">
                  {!hideCreate &&
                    pathname !== Urls.yourDesigns &&
                    !isLoggedInAndNotVerified && (
                      <>
                        <Box mb="5">
                          <Link
                            href={Urls.editor._next}
                            as={Urls.editor.create}
                            passHref
                          >
                            <Button
                              ml="3"
                              maxWidth="500px"
                              active={pathname === Urls.landing}
                              colorScheme="accent"
                              leftIcon={<AddIcon />}
                            >
                              Create design
                            </Button>
                          </Link>
                        </Box>
                      </>
                    )}

                  <Link href={Urls.landing} passHref>
                    <MenuLink active={pathname === Urls.landing}>Home</MenuLink>
                  </Link>

                  <Link href={Urls.faq} passHref>
                    <MenuLink active={pathname === Urls.faq}>FAQ</MenuLink>
                  </Link>

                  <Link href={Urls.pricing} passHref>
                    <MenuLink active={pathname === Urls.pricing}>
                      Pricing
                    </MenuLink>
                  </Link>

                  <Link href={Urls.contact} passHref>
                    <MenuLink active={pathname === Urls.contact}>
                      Contact
                    </MenuLink>
                  </Link>

                  <MenuLink href={Urls.blog} target="_blank">
                    Blog
                  </MenuLink>

                  <Divider />

                  {isLoggedIn && (
                    <>
                      <Link href={Urls.yourDesigns} passHref>
                        <MenuLink active={pathname === Urls.yourDesigns}>
                          Your designs
                        </MenuLink>
                      </Link>

                      <Link href={Urls.account} passHref>
                        <MenuLink active={pathname === Urls.account}>
                          Account
                        </MenuLink>
                      </Link>

                      <Divider />

                      <MenuLink
                        as="button"
                        onClick={() => {
                          authStore.logout()
                          toasts.showInfo({ title: 'You have logged out' })
                          router.replace(Urls.login)
                        }}
                      >
                        Log out
                      </MenuLink>
                    </>
                  )}

                  {!isLoggedIn && (
                    <>
                      <Link href={Urls.login} passHref>
                        <MenuLink active={pathname === Urls.login}>
                          Log in
                        </MenuLink>
                      </Link>

                      <Link href={Urls.signup} passHref>
                        <MenuLink
                          active={pathname === Urls.signup}
                          variant="accent"
                        >
                          Sign up <ChevronRightIcon />
                        </MenuLink>
                      </Link>
                    </>
                  )}
                </Box>

                <IconButton
                  aria-label="Close menu"
                  onClick={() => setIsShowing(false)}
                  variant="ghost"
                  css={css`
                    position: absolute;
                    top: 8px;
                    right: 16px;
                    padding: 10px;
                    font-size: 24px;
                  `}
                >
                  <CloseIcon color="gray.800" />
                </IconButton>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </>
    )

    return (
      <>
        {isShowing && <LockBodyScroll />}
        {MobileHeader}
      </>
    )
  }
)

const MenuLink = (
  props: LinkProps & { active: boolean; variant?: 'accent' }
) => (
  <MenuLinkStyled
    {...props}
    bg={props.active ? 'gray.200' : 'white'}
    color={props.variant === 'accent' ? 'accent.500' : undefined}
    _hover={{ bg: 'gray.100' }}
  />
)

const MenuLinkStyled = styled(ChakraLink)<{ theme: Theme }>`
  font-weight: 600;
  padding: 10px 20px;
  text-transform: uppercase;
  outline: none !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;

  &,
  &:focus,
  &:hover {
    text-decoration: none;
  }
`

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
  padding-left: 20px;
  font-weight: 600;
`

const mobileMenuBreakpointPx = 900

export const MobileHeaderWrapper = styled(Box)<{ theme: any }>`
  @media screen and (min-width: ${mobileMenuBreakpointPx + 1}px) {
    display: none;
  }
  background: ${(p) => p.theme.colors.header.bg};
`

export const ContentContainer = styled(Box)<{
  theme: any
  fullWidth?: boolean
}>`
  display: flex;
  align-items: center;
  width: 100%;
  ${(p) => !p.fullWidth && 'max-width: 1280px;'}
  margin: 0 auto;
  padding: 10px 0;
  height: 50px;
`

const BurgerMenuButton = styled.button<{
  active?: boolean
}>`
  color: white;
  display: inline-flex;
  align-items: center;
  height: 50px;
  padding: 0 15px;
  position: relative;
  box-sizing: content-box;
  text-transform: uppercase;
  font-weight: 600 !important;
  cursor: pointer;
  box-shadow: none !important;
  outline: none !important;

  background: transparent !important;
  ${(p) => p.active && `background: #0002 !important;`}

  color: #fefeff;

  &:hover,
  &:focus {
    text-decoration: none;
    background: #fff2 !important;

    background: ${(p) => (p.active ? '#0002' : '#00000014')} !important;
  }

  margin-left: auto;
  padding-left: 30px;
`
