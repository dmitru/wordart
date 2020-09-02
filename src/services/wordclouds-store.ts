import 'mobx-react-lite/batchingForReactDom'
import { RootStore } from 'services/root-store'
import { Api } from 'services/api/api'
import { observable, computed, action, toJS, set } from 'mobx'
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
  CreateAnonymousWordcloudDto,
} from 'services/api/types'
import { sortBy } from 'lodash'
import { BroadcastChannel } from 'broadcast-channel'

type WordcloudChannelMessage =
  | {
      kind: 'wcld-update'
      ids: WordcloudId[]
      data: Partial<Wordcloud>
    }
  | {
      kind: 'wcld-create'
      data: Wordcloud
    }
  | {
      kind: 'wcld-delete'
      ids: WordcloudId[]
    }
  | {
      kind: 'folder-create'
      data: Folder
    }
  | {
      kind: 'folder-update'
      id: FolderId
      data: Partial<Folder>
    }
  | {
      kind: 'folder-delete'
      ids: FolderId[]
    }

export class WordcloudsStore {
  rootStore: RootStore

  channel = new BroadcastChannel<WordcloudChannelMessage>('wclds')

  @observable hasFetchedWordclouds = false
  @observable hasFetchedFolders = false
  @observable templates: Wordcloud[] | null = null
  @observable private _wordclouds = new Map<WordcloudId, Wordcloud>()
  @observable private _folders = new Map<FolderId, Folder>()

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
    this.channel.addEventListener('message', this.handleChannelMsg)
  }

  @action fetchTemplates = async () => {
    if (!this.templates) {
      this.templates = await Api.wordclouds.fetchTemplates()
    }
  }

  @action handleChannelMsg = (msg: WordcloudChannelMessage) => {
    switch (msg.kind) {
      // Wordclouds
      case 'wcld-update': {
        for (const id of msg.ids) {
          const wcld = this._wordclouds.get(id)
          if (wcld) {
            this._wordclouds.set(id, { ...wcld, ...msg.data })
            this.updateFoldersAfterWcldUpdate(id)
          }
        }
        break
      }
      case 'wcld-create': {
        this._wordclouds.set(msg.data.id, msg.data)
        this.updateFoldersAfterWcldUpdate(msg.data.id)
        break
      }
      case 'wcld-delete': {
        for (const id of msg.ids) {
          this._wordclouds.delete(id)
          this.updateFoldersAfterWcldRemove(id)
        }
        break
      }
      // Folders
      case 'folder-update': {
        const folder = this._folders.get(msg.id)
        if (folder) {
          this._folders.set(msg.id, { ...folder, ...msg.data })
        }
        break
      }
      case 'folder-create': {
        this._folders.set(msg.data.id, msg.data)
        break
      }
      case 'folder-delete': {
        for (const id of msg.ids) {
          this._folders.delete(id)
          this.updateFoldersAfterFolderRemove(id)
        }
        break
      }
    }
  }

  @action updateFoldersAfterFolderRemove = (folderId: FolderId) => {
    for (const [id, wordcloud] of this._wordclouds) {
      if (wordcloud.folderId === folderId) {
        wordcloud.folderId = null
      }
    }
  }

  @action updateFoldersAfterWcldRemove = (wcldId: WordcloudId) => {
    for (const [id, folder] of this._folders) {
      if (folder.wordclouds.includes(wcldId)) {
        folder.wordclouds = folder.wordclouds.filter((id) => id !== wcldId)
      }
    }
  }

  @action updateFoldersAfterWcldUpdate = (wcldId: WordcloudId) => {
    const wordcloud = this._wordclouds.get(wcldId)
    if (!wordcloud) {
      return
    }

    if (!wordcloud.folderId) {
      for (const [id, folder] of this._folders) {
        if (folder.wordclouds.includes(wcldId)) {
          folder.wordclouds = folder.wordclouds.filter((id) => id !== wcldId)
        }
      }
    } else {
      const folder = this._folders.get(wordcloud.folderId)
      if (folder && !folder.wordclouds.includes(wordcloud.folderId)) {
        folder.wordclouds.push(wordcloud.folderId)
      }
    }
  }

  getById = (id: WordcloudId): Wordcloud | undefined => this._wordclouds.get(id)

  @action fetchWordclouds = async () => {
    const wordclouds = await Api.wordclouds.fetchMy()
    for (const wordcloud of wordclouds) {
      this._wordclouds.set(wordcloud.id, wordcloud)
    }
    this.hasFetchedWordclouds = true
  }

  @action fetchWordcloudById = async (id: WordcloudId) => {
    const wordcloud = await Api.wordclouds.fetchById(id)
    this._wordclouds.set(wordcloud.id, wordcloud)
  }

  @action fetchFolders = async () => {
    const folders = await Api.folders.fetchMy()
    this.hasFetchedFolders = true
    for (const folder of folders) {
      this._folders.set(folder.id, folder)
    }
  }

  create = async (data: CreateWordcloudDto): Promise<Wordcloud> => {
    const wordcloud = await Api.wordclouds.create(data)
    this._wordclouds.set(wordcloud.id, wordcloud)
    this.channel.postMessage({
      kind: 'wcld-create',
      data: toJS(wordcloud, { recurseEverything: true }),
    })
    return wordcloud
  }

  restoreAnonymousIfNeeded = async () => {
    const savedAnonymousWordcloudId = window.localStorage.getItem(
      'anonymousWordcloudId'
    )
    if (!savedAnonymousWordcloudId) {
      return
    }

    const restoredWordcloud = await Api.wordclouds.restoreAnonymous(
      savedAnonymousWordcloudId
    )
    this._wordclouds.set(restoredWordcloud.id, restoredWordcloud)

    this.channel.postMessage({
      kind: 'wcld-create',
      data: toJS(restoredWordcloud, { recurseEverything: true }),
    })

    window.localStorage.removeItem('anonymousWordcloudId')
  }

  createAnonymous = async (
    data: CreateAnonymousWordcloudDto
  ): Promise<Wordcloud> => {
    const wordcloud = await Api.wordclouds.createAnonymous(data)
    this._wordclouds.set(wordcloud.id, wordcloud)
    window.localStorage.setItem('anonymousWordcloudId', data.id)
    return wordcloud
  }

  copy = async (
    id: WordcloudId,
    data: CloneWordcloudDto
  ): Promise<Wordcloud> => {
    const wordcloud = await Api.wordclouds.copy(id, data)
    this._wordclouds.set(wordcloud.id, wordcloud)

    // Update folders
    this.updateFoldersAfterWcldUpdate(wordcloud.id)
    this.channel.postMessage({
      kind: 'wcld-create',
      data: toJS(wordcloud, { recurseEverything: true }),
    })

    return wordcloud
  }

  @action delete = async (ids: WordcloudId[]): Promise<void> => {
    await Api.wordclouds.deleteMany(ids)
    const idsSet = new Set(ids)

    for (const id of idsSet) {
      this.updateFoldersAfterWcldRemove(id)
      this._wordclouds.delete(id)
    }

    this.channel.postMessage({
      kind: 'wcld-delete',
      ids,
    })
  }

  save = async (id: WordcloudId, data: UpdateWordcloudDto): Promise<void> => {
    await Api.wordclouds.update(id, data)
    const wc = this._wordclouds.get(id)
    if (!wc) {
      return
    }
    wc.title = data.title
    if ('thumbnail' in data) {
      wc.thumbnail = data.thumbnail
    }
    this.channel.postMessage({
      kind: 'wcld-update',
      ids: [id],
      data: toJS(wc, { recurseEverything: true }),
    })
  }

  @action moveToFolder = async (
    wcs: Wordcloud[],
    folder: Folder | null
  ): Promise<void> => {
    const ids = wcs.map((w) => w.id)
    const folderId = folder ? folder.id : null
    await Api.wordclouds.updateMany({ ids, update: { folderId } })

    for (const wc of wcs) {
      if (wc.folderId) {
        const oldFolder = this._folders.get(wc.folderId)
        if (oldFolder) {
          oldFolder.wordclouds = oldFolder.wordclouds.filter(
            (wId) => wId !== wc.id
          )
        }
      }

      wc.folderId = folderId

      this.channel.postMessage({
        kind: 'wcld-update',
        ids,
        data: { folderId },
      })

      if (folder) {
        folder.wordclouds = [...new Set([...folder.wordclouds, wc.id])]
      }
    }
  }

  createFolder = async (data: CreateFolderDto): Promise<Folder> => {
    const folder = await Api.folders.create(data)
    this._folders.set(folder.id, folder)

    this.channel.postMessage({
      kind: 'folder-create',
      data: toJS(folder, { recurseEverything: true }),
    })

    return folder
  }

  @action deleteFolder = async (id: FolderId): Promise<void> => {
    await Api.folders.delete(id)
    this.updateFoldersAfterFolderRemove(id)
    this._folders.delete(id)
    this.channel.postMessage({
      kind: 'folder-delete',
      ids: [id],
    })
  }

  @action updateFolder = async (
    id: FolderId,
    data: UpdateFolderDto
  ): Promise<Folder> => {
    const folder = await Api.folders.update(id, data)
    this._folders.set(folder.id, folder)
    this.channel.postMessage({
      kind: 'folder-update',
      id,
      data: toJS(folder, { recurseEverything: true }),
    })
    return folder
  }

  @computed get wordclouds() {
    return sortBy(
      [...this._wordclouds.values()],
      (wc) =>
        wc.lastUpdatedContentAt
          ? -new Date(wc.lastUpdatedContentAt).getTime()
          : -new Date(wc.createdAt).getTime() || -1e10,
      (wc) => -new Date(wc.updatedAt).getTime()
    )
  }

  @computed get folders() {
    return sortBy([...this._folders.values()], (f) =>
      f.title.trim().toLocaleLowerCase()
    )
  }
}
