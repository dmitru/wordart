import React, { useContext } from 'react'
import { configure } from 'mobx'
import 'mobx-react-lite/batchingForReactDom'
import { EditorStore } from 'components/Editor/editor-store'
import { AuthStore } from 'services/auth-store'
import { WordcloudsStore } from 'services/wordclouds-store'

configure({})

export class RootStore {
  editorPageStore: EditorStore
  authStore: AuthStore
  wordcloudsStore: WordcloudsStore

  constructor() {
    this.editorPageStore = new EditorStore(this)
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
