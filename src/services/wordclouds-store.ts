import 'mobx-react-lite/batchingForReactDom'
import { RootStore } from 'services/root-store'
import { Api } from 'services/api/api'
import { observable, computed } from 'mobx'
import {
  Wordcloud,
  CreateWordcloudDto,
  WordcloudId,
  SaveWordcloudDto,
} from 'services/api/types'
import { sortBy } from 'lodash'

export class WordcloudsStore {
  rootStore: RootStore

  @observable hasFetchedMy = false
  @observable private _myWordclouds: Wordcloud[] = []

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
  }

  getById = (id: WordcloudId): Wordcloud | undefined => {
    return this.myWordclouds.find((wc) => wc.id === id)
  }

  fetchMyWordclouds = async () => {
    const wordclouds = await Api.wordclouds.fetchMy()
    this.hasFetchedMy = true
    this._myWordclouds = wordclouds
  }

  create = async (data: CreateWordcloudDto): Promise<Wordcloud> => {
    const wordcloud = await Api.wordclouds.create(data)
    this._myWordclouds.push(wordcloud)
    return wordcloud
  }

  delete = async (id: WordcloudId): Promise<void> => {
    this._myWordclouds = this._myWordclouds.filter((wc) => wc.id !== id)
    await Api.wordclouds.delete(id)
  }

  save = async (id: WordcloudId, data: SaveWordcloudDto): Promise<void> => {
    const wordcloud = await Api.wordclouds.save(id, data)
    return wordcloud
  }

  @computed get myWordclouds() {
    return sortBy(this._myWordclouds, (wc) => -new Date(wc.updatedAt).getTime())
  }
}
