import { css } from '@emotion/react'
import * as ss from 'styled-system'
import { textColor } from 'styles/system'
import { BaseBtn } from 'components/shared/BaseBtn'
import styled from '@emotion/styled'
import { darken, grayscale } from 'polished'
import { BoxProps } from 'components/shared/Box'

export type ButtonProps = StyledButtonProps

export const Button: React.FC<ButtonProps> = (props) => {
  return <StyledButton {...props} />
}

type StyledButtonProps = {
  primary?: boolean
  accent?: boolean
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

      &[disabled] {
        cursor: default;
      }
    `
  } else {
    // Filled
    return css`
      color: ${color};
      background: ${bgColor};
      border: 2px solid ${bgColor};

      &:hover {
        background: ${darken(0.05, bgColor)};
      }

      &:active {
        background: ${darken(0.1, bgColor)};
        transform: translateY(-1px);
      }

      &[disabled] {
        cursor: default;
        border: 2px solid ${grayscale(bgColor)};
        background: ${grayscale(bgColor)};
      }
    `
  }
}

const StyledButton = styled(BaseBtn)<StyledButtonProps>(
  `
    border: 2px solid #ddd;
    white-space: nowrap;
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
    if (p.accent) {
      return getButtonStyles({
        bgColor: outline ? p.theme.colors.light : p.theme.colors.accent,
        color: outline ? p.theme.colors.accent : p.theme.colors.textLight,
        borderColor: p.theme.colors.accent,
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
  fontWeight: 'semibold',
  borderRadius: 'default',
  display: 'flex-inline',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}
