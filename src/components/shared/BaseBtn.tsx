import styled from '@emotion/styled'
import { Box } from '@chakra-ui/core'

export const BaseBtn = styled(Box)(
  {
    as: 'button',
  },
  `
  display: inline-flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
  outline: none;
  -webkit-appearance: none;
  background: none;
  cursor: pointer;
`
)
