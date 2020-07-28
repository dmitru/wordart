import { CSSReset, ChakraProvider } from '@chakra-ui/core'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/core'
import App from 'next/app'
import React from 'react'
import { globalStyles } from 'styles/globalStyles'
import 'react-awesome-slider/dist/styles.css'
import 'services/error-tracker'

import theme from 'chakra'

const emotionCache = createCache({
  key: 'css',
})

export default class MyApp extends App {
  render() {
    // @ts-ignore
    const { Component, pageProps, err } = this.props
    return (
      <CacheProvider value={emotionCache}>
        <ChakraProvider theme={theme}>
          <CSSReset />
          {globalStyles}
          <Component {...pageProps} err={err} />
        </ChakraProvider>
      </CacheProvider>
    )
  }
}
