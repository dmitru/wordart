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
            title="Wordcloudy – Create unique wordcloud designs"
            description="Online word art generator that is fun and easy-to-use. Create stunning, unique wordcloud designs and export it in print-ready professional quality!"
          />
          <CSSReset />
          {globalStyles}
          <Component {...pageProps} err={err} />
        </ChakraProvider>
      </CacheProvider>
    )
  }
}
