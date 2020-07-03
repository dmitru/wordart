import { Input as CInput, InputProps as CInputProps } from '@chakra-ui/core'
import React from 'react'

export const Input = React.forwardRef<CInputProps, any>(({ ...props }, ref) => (
  <CInput {...props} ref={ref} />
))
