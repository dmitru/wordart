import 'mobx-react-lite/batchingForReactDom'
import { RootStore } from 'services/root-store'
import { Api } from 'services/api/api'
import { observable, computed, action } from 'mobx'
import {
  Wordcloud,
  CreateWordcloudDto,
  WordcloudId,
  SaveWordcloudDto,
  Folder,
  CreateFolderDto,
  FolderId,
  UpdateFolderDto,
  CloneWordcloudDto,
} from 'services/api/types'
import { sortBy } from 'lodash'

export class WordcloudsStore {
  rootStore: RootStore

  @observable hasFetchedWordclouds = false
  @observable hasFetchedFolders = false
  @observable private _wordclouds: Wordcloud[] = []
  @observable private _folders: Folder[] = []

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
  }

  getById = (id: WordcloudId): Wordcloud | undefined => {
    return this.wordclouds.find((wc) => wc.id === id)
  }

  fetchWordclouds = async () => {
    const wordclouds = await Api.wordclouds.fetchMy()
    this.hasFetchedWordclouds = true
    this._wordclouds = wordclouds
  }

  fetchFolders = async () => {
    const folders = await Api.folders.fetchMy()
    this.hasFetchedFolders = true
    this._folders = folders
  }

  create = async (data: CreateWordcloudDto): Promise<Wordcloud> => {
    const wordcloud = await Api.wordclouds.create(data)
    this._wordclouds.push(wordcloud)
    return wordcloud
  }

  copy = async (
    id: WordcloudId,
    data: CloneWordcloudDto
  ): Promise<Wordcloud> => {
    const wordcloud = await Api.wordclouds.copy(id, data)
    this._wordclouds.push(wordcloud)
    return wordcloud
  }

  delete = async (ids: WordcloudId[]): Promise<void> => {
    await Api.wordclouds.deleteMany(ids)
    this._wordclouds = this._wordclouds.filter((wc) => !ids.includes(wc.id))
  }

  save = async (id: WordcloudId, data: SaveWordcloudDto): Promise<void> => {
    const { title } = data
    await Api.wordclouds.save(id, data)
    const wc = this._wordclouds.find((w) => w.id === id)
    if (wc) {
      wc.title = title
    }
  }

  @action moveToFolder = async (
    wcs: Wordcloud[],
    folder: Folder
  ): Promise<void> => {
    for (const wc of wcs) {
      const oldFolder = this._folders.find((f) => f.id === wc.folder)
      if (oldFolder) {
        oldFolder.wordclouds = oldFolder.wordclouds.filter(
          (wId) => wId !== wc.id
        )
      }
      wc.folder = folder.id
      folder.wordclouds = [...new Set([...folder.wordclouds, wc.id])]
    }
    // TODO: API call
  }

  createFolder = async (data: CreateFolderDto): Promise<Folder> => {
    const folder = await Api.folders.create(data)
    this._folders.push(folder)
    return folder
  }

  deleteFolder = async (id: FolderId): Promise<void> => {
    for (const wc of this._wordclouds) {
      if (wc.folder === id) {
        wc.folder = null
      }
    }
    this._folders = this._folders.filter((f) => f.id !== id)
    await Api.folders.delete(id)
  }

  updateFolder = async (
    id: FolderId,
    data: UpdateFolderDto
  ): Promise<Folder> => {
    const folder = await Api.folders.update(id, data)
    this._folders = this._folders.map((f) => (f.id === id ? folder : f))
    return folder
  }

  @computed get wordclouds() {
    return sortBy(this._wordclouds, (wc) => -new Date(wc.updatedAt).getTime())
  }

  @computed get folders() {
    return sortBy(this._folders, (f) => f.title.trim().toLocaleLowerCase())
  }
}
