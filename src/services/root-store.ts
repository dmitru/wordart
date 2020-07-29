import * as Sentry from '@sentry/react'
import { configure } from 'mobx'
import 'mobx-react-lite/batchingForReactDom'
import React, { useContext } from 'react'
import { AuthStore } from 'services/auth-store'
import { WordcloudsStore } from 'services/wordclouds-store'
import { analytics } from './analytics'
import { CustomMetricIndices } from './analytics/events'

configure({})

export class RootStore {
  authStore: AuthStore
  wordcloudsStore: WordcloudsStore

  constructor() {
    this.authStore = new AuthStore(this)
    this.wordcloudsStore = new WordcloudsStore(this)
    this.init()
  }

  private init = async () => {
    if (typeof window !== 'undefined') {
      analytics.setMetric(CustomMetricIndices.screenWidth, window.innerWidth)
      analytics.setMetric(CustomMetricIndices.screenHeight, window.innerHeight)
    }

    this.authStore.afterLogin = async () => {
      if (this.authStore.profile) {
        analytics.setUserId(this.authStore.profile.id)
      }

      await this.wordcloudsStore.restoreAnonymousIfNeeded()
      this.wordcloudsStore.fetchWordclouds()
      this.wordcloudsStore.fetchFolders()

      Sentry.configureScope((scope) => {
        if (this.authStore.profile) {
          scope.setUser({
            email: this.authStore.profile.email,
          })
        }
      })
    }
    await this.authStore.initUsingSavedLocalAuthToken()

    analytics.trackPageView()
  }
}

export const rootStore = new RootStore()

export const RootStoreContext = React.createContext<RootStore>(rootStore)

export const useStore = () => {
  const rootStore = useContext(RootStoreContext)
  return rootStore
}
