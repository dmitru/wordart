export const Urls = {
  login: '/login',
  loginRedirect: '/dashboard',

  privacyPolicy: '/legal/privacy',
  termsOfUse: '/legal/terms',

  profile: '/profile',
  dashboard: '/dashboard',

  editor: {
    _next: '/editor/[...id]',
    create: '/editor/create',
    edit: (id = ':id') => `/editor/${id}`,
  },
}
