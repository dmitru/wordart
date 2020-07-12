export const Urls = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  signupCompleted: '/signup/success',
  verifyEmail: '/signup/verify-email',
  emailVerification: '/auth/verify-email',
  loginRedirect: '/home',

  privacyPolicy: '/legal/privacy',
  termsOfUse: '/legal/terms',

  account: '/account',
  yourDesigns: '/home',
  faq: '/faq',
  pricing: '/pricing',

  editor: {
    _next: '/editor/[...id]',
    create: '/editor/create',
    edit: (id = ':id') => `/editor/${id}`,
  },
}
