import { EditorPersistedDataV1 } from 'services/api/persisted/v1'

export type MyProfile = {
  id: UserId
  displayName: string
  profilePicture?: string
  email: string
  paddleUserId?: number
  hdDownloadsLeft?: number
  unlimitedPlanExpiresAt?: string
  isEmailConfirmed: boolean
  limits: UserLimits
  createdAt: string
  updatedAt: string
}

export type UserLimits = {
  isActiveUnlimitedPlan: boolean
  isActiveDownloadsPack: boolean
  canDownloadHd: boolean
  maxFolders: number
  maxWordclouds: number
  canUploadCustomMedia: boolean
}

export type UserProfile = {
  id: UserId
  username: string
}
export type EmailLoginParams = { email: string; password: string }
export type EmailSignupParams = {
  email: string
  password: string
  recaptcha: string
}

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

export type CreateAnonymousWordcloudDto = {
  id: WordcloudId
  recaptcha: string
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
