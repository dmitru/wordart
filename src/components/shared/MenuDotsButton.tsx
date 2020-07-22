import { ButtonProps } from 'components/shared/Button'
import { DotsThreeHorizontal } from '@styled-icons/entypo/DotsThreeHorizontal'
import { Button } from '@chakra-ui/core'
import css from '@emotion/css'
import React from 'react'

export const MenuDotsButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'children'> & { noShadows?: boolean }
>(({ noShadows = true, size = 'md', ml = '0', mr = '0', ...props }, ref) => (
  <Button
    aria-label="Menu"
    size={size}
    ref={ref}
    px="2"
    ml={ml}
    mr={mr}
    css={css`
      ${noShadows &&
      `
      box-shadow: none !important;
      border: none;
      `}
    `}
    variant="ghost"
    {...props}
  >
    <DotsThreeHorizontal size={18} />
  </Button>
))
