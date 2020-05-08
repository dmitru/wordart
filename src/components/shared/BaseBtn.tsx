import styled from '@emotion/styled'
import { Box, BoxProps } from 'components/shared/Box'
import * as ss from 'styled-system'
import { textColor } from 'styles/system'

export const BaseBtn = styled(Box.withComponent('button'))<BoxProps>(
  `
  display: inline-flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
  outline: none;
  -webkit-appearance: none;
  background: none;
  cursor: pointer;
`,
  ss.compose(
    ss.flexbox,
    ss.typography,
    ss.space,
    ss.layout,
    ss.color,
    ss.border,
    textColor
  )
)
