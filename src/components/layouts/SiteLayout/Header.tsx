import React from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'
import { Box } from 'components/shared/Box'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { Button } from 'components/shared/Button'
import { Urls } from 'urls'

export type HeaderProps = {}

export const Header: React.FC<HeaderProps> = observer(() => {
  const { authStore } = useStore()

  const isLoggedIn = authStore.isLoggedIn === true
  const isNotLoggedIn = authStore.isLoggedIn === false

  return (
    <HeaderWrapper>
      <ContentContainer>
        <Box>
          <Link href="/" passHref>
            <a>HOME</a>
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
              <Link href={Urls.editor._next} as={Urls.editor.create} passHref>
                <Button accent>Create</Button>
              </Link>
              <Link href={Urls.dashboard} passHref>
                <Button>My Designs</Button>
              </Link>
              <Link href={Urls.profile} passHref>
                <Button>Profile</Button>
              </Link>
            </>
          )}
          {isNotLoggedIn && (
            <>
              <Link href={Urls.login} passHref>
                <Button accent>Sign up</Button>
              </Link>
              <Link href={Urls.login} passHref>
                <Button accent outline>
                  Log in
                </Button>
              </Link>
            </>
          )}
        </Box>
      </ContentContainer>
    </HeaderWrapper>
  )
})

export const HeaderWrapper = styled(Box)`
  background: ${(p) => p.theme.colors.light1};
`

export const ContentContainer = styled(Box)`
  display: flex;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px 20px;
  height: 60px;
`

export const HeaderLink = styled.a`
  padding: 10px;
  color: ${({ theme }) => theme.colors.primary};
`
