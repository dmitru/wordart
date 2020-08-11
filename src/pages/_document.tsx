import { config } from 'config'
import Document, { Head, Main, NextScript } from 'next/document'
import { extractCritical } from 'emotion-server'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const initialProps = await Document.getInitialProps(ctx)
    const styles = extractCritical(initialProps.html)
    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style
            data-emotion-css={styles.ids.join(' ')}
            dangerouslySetInnerHTML={{ __html: styles.css }}
          />
        </>
      ),
    }
  }

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
          <script src="https://cdn.paddle.com/paddle/paddle.js" />
          <link rel="manifest" href="/manifest.webmanifest" />
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
