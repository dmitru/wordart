import React, { useContext } from 'react'
import { configure } from 'mobx'
import 'mobx-react-lite/batchingForReactDom'
import { EditorPageStore } from 'components/Editor/editor-page-store'
import { AuthStore } from 'services/auth-store'

configure({})

export class RootStore {
  editorPageStore: EditorPageStore
  authStore: AuthStore

  constructor() {
    this.editorPageStore = new EditorPageStore(this)
    this.authStore = new AuthStore(this)

    this.authStore.initUsingSavedLocalAuthToken()
  }
}

export const rootStore = new RootStore()

export const RootStoreContext = React.createContext<RootStore>(rootStore)

export const useStore = () => {
  const rootStore = useContext(RootStoreContext)
  return rootStore
}
