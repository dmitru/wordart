import { Button, ButtonProps } from 'components/shared/Button'
import { DotsThreeHorizontal } from '@styled-icons/entypo/DotsThreeHorizontal'
import css from '@emotion/css'
import React from 'react'

export const MenuDotsButton = React.forwardRef<
  Omit<ButtonProps, 'children'> & { noShadows?: boolean },
  any
>(({ noShadows = true, ...props }, ref) => (
  <Button
    variant="ghost"
    aria-label="Menu"
    {...props}
    ref={ref}
    px="2"
    css={css`
      ${noShadows &&
      `
      box-shadow: none !important;
      border: none;
    `}
    `}
  >
    <DotsThreeHorizontal size={18} />
  </Button>
))
