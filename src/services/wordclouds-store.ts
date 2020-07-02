import 'mobx-react-lite/batchingForReactDom'
import { RootStore } from 'services/root-store'
import { Api } from 'services/api/api'
import { observable, computed, action } from 'mobx'
import {
  Wordcloud,
  CreateWordcloudDto,
  WordcloudId,
  UpdateWordcloudDto,
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

    // Update folders
    if (wordcloud.folderId != null) {
      const folder = this._folders.find((f) => f.id === wordcloud.folderId)
      if (folder) {
        folder.wordclouds.push(wordcloud.id)
      }
    }
    return wordcloud
  }

  @action delete = async (ids: WordcloudId[]): Promise<void> => {
    await Api.wordclouds.deleteMany(ids)
    const idsSet = new Set(ids)
    for (const folder of this._folders) {
      folder.wordclouds = folder.wordclouds.filter((id) => !idsSet.has(id))
    }
    this._wordclouds = this._wordclouds.filter((wc) => !idsSet.has(wc.id))
  }

  save = async (id: WordcloudId, data: UpdateWordcloudDto): Promise<void> => {
    const { title } = data
    await Api.wordclouds.update(id, data)
    const wc = this._wordclouds.find((w) => w.id === id)
    if (wc) {
      wc.title = title
    }
  }

  @action moveToFolder = async (
    wcs: Wordcloud[],
    folder: Folder | null
  ): Promise<void> => {
    const ids = wcs.map((w) => w.id)
    const folderId = folder ? folder.id : null
    await Api.wordclouds.updateMany({ ids, update: { folderId } })

    for (const wc of wcs) {
      const oldFolder = this._folders.find((f) => f.id === wc.folderId)
      if (oldFolder) {
        oldFolder.wordclouds = oldFolder.wordclouds.filter(
          (wId) => wId !== wc.id
        )
      }
      wc.folderId = folderId

      if (folder) {
        folder.wordclouds = [...new Set([...folder.wordclouds, wc.id])]
      }
    }
  }

  createFolder = async (data: CreateFolderDto): Promise<Folder> => {
    const folder = await Api.folders.create(data)
    this._folders.push(folder)
    return folder
  }

  deleteFolder = async (id: FolderId): Promise<void> => {
    await Api.folders.delete(id)
    for (const wc of this._wordclouds) {
      if (wc.folderId === id) {
        wc.folderId = null
      }
    }
    this._folders = this._folders.filter((f) => f.id !== id)
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
    return sortBy(
      this._wordclouds,
      (wc) =>
        wc.lastUpdatedContentAt
          ? -new Date(wc.lastUpdatedContentAt).getTime()
          : -1e10,
      (wc) => -new Date(wc.updatedAt).getTime()
    )
  }

  @computed get folders() {
    return sortBy(this._folders, (f) => f.title.trim().toLocaleLowerCase())
  }
}
