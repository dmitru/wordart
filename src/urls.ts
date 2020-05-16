export const Urls = {
  login: '/login',
  loginRedirect: '/dashboard',

  privacyPolicy: '/legal/privacy',
  termsOfUse: '/legal/terms',

  profile: '/profile',
  dashboard: '/dashboard',

  editor: {
    create: '/create',
    edit: (id = ':id') => `/edit/${id}`,
  },
}
