import packageJson from '../package.json'

export const config = {
  isDevEnv: process.env.NODE_ENV === 'development',

  release: {
    version: packageJson.version,
    hash: process.env.REACT_APP_COMMIT_SHA || 'missing-app-hash',
  },

  noIndex: process.env.REACT_APP_DISABLE_NO_INDEX !== 'true',

  supportEmail: 'support@wordcloudy.com',
  contactEmail: 'contact@wordcloudy.com',

  sentry: {
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: 'dev',
  },

  paddle: {
    vendorId: 597590,
  },
  recaptcha: {
    siteKey: '6LcSb7AZAAAAAFEeMHPNjMSzSHvQaoMsr87kb1C8',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL!,
  },
}
