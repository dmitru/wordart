import { css } from '@emotion/react'
import * as ss from 'styled-system'
import { BaseBtn } from 'components/shared/BaseBtn'
import styled from '@emotion/styled'
import { darken } from 'polished'
import { textColor } from 'styles/system'
import { BoxProps } from 'components/shared/Box'

export type ButtonProps = StyledButtonProps

export const Button: React.FC<ButtonProps> = (props) => {
  return <StyledButton {...props} />
}

type StyledButtonProps = {
  primary?: boolean
  secondary?: boolean
  outline?: boolean
  link?: boolean
} & BoxProps &
  JSX.IntrinsicElements['button']

const getButtonStyles = (params: {
  borderColor: string
  color: string
  bgColor: string
  outline: boolean
}) => {
  const { borderColor, color, bgColor, outline } = params

  if (outline) {
    return css`
      color: ${color};
      border: 2px solid ${borderColor};

      &:hover {
        border-color: ${darken(0.05, borderColor)};
        background: ${borderColor};
        color: ${bgColor};
      }

      &:active {
        transform: translateY(-1px);
      }
    `
  } else {
    // Filled
    return css`
      color: ${color};
      background: ${bgColor};

      &:hover {
        background: ${darken(0.05, bgColor)};
      }

      &:active {
        background: ${darken(0.1, bgColor)};
        transform: translateY(-1px);
      }
    `
  }
}

const StyledButton = styled(BaseBtn)<StyledButtonProps>(
  `
    font-weight: 500;
    border-radius: 8px;
  `,
  (p) => {
    const { outline = false } = p
    if (p.secondary) {
      return getButtonStyles({
        bgColor: outline ? p.theme.colors.light : p.theme.colors.secondary,
        color: outline ? p.theme.colors.secondary : p.theme.colors.textLight,
        borderColor: p.theme.colors.secondary,
        outline,
      })
    }
    if (p.primary) {
      return getButtonStyles({
        bgColor: outline ? p.theme.colors.light : p.theme.colors.primary,
        color: outline ? p.theme.colors.primary : p.theme.colors.textLight,
        borderColor: p.theme.colors.primary,
        outline,
      })
    }
  },

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

StyledButton.defaultProps = {
  px: 3,
  py: 2,
  fontWeight: 2,
  borderRadius: 1,
}
