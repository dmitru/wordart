import NextErrorComponent from 'next/error'
// @ts-ignore
import * as Sentry from '@sentry/node'

// @ts-ignore
const MyError = async ({ statusCode, hasGetInitialPropsRun, err }) => {
  if (!hasGetInitialPropsRun && err) {
    // getInitialProps is not called in case of
    // https://github.com/vercel/next.js/issues/8592. As a workaround, we pass
    // err via _app.js so it can be captured
    Sentry.captureException(err)
    // flush is needed after calling captureException to send server side errors to Sentry, otherwise the serverless function will exit before it's sent
    await Sentry.flush(2000)
  }

  return <NextErrorComponent statusCode={statusCode} />
}

// @ts-ignore
MyError.getInitialProps = async ({ res, err, asPath }) => {
  // @ts-ignore
  const errorInitialProps = await NextErrorComponent.getInitialProps({
    res,
    err,
  })

  // Workaround for https://github.com/vercel/next.js/issues/8592, mark when
  // getInitialProps has run
  // @ts-ignore
  errorInitialProps.hasGetInitialPropsRun = true

  // Running on the server, the response object (`res`) is available.
  //
  // Next.js will pass an err on the server if a page's data fetching methods
  // threw or returned a Promise that rejected
  //
  // Running on the client (browser), Next.js will provide an err if:
  //
  //  - a page's `getInitialProps` threw or returned a Promise that rejected
  //  - an exception was thrown somewhere in the React lifecycle (render,
  //    componentDidMount, etc) that was caught by Next.js's React Error
  //    Boundary. Read more about what types of exceptions are caught by Error
  //    Boundaries: https://reactjs.org/docs/error-boundaries.html

  if (res?.statusCode === 404) {
    // Opinionated: do not record an exception in Sentry for 404
    return { statusCode: 404 }
  }
  if (err) {
    Sentry.captureException(err)
    await Sentry.flush(2000)
    return errorInitialProps
  }

  // If this point is reached, getInitialProps was called without any
  // information about what the error might be. This is unexpected and may
  // indicate a bug introduced in Next.js, so record it in Sentry
  Sentry.captureException(
    new Error(`_error.js getInitialProps missing data at path: ${asPath}`)
  )
  await Sentry.flush(2000)

  return errorInitialProps
}

export default MyError
