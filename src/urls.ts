export const Urls = {
  blog: 'https://blog.wordcloudy.com',

  landing: '/',
  login: '/login',
  signup: '/signup',
  signupCompleted: '/signup/success',
  verifyEmail: '/signup/verify-email',
  emailVerification: '/auth/verify-email',

  resetPasswordRequest: '/reset-password-request',
  resetPasswordForm: '/reset-password',

  loginRedirect: '/home',

  privacyPolicy: '/legal/privacy',
  termsOfUse: '/legal/terms',

  account: '/account',
  yourDesigns: '/home',
  faq: '/faq',
  pricing: '/pricing',
  contact: '/contact',

  editor: {
    _next: '/editor/[...id]',
    create: '/editor/create',
    edit: (id = ':id') => `/editor/${id}`,
  },
}
