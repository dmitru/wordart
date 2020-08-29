import { css, Global } from '@emotion/core'
import Typography from 'typography'
// @ts-ignore
import typographyTheme from 'typography-theme-github'
const typography = new Typography({
  ...typographyTheme,
  bodyFontFamily: ['Roboto'],
  headerWeight: 500,
  headerFontFamily: ['Nunito', 'sans-serif'],
})

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

      .pulsate-fwd {
        animation: pulsate-fwd 0.5s ease-in-out both;
      }

      @keyframes pulsate-fwd {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }

      .pulsate-fwd-subtle {
        animation: pulsate-fwd-subtle 0.4s ease-in-out both;
      }

      @keyframes pulsate-fwd-subtle {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
        100% {
          transform: scale(1);
        }
      }

      ${typography.toString()}

      @import url('https://fonts.googleapis.com/css2?family=Maven+Pro:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;600;700&display=swap');

      h1 {
        color: #3c526f;
        border-bottom: none;
        font-size: 36px;
        font-weight: 800;
        font-family: 'Nunito', sans-serif;
      }
    `}
  />
)
