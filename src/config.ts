export const config = {
  supportEmail: 'support@wordcloudy.com',
  contactEmail: 'contact@wordcloudy.com',

  airbrake: {
    host: 'http://blog.wordcloudy.com:8080',
    projectId: 1,
    projectKey: 'd906bdbe58241819ddac9b5e99738180',
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
