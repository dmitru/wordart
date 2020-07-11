export const Urls = {
  landing: '/',
  login: '/login',
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
