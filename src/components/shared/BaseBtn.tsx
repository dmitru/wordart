import styled from '@emotion/styled'
import { Box, BoxProps } from 'components/shared/Box'

export const BaseBtn = styled(Box.withComponent('button'))<BoxProps>`
  display: inline-flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
  outline: none;
  -webkit-appearance: none;
  background: none;
  cursor: pointer;
`
