import React, { useContext } from 'react'
import { configure } from 'mobx'
import 'mobx-react-lite/batchingForReactDom'
import { AuthStore } from 'services/auth-store'
import { WordcloudsStore } from 'services/wordclouds-store'
import { EditorStore } from 'components/Editor/editor-store'

configure({})

export class RootStore {
  authStore: AuthStore
  wordcloudsStore: WordcloudsStore

  constructor() {
    this.authStore = new AuthStore(this)
    this.wordcloudsStore = new WordcloudsStore(this)

    this.authStore.afterLogin = async () => {
      await this.wordcloudsStore.restoreAnonymousIfNeeded()
      this.wordcloudsStore.fetchWordclouds()
      this.wordcloudsStore.fetchFolders()
    }
    this.authStore.initUsingSavedLocalAuthToken()
  }
}

export const rootStore = new RootStore()

export const RootStoreContext = React.createContext<RootStore>(rootStore)

export const useStore = () => {
  const rootStore = useContext(RootStoreContext)
  return rootStore
}
