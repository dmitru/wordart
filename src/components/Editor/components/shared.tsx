import styled from '@emotion/styled'
import { Text } from '@chakra-ui/core'

export const SectionLabel = styled(Text)<{ theme: any }>(
  `
  // text-transform: uppercase;
  font-weight: 500 !important;
  font-size: 1.1em;
  margin: 0;
  margin-bottom: 8px;
  color: #777;
`
)
