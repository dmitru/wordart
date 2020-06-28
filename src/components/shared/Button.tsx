import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import React from 'react'

export type ButtonProps = ChakraButtonProps

export const Button = React.forwardRef<ButtonProps, any>((props, ref) => (
  <ChakraButton
    {...props}
    ref={ref}
    css={css`
      cursor: pointer;

      &,
      &:focus,
      &:active {
        box-shadow: 0 0 8px 0 #00000013;

        ${(!props.variant || props.variant === 'solid') &&
        props.variantColor === 'accent' &&
        'box-shadow: 0 0 8px 0 #00000023;'}
      }

      ${props.variant === 'ghost' &&
      `box-shadow: none !important; color: #485660;`}
    `}
  />
))
