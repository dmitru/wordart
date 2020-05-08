import App from 'next/app'
import React from 'react'
import { theme } from 'styles/theme'
import { ThemeProvider, CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import 'normalize.css/normalize.css'

import { globalStyles } from 'styles/globalStyles'

const emotionCache = createCache({
  key: 'css',
})

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return (
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={theme}>
          {globalStyles}
          <Component {...pageProps} />
        </ThemeProvider>
      </CacheProvider>
    )
  }
}
