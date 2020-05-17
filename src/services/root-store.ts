import React, { useContext } from 'react'
import { configure } from 'mobx'
import 'mobx-react-lite/batchingForReactDom'
import { EditorPageStore } from 'components/Editor/editor-page-store'
import { AuthStore } from 'services/auth-store'
import { WordcloudsStore } from 'services/wordclouds-store'

configure({})

export class RootStore {
  editorPageStore: EditorPageStore
  authStore: AuthStore
  wordcloudsStore: WordcloudsStore

  constructor() {
    this.editorPageStore = new EditorPageStore(this)
    this.authStore = new AuthStore(this)
    this.wordcloudsStore = new WordcloudsStore(this)

    this.authStore.afterLogin = () => {
      this.wordcloudsStore.fetchMyWordclouds()
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
