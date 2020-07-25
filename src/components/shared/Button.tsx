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

      /* &,
      &:focus,
      &:active {
        ${
          (!props.variant || props.variant === 'solid') &&
          'box-shadow: 0 0 8px 0 #00000033;'
        }


      ${
        props.variant === 'outline' &&
        `
        box-shadow: none !important;
        svg {
          color: #777;
        }
      `
      }

      ${props.variant === 'ghost' && `box-shadow: none !important;`}
      ${props.variant === 'ghost' && !props.color && ` color: #485660;`} */
    `}
  />
))
