import styled from '@emotion/styled'
import { Text } from '@chakra-ui/core'

export const SectionLabel = styled(Text)<{ theme: any }>(`
  padding: 8px 0;
  margin: 0 -20px;
  margin-bottom: 20px;
  background: hsl(220, 36%, 95%);
  color: hsla(210, 11%, 35%, 1);
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: bold;
  letter-spacing: 2px;
  padding-left: 21px;
`)
