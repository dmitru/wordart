import styled from '@emotion/styled'
import * as ss from 'styled-system'
import { Theme } from 'styles/theme'
import { textColor } from 'styles/system'
import { $Keys } from 'utility-types'
import shouldForwardProp from '@styled-system/should-forward-prop'

export type BoxProps = ss.TypographyProps<Theme> &
  ss.SpaceProps<Theme> &
  ss.BorderProps<Theme> &
  ss.LayoutProps<Theme> &
  ss.BackgroundColorProps<Theme> &
  ss.BorderColorProps<Theme> &
  ss.FlexboxProps<Theme> & {
    textColor?: $Keys<Theme['colors']>
  }

export const Box = styled('div', { shouldForwardProp })<BoxProps>(
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
