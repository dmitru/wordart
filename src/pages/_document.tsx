import { config } from 'config'
import Document, { Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  getGoogleAnalyticsTags() {
    return {
      __html: `
      window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};
      ga.l=+new Date;
      ga('create', '${config.ga.trackingCode}', 'auto');
      ga('send', 'pageview');
      `,
    }
  }

  render() {
    return (
      <html>
        <Head>
          <link rel="shortcut icon" href="/favicon.svg" />
          <script src="https://cdn.paddle.com/paddle/paddle.js" />
          <link rel="manifest" href="/manifest.webmanifest" />
        </Head>
        <body>
          <div id="emotion" />

          <Main />
          <NextScript />

          {config.ga.enabled && (
            <>
              <script dangerouslySetInnerHTML={this.getGoogleAnalyticsTags()} />
              <script
                async
                src="https://www.google-analytics.com/analytics.js"
              />
              {/* We call the function above to inject the contents of the script tag */}
            </>
          )}
        </body>
      </html>
    )
  }
}
