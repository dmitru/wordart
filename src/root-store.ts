import React, { useContext } from 'react'
import { configure } from 'mobx'
import 'mobx-react-lite/batchingForReactDom'
import { EditorPageStore } from 'components/pages/EditorPage/editor-page-store'

configure({ enforceActions: 'observed' })

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
