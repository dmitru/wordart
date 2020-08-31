import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuTransition,
  Portal,
} from '@chakra-ui/core'
import { AddIcon, ChevronDownIcon, StarIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { Button } from 'components/shared/Button'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'
import { TopNavButton } from 'components/shared/TopNavButton'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import { observer } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import Link from 'next/link'
import React from 'react'
import Headroom from 'react-headroom'
import { FaRegUserCircle, FaSignOutAlt } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'
import { BsHeartFill } from 'react-icons/bs'
import { openUrlInNewTab } from 'utils/browser'

export type DesktopHeaderProps = {
  hideCreate?: boolean
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = observer(
  ({ hideCreate = false }) => {
    const { authStore } = useStore()
    const toasts = useToasts()
    const router = useRouter()
    const { pathname } = router

    const showUpgrade = pathname === Urls.yourDesigns

    const upgradeModal = useUpgradeModal()

    const isLoggedIn = authStore.isLoggedIn === true
    const isNotLoggedIn = authStore.isLoggedIn === false
    const isLoggedInAndNotVerified =
      authStore.isLoggedIn === true && !authStore.isEmailConfirmed
    const isLoggedInWithoutPaidPlan =
      isLoggedIn &&
      !authStore.profile?.limits.isActiveDownloadsPack &&
      !authStore.profile?.limits.isActiveUnlimitedPlan

    const desktopHeader = (
      <Headroom style={{ zIndex: 100 }}>
        <DesktopHeaderWrapper>
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
                <TopNavLink active={pathname === Urls.faq}>FAQ</TopNavLink>
              </Link>

              <Link href={Urls.contact} passHref>
                <TopNavLink active={pathname === Urls.contact}>
                  Contact
                </TopNavLink>
              </Link>

              <TopNavLink target="_blank" href={Urls.blog}>
                Blog
              </TopNavLink>

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
              {!hideCreate &&
                pathname !== Urls.yourDesigns &&
                !isLoggedInAndNotVerified && (
                  <Link
                    href={Urls.editor._next}
                    as={Urls.editor.create}
                    passHref
                  >
                    <Button colorScheme="accent" leftIcon={<AddIcon />} mr="3">
                      Create
                    </Button>
                  </Link>
                )}

              {showUpgrade && isLoggedInWithoutPaidPlan && (
                <Button
                  onClick={() => upgradeModal.show('generic')}
                  colorScheme="accent"
                  leftIcon={<StarIcon />}
                  mr="3"
                >
                  Upgrade
                </Button>
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
                  <Menu isLazy placement="bottom-end">
                    <MenuButton
                      as={TopNavMenuButton}
                      py="2"
                      px="3"
                      leftIcon={<FaRegUserCircle />}
                      rightIcon={<ChevronDownIcon />}
                    >
                      <span
                        css={css`
                          @media screen and (max-width: 980px) {
                            display: none;
                          }
                        `}
                      >
                        Account
                      </span>
                    </MenuButton>

                    <Portal>
                      <MenuTransition>
                        {(styles) => (
                          <MenuList
                            // @ts-ignore
                            css={styles}
                          >
                            {isLoggedInWithoutPaidPlan && (
                              <MenuItemWithIcon
                                icon={<StarIcon />}
                                title="Purchase a plan"
                                onClick={() => upgradeModal.show('generic')}
                              />
                            )}
                            <MenuItemWithIcon
                              icon={<BsHeartFill />}
                              onClick={() => {
                                openUrlInNewTab(
                                  'https://forms.gle/P5rXX6pvKVBbwVFX7'
                                )
                              }}
                              title="Give us feedback"
                            />
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
                                toasts.showInfo({
                                  title: 'You have logged out',
                                })
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
        </DesktopHeaderWrapper>
      </Headroom>
    )

    return <>{desktopHeader}</>
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

const mobileMenuBreakpointPx = 900

export const DesktopHeaderWrapper = styled(Box)<{ theme: any }>`
  @media screen and (max-width: ${mobileMenuBreakpointPx}px) {
    display: none;
  }
  background: ${(p) => p.theme.colors.header.bg};
`

export const ContentContainer = styled(Box)<{
  theme: any
}>`
  display: flex;
  width: 100%;
  max-width: 1280px;
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
  font-weight: 400 !important;
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

const TopNavMenuButton = styled(Button)<{
  active?: boolean
}>`
  ${topNavLink}
`
