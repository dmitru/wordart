import 'mobx-react-lite/batchingForReactDom'
import { RootStore } from 'services/root-store'
import { Api } from 'services/api/api'
import { observable, computed } from 'mobx'
import { MyProfile } from 'services/api/types'
import { AuthTokenStore } from 'services/auth-token-store'

const IS_SSR = typeof window === 'undefined'

export class AuthStore {
  rootStore: RootStore

  @observable hasInitialized = false
  @observable profile: MyProfile | null = null

  afterLogin: Function = () => null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
  }

  @computed get isLoggedIn() {
    if (IS_SSR) {
      return false
    }
    if (!this.hasInitialized) {
      return undefined
    }
    return this.profile != null
  }

  initUsingSavedLocalAuthToken = async () => {
    const authToken = AuthTokenStore.getAuthToken()
    if (authToken) {
      Api.setAuthToken(authToken)
      AuthTokenStore.setAuthToken(authToken)
      try {
        const profile = await Api.auth.getMyProfile()
        this.profile = profile
        this.afterLogin()
      } catch {
        Api.clearAuthToken()
        AuthTokenStore.clearAuthToken()
      } finally {
        this.hasInitialized = true
      }
    } else {
      this.hasInitialized = true
    }
  }

  loginWithEmailOrUsername = async (params: {
    emailOrUsername: string
    password: string
  }): Promise<void> => {
    console.log('loginWithEmailOrUsername')
    try {
      const { authToken } = await Api.auth.login(params)
      Api.setAuthToken(authToken)
      AuthTokenStore.setAuthToken(authToken)

      const profile = await Api.auth.getMyProfile()
      this.profile = profile
      this.afterLogin()
    } catch (error) {
      throw error
    }
  }

  logout = () => {
    AuthTokenStore.clearAuthToken()
    Api.clearAuthToken()
    this.profile = null
  }
}
