import React from 'react'
import styled from '@emotion/styled'
import Link from 'next/link'

export type HeaderProps = {}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <HeaderWrapper>
      <Link href="/" passHref>
        <HeaderLink>Home</HeaderLink>
      </Link>
      <Link href="/about" passHref>
        <HeaderLink>About</HeaderLink>
      </Link>
    </HeaderWrapper>
  )
}

export const HeaderWrapper = styled.div``

export const HeaderLink = styled.a`
  padding: 10px;
  color: ${({ theme }) => theme.colors.primary};
`
