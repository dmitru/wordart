import App from 'next/app'
import React from 'react'
import { ThemeProvider } from 'styled-components'
import { theme } from 'styles/theme'

/**
 * Enables styled-components SSR:
 * https://github.com/zeit/next.js/blob/canary/examples/with-styled-components/pages/_document.js
 */

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return (
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    )
  }
}
