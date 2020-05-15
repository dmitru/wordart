const LS_AUTH_TOKEN_KEY = 'authToken'

const IS_SSR = typeof window === 'undefined'

export const AuthTokenStore = {
  getAuthToken(): string | undefined {
    if (IS_SSR) {
      return undefined
    }
    const keyRaw = localStorage.getItem(LS_AUTH_TOKEN_KEY)
    return keyRaw ? JSON.parse(keyRaw) : undefined
  },
  setAuthToken(token: string) {
    localStorage.setItem(LS_AUTH_TOKEN_KEY, JSON.stringify(token))
  },
  clearAuthToken() {
    localStorage.removeItem(LS_AUTH_TOKEN_KEY)
  },
}
