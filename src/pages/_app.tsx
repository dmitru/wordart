import App from 'next/app'
import React from 'react'
import { ThemeProvider, createGlobalStyle } from 'styled-components'
import { theme } from 'styles/theme'
import styled from 'styled-components'
import { StyledIconBase } from '@styled-icons/styled-icon'
import 'normalize.css/normalize.css'

/**
 * Enables styled-components SSR:
 * https://github.com/zeit/next.js/blob/canary/examples/with-styled-components/pages/_document.js
 */

const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
`

export const IconStyleWrapper = styled.div`
  ${StyledIconBase} {
    color: red;
    width: 20px;
    height: 20px;
  }
`

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <Component {...pageProps} />
      </ThemeProvider>
    )
  }
}
