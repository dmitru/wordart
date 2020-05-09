import styled from '@emotion/styled'
import { Box } from 'components/shared/Box'

export const Label = styled(Box)`
  text-transform: uppercase;
  font-size: ${(p) => p.theme.fontSizes[3]}px;
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.dark2};
`
