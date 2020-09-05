import { ChakraProvider, CSSReset } from '@chakra-ui/core'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/core'
import theme from 'chakra'
import App from 'next/app'
import Router from 'next/router'
import React from 'react'
import 'react-awesome-slider/dist/styles.css'
import { analytics } from 'services/analytics'
import 'services/error-tracker'
import { globalStyles } from 'styles/globalStyles'
import { DefaultSeo } from 'next-seo'

const emotionCache = createCache({
  key: 'css',
  container:
    typeof document !== 'undefined'
      ? document.getElementById('emotion') || undefined
      : undefined,
})

export default class MyApp extends App {
  componentDidMount() {
    Router.events.on('routeChangeComplete', () => {
      analytics.trackPageView()
    })
  }

  render() {
    // @ts-ignore
    const { Component, pageProps, err } = this.props
    return (
      <CacheProvider value={emotionCache}>
        <ChakraProvider theme={theme}>
          <DefaultSeo
            title="Instant word designs generator | Wordcloudy"
            description="Generate personalized word art and download it in highest quality. Create your own designs in no time for unique gifts, prints, posters and more!"
          />
          <CSSReset />
          {globalStyles}
          <Component {...pageProps} err={err} />
        </ChakraProvider>
      </CacheProvider>
    )
  }
}
