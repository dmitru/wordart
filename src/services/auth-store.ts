import { BroadcastChannel } from 'broadcast-channel'
import { state as upgradeModalState } from 'components/upgrade/UpgradeModal'
import { config } from 'config'
import jsonp from 'jsonp'
import { action, computed, observable, runInAction } from 'mobx'
import 'mobx-react-lite/batchingForReactDom'
import { LocalizedPrice, plans } from 'plans'
import { Api } from 'services/api/api'
import { MyProfile } from 'services/api/types'
import { AuthTokenStore } from 'services/auth-token-store'
import { RootStore } from 'services/root-store'
import { consoleLoggers } from 'utils/console-logger'
import { analytics, StructuredEvents } from './analytics'

const IS_SSR = typeof window === 'undefined'

type TODOANY = any

declare global {
  interface Window {
    Paddle: any
  }
}

type AuthChannelMessage =
  | {
      kind: 'login'
      data: {
        profile: MyProfile
        authToken: string
      }
    }
  | {
      kind: 'logout'
    }
  | {
      kind: 'profile-update'
      data: Partial<MyProfile>
    }

export class AuthStore {
  logger = consoleLoggers.authStore
  rootStore: RootStore

  channel = new BroadcastChannel<AuthChannelMessage>('auth')

  @observable hasInitialized = false
  @observable profile: MyProfile | null = null

  @observable planPrices = new Map<number, LocalizedPrice>()

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore

    this.channel.addEventListener('message', this.handleChannelMsg)

    if (!IS_SSR && window['Paddle']) {
      window.Paddle.Setup({
        vendor: config.paddle.vendorId,
        eventCallback: async (data: any) => {
          this.logger.debug('Paddle event: ', data.event)

          if (data.event === 'Checkout.Loaded') {
            const planId = data.eventData.product.id
            const plan = plans.find((plan) => plan.id === planId)
            if (plan) {
              analytics.trackStructured(
                StructuredEvents.mkShowPaymentModal(plan)
              )
            }
          }

          if (data.event === 'Checkout.Complete') {
            const planId = data.eventData.product.id

            const plan = plans.find((plan) => plan.id === planId)
            if (plan) {
              analytics.trackStructured(
                StructuredEvents.mkPayForProUpgradePaypal(plan)
              )
            }

            const checkoutId = data.eventData.checkout.id
            const {
              profile: updatedProfile,
              authToken,
              isNewUser,
            } = await Api.orders.process({ checkoutId })

            this.channel.postMessage({
              kind: 'profile-update',
              data: updatedProfile,
            })

            if (authToken) {
              this.logger.debug('new account created, signing in')

              Api.setAuthToken(authToken)
              AuthTokenStore.setAuthToken(authToken)
              this.afterLogin()
              this.channel.postMessage({
                kind: 'login',
                data: { profile: updatedProfile, authToken },
              })

              if (isNewUser) {
                // @ts-ignore
                if (window['toast']) {
                  // @ts-ignore
                  window['toast'].showSuccess({
                    title: 'New account has been created for you',
                    description: `You should receive your login and password to your email: ${updatedProfile.email}`,
                    duration: 100000,
                    isClosable: true,
                  })
                }
              }
            }

            upgradeModalState.isOpen = false
            this.profile = updatedProfile
          }
        },
      })
      this.fetchLocalizedPrices()
    }
  }

  @action handleChannelMsg = (msg: AuthChannelMessage) => {
    switch (msg.kind) {
      case 'login': {
        this.profile = msg.data.profile
        Api.setAuthToken(msg.data.authToken)
        this.afterLogin()
        break
      }
      case 'profile-update': {
        // @ts-ignore
        this.profile = { ...this.profile, ...msg.data }
        break
      }
      case 'logout': {
        this.profile = null
        Api.clearAuthToken()
        break
      }
    }
  }

  /** Called after log in, regardless of the method */
  afterLogin: Function = () => null

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

    this.channel.postMessage({
      kind: 'profile-update',
      data: { isEmailConfirmed: true },
    })
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

        this.channel.postMessage({
          kind: 'login',
          data: { profile, authToken },
        })

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

      this.channel.postMessage({
        kind: 'login',
        data: { profile, authToken },
      })

      this.afterLogin()
    } catch (error) {
      throw error
    }
  }

  signupWithEmail = async (params: {
    email: string
    password: string
    recaptcha: string
  }): Promise<void> => {
    console.log('signupWithEmail')
    try {
      const { authToken } = await Api.auth.signup(params)
      Api.setAuthToken(authToken)
      AuthTokenStore.setAuthToken(authToken)

      const profile = await Api.auth.getMyProfile()
      this.profile = profile

      this.channel.postMessage({
        kind: 'login',
        data: { profile, authToken },
      })

      this.afterLogin()
    } catch (error) {
      throw error
    }
  }

  logout = () => {
    AuthTokenStore.clearAuthToken()
    Api.clearAuthToken()

    this.channel.postMessage({
      kind: 'logout',
    })

    analytics.setUserId('anynymous')

    this.profile = null
  }
}
