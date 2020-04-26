import React, { useContext } from 'react'
import { EditorPageStore } from 'components/pages/EditorPage/editor-page-store'

export class RootStore {
  editorPageStore: EditorPageStore

  constructor() {
    this.editorPageStore = new EditorPageStore(this)
  }
}

export const rootStore = new RootStore()

export const RootStoreContext = React.createContext<RootStore>(rootStore)

export const useStore = () => {
  const rootStore = useContext(RootStoreContext)
  return rootStore
}
