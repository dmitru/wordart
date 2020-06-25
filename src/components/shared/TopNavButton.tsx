import styled from '@emotion/styled'
import { Button } from 'components/shared/Button'

export const TopNavButton = styled(Button)<{
  variant?: 'accent' | 'secondary' | 'primary'
}>`
  color: white;

  color: #fefeff;
  background: #ffffff45;
  margin-right: 10px;

  ${(p) =>
    p.variant === 'accent' &&
    `
      background: #fff;
      color: #333;
    `}

  ${(p) =>
    p.variant === 'secondary' &&
    `
        background: transparent;
        color: #fff;
        box-shadow: none !important;
        border: none;
      `}

  &:hover {
    background: #fff2;

    ${(p) =>
      p.variant === 'accent' &&
      `
        background: #fffb;
    `}
    ${(p) =>
      p.variant === 'secondary' &&
      `
        background: #00000014;
    `}
  }
`
