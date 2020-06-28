import { Input as CInput, InputProps as CInputProps } from '@chakra-ui/core'
import styled from '@emotion/styled'
import css from '@emotion/css'
import React from 'react'

export const Input = React.forwardRef<CInputProps, any>(({ ...props }, ref) => (
  <CInput
    _placeholder={{
      color: '#333',
    }}
    {...props}
    ref={ref}
  />
))
