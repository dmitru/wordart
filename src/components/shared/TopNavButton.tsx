import styled from '@emotion/styled'
import { Button } from 'components/shared/Button'

export const TopNavButton = styled(Button)<{ isAccented?: boolean }>`
  color: white;

  color: #fefeff;
  background: #ffffff45;
  margin-right: 10px;

  ${(p) =>
    p.isAccented &&
    `
  background: #fff;
  color: #333;
`}

  &:hover {
    background-color: #fff2;

    ${(p) =>
      p.isAccented &&
      `
  background: #fffb;
`}
  }
`
