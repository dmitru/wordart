import { CSSReset, ThemeProvider } from '@chakra-ui/core'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/core'
import App from 'next/app'
import 'normalize.css/normalize.css'
import React from 'react'
import { globalStyles } from 'styles/globalStyles'
import { theme } from 'styles/theme'

const emotionCache = createCache({
  key: 'css',
})

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return (
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={theme}>
          <CSSReset />
          {globalStyles}
          <Component {...pageProps} />
        </ThemeProvider>
      </CacheProvider>
    )
  }
}
