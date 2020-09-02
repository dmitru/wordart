import packageJson from '../package.json'

export const config = {
  thumbnailSizePx: 380,

  baseUrl: process.env.NEXT_PUBLIC_WEB_BASE_URL!,
  isDevEnv: process.env.NODE_ENV === 'development',

  release: {
    version: packageJson.version,
    hash: process.env.NEXT_PUBLIC_COMMIT_SHA || 'missing-app-hash',
  },

  noIndex: process.env.NEXT_PUBLIC_DISABLE_NO_INDEX !== 'true',

  supportEmail: 'support@wordcloudy.com',
  contactEmail: 'contact@wordcloudy.com',

  sentry: {
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: 'dev',
  },

  ga: {
    enabled: !!process.env.NEXT_PUBLIC_GA_TRACKING_CODE,
    trackingCode: process.env.NEXT_PUBLIC_GA_TRACKING_CODE,
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

if (typeof window !== 'undefined') {
  // @ts-ignore
  window['config'] = config
}
