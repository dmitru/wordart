import styled from '@emotion/styled'
import { Box } from '@chakra-ui/core'

export const Label = styled(Box)<{ theme: any }>`
  font-size: ${(p) => p.theme.fontSizes[3]}px;
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.dark2};
`
