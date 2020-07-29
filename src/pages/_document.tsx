import { config } from 'config'
import Document, { Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  getGoogleAnalyticsTags() {
    return {
      __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
      
        gtag('config', '${config.ga.trackingCode}');
      `,
    }
  }

  render() {
    return (
      <html>
        <Head>
          <link rel="shortcut icon" href="/favicon.svg" />
          <script src="https://cdn.paddle.com/paddle/paddle.js"></script>
        </Head>
        <body>
          <Main />
          <NextScript />

          {config.ga.enabled && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${config.ga.trackingCode}`}
              />
              {/* We call the function above to inject the contents of the script tag */}
              <script dangerouslySetInnerHTML={this.getGoogleAnalyticsTags()} />
            </>
          )}
        </body>
      </html>
    )
  }
}
