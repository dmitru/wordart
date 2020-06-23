import React from 'react'
import { Button, ButtonProps } from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'

export type ColorSwatchButtonProps = Omit<
  ButtonProps,
  'children' | 'color' | 'opacity'
> & {
  kind: 'color' | 'colors' | 'spectrum' | 'gradient'
  opacity?: number
  color?: string
  colors?: string[]
}

export const ColorSwatchButton = React.forwardRef<any, ColorSwatchButtonProps>(
  ({ kind, opacity = 1, color = 'red', colors = ['red'], ...props }, ref) => {
    if (kind === 'color') {
      return (
        <ColorSwatchButtonStyled {...props} ref={ref}>
          <ColorSwatchButtonStyledTransparentBg />
          <ColorSwatchButtonStyledBg
            css={css`
              background: ${color};
              opacity: ${opacity};
            `}
          />
        </ColorSwatchButtonStyled>
      )
    }
    if (kind === 'spectrum') {
      return (
        <ColorSwatchButtonStyled
          {...props}
          ref={ref}
          css={css`
            &,
            &:hover {
              background-image: linear-gradient(
                45deg,
                red,
                yellow,
                lime,
                aqua,
                blue,
                magenta,
                red
              );
            }
          `}
        >
          {null}
        </ColorSwatchButtonStyled>
      )
    }

    if (kind === 'colors') {
      const n = colors.length
      const gradStops = colors
        .map((c, i) => `${c} ${(i / n) * 100}%, ${c} ${((i + 1) / n) * 100}%`)
        .join(',')

      return (
        <ColorSwatchButtonStyled
          {...props}
          ref={ref}
          css={css`
            &,
            &:hover {
              background-image: linear-gradient(90deg, ${gradStops});
            }
          `}
        >
          {null}
        </ColorSwatchButtonStyled>
      )
    }

    if (kind === 'gradient') {
      const n = colors.length - 1
      const gradStops = colors.map((c, i) => `${c} ${(i / n) * 100}%`).join(',')

      return (
        <ColorSwatchButtonStyled
          {...props}
          ref={ref}
          css={css`
            &,
            &:hover {
              background-image: linear-gradient(90deg, ${gradStops});
            }
          `}
        >
          {null}
        </ColorSwatchButtonStyled>
      )
    }

    return null
  }
)

ColorSwatchButton.defaultProps = {
  mb: '3',
  mr: '2',
  height: '30px',
  borderRadius: 'none',
}

const ColorSwatchButtonStyled = styled(Button)<{ theme: any }>`
  border: 1px solid ${(p) => p.theme.colors.dark4};
  cursor: pointer;
  outline: none;
  padding: 0;
  margin: 0;
  width: 60px;
  display: inline-block;
  transition: 0.15s background;
  position: relative;
  background: transparent;
`

const ColorSwatchButtonStyledBg = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
`

const ColorSwatchButtonStyledTransparentBg = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-image: url(/images/editor/transparent-bg.svg);
  background-repeat: repeat;
  background-size: 15px;
`
