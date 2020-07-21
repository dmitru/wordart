import React from 'react'
import { Button, ButtonProps } from 'components/shared/Button'
import { CloseIcon } from '@chakra-ui/icons'
import css from '@emotion/css'

export const DeleteButton = React.forwardRef<Partial<ButtonProps>, any>(
  ({ children, ...props }, ref) => (
    <Button
      size="xs"
      variant="ghost"
      color="gray.500"
      {...props}
      ref={ref}
      css={css`
        box-shadow: none !important;
        border: none;
      `}
    >
      <CloseIcon />
      {children}
    </Button>
  )
)
