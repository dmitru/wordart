import { EditorPersistedDataV1 } from 'services/api/persisted/v1'

export type MyProfile = {
  id: UserId
  username: string
  email: string
  paddleUserId?: number
  hdDownloadsLeft?: number
}

export type UserProfile = {
  id: UserId
  username: string
}
export type EmailLoginParams = { emailOrUsername: string; password: string }

export type UserId = string

export type WordcloudId = string

export type Wordcloud = {
  id: WordcloudId
  key: string
  version: number
  title: string
  thumbnail: string
  author: string
  createdAt: string
  updatedAt: string
  lastUpdatedContentAt: string
  folderId: string | null
}

export type FolderId = string
export type Folder = {
  id: FolderId
  title: string
  wordclouds: WordcloudId[]
  createdAt: string
  updatedAt: string
}

export type EditorPersistedData = EditorPersistedDataV1

export type CreateFolderDto = {
  title: string
}

export type UpdateFolderDto = Partial<{
  title: string
}>

export type CreateWordcloudDto = {
  title: string
  thumbnail: string
  editorData: EditorPersistedData
}

export type CloneWordcloudDto = {
  title: string
}

export type UpdateManyWordcloudsDto = {
  ids: WordcloudId[]
  update: {
    folderId?: string | null
  }
}

export type UpdateWordcloudDto =
  | {
      title: string
    }
  | {
      title: string
      thumbnail: string
      editorData: EditorPersistedData
    }

export type HdDownloadDto = {
  wordloudKey: string
  wordcloudVersion: number
}

export type HdDownloadResult = {
  canDownload: boolean
}

export type Order = {
  orderId: string
  createdAt: string
  updatedAt: string
  productId: number
  receiptUrl: string
  amount: number
  currency: string
  status: string
}

export type ProcessOrderDto = {
  checkoutId: string
}
