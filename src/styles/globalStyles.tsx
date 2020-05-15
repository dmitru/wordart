import { css, Global } from '@emotion/react'
import Typography from 'typography'
// @ts-ignore
import typographyTheme from 'typography-theme-github'
const typography = new Typography(typographyTheme)

export const globalStyles = (
  <Global
    styles={css`
      * {
        box-sizing: border-box;
      }
      html {
        overflow: auto !important;
        overflow-y: auto !important;
      }

      #__next {
        height: 100vh;
      }

      ${typography.toString()}
    `}
  />
)
