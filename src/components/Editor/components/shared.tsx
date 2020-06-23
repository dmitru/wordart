import styled from '@emotion/styled'
import { Text } from '@chakra-ui/core'

export const SectionLabel = styled(Text)<{ theme: any }>(`
  padding: 8px 0;
  margin: 0 -20px;
  margin-bottom: 20px;
  background: hsla(230, 81%, 97%, 1);
  color: #595858;
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: bold;
  letter-spacing: 2px;
  padding-left: 21px;
`)
