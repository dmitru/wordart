import 'mobx-react-lite/batchingForReactDom'
import { RootStore } from 'services/root-store'
import { Api } from 'services/api/api'
import { observable, computed, runInAction } from 'mobx'
import { MyProfile } from 'services/api/types'
import { AuthTokenStore } from 'services/auth-token-store'
import jsonp from 'jsonp'
import { plans, LocalizedPrice } from 'plans'
import { config } from 'config'

const IS_SSR = typeof window === 'undefined'

type TODOANY = any

declare global {
  interface Window {
    Paddle: any
  }
}

export class AuthStore {
  rootStore: RootStore

  @observable hasInitialized = false
  @observable profile: MyProfile | null = null

  @observable planPrices = new Map<number, LocalizedPrice>()

  afterLogin: Function = () => null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore

    if (!IS_SSR) {
      window.Paddle.Setup({
        vendor: config.paddle.vendorId,
        eventCallback: async (data: any) => {
          if (data.event === 'Checkout.Complete') {
            const checkoutId = data.eventData.checkout.id
            const updatedProfile = await Api.orders.process({ checkoutId })
            this.profile = updatedProfile
          }
        },
      })
      this.fetchLocalizedPrices()
    }
  }

  @computed get isEmailConfirmed() {
    if (IS_SSR) {
      return false
    }
    if (!this.hasInitialized) {
      return undefined
    }
    return this.profile?.isEmailConfirmed === true
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

  verifyEmail = async (token: string) => {
    await Api.auth.verifyEmail(token)
    if (!this.profile) {
      return
    }
    this.profile.isEmailConfirmed = true
  }

  fetchLocalizedPrices = async () => {
    const pricesFromPaddle = await new Promise<
      { productId: number; price: LocalizedPrice }[]
    >((resolve, reject) => {
      jsonp(
        `https://checkout.paddle.com/api/2.0/prices?product_ids=${plans.map(
          (p) => p.id
        )}`,
        undefined,
        (err, data) => {
          if (err) {
            console.error(err.message)
            reject(err)
            return
          }

          const localizedPrices: {
            productId: number
            price: LocalizedPrice
          }[] = data.response.products.map((p: any) => ({
            price: {
              currency: p.currency,
              originalPrice: p.list_price,
              price: p.price,
            } as LocalizedPrice,
            productId: p.product_id,
          }))

          runInAction(() => {
            for (const { productId, price } of localizedPrices) {
              this.planPrices.set(productId, price)
            }
          })

          resolve(localizedPrices)
        }
      )
    })
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

  loginWithEmail = async (params: {
    email: string
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

  signupWithEmail = async (params: {
    email: string
    password: string
  }): Promise<void> => {
    console.log('signupWithEmail')
    try {
      const { authToken } = await Api.auth.signup(params)
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
