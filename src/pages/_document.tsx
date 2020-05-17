import Document, {
  DocumentContext,
  Head,
  Main,
  NextScript,
} from 'next/document'
import { extractCritical } from 'emotion-server'
import 'lib/wordart/console-extensions'

export default class MyDocument extends Document {
  // static async getInitialProps(ctx: DocumentContext) {
  //   const page = await ctx.renderPage()
  //   const styles = extractCritical(page.html)
  //   return { ...page, ...styles }
  // }

  render() {
    return (
      <html>
        <Head>
          <style
          // @ts-ignore
          // data-emotion-css={this.props.ids.join(' ')}
          // @ts-ignore
          // dangerouslySetInnerHTML={{ __html: this.props.css }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
