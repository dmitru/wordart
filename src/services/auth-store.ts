import 'mobx-react-lite/batchingForReactDom'
import { RootStore } from 'services/root-store'
import { Api } from 'services/api/api'
import { observable, computed } from 'mobx'
import { MyProfile } from 'services/api/types'
import { AuthTokenStore } from 'services/auth-token-store'
import jsonp from 'jsonp'
import { plans, PricingPlanWithPrice, LocalizedPrice } from 'plans'
import { keyBy } from 'lodash'

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

  @observable plans: PricingPlanWithPrice[] = plans

  afterLogin: Function = () => null

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.fetchLocalizedPrices()

    if (!IS_SSR) {
      window.Paddle.Setup({
        vendor: 597590,
        eventCallback: (data: any) => {
          console.log('data = ', data)
          if (data.event === 'Checkout.Complete') {
            console.log(data.eventData)
            const checkoutId = data.eventData.checkout.id
            // TODO: pass to backend, update profile
          }
        },
      })
    }
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

  getPlans = () => this.plans

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
          resolve(localizedPrices)
        }
      )
    })
    const plansById = keyBy(plans, 'id')
    this.plans = pricesFromPaddle.map((p) => ({
      price: p.price,
      ...plansById[p.productId],
    }))
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
