import { Button as ChakraButton } from '@chakra-ui/core'
import React from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/core'

export type ButtonProps = {}

export const Button = React.forwardRef<ButtonProps, any>((props, ref) => (
  <ChakraButton
    {...props}
    ref={ref}
    css={css`
      cursor: pointer;

      &,
      &:focus,
      &:active {
        box-shadow: 0 0 8px 0 #00000015 !important;
      }
    `}
  />
))
