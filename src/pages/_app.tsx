import { CSSReset, ChakraProvider } from '@chakra-ui/core'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/core'
import App from 'next/app'
import React from 'react'
import { globalStyles } from 'styles/globalStyles'

import theme from 'chakra'

const emotionCache = createCache({
  key: 'css',
})

export default class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return (
      <CacheProvider value={emotionCache}>
        <ChakraProvider theme={theme}>
          <CSSReset />
          {globalStyles}
          <Component {...pageProps} />
        </ChakraProvider>
      </CacheProvider>
    )
  }
}
