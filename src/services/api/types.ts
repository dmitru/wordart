import { EditorPersistedDataV1 } from 'services/api/persisted/v1'

export type MyProfile = {
  id: UserId
  username: string
  email: string
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
  title: string
  thumbnail: string
  author: string
  createdAt: string
  updatedAt: string
}

export type EditorPersistedData = EditorPersistedDataV1

export type CreateWordcloudDto = {
  title: string
  thumbnail: string
  editorData: EditorPersistedData
}

export type SaveWordcloudDto = {
  title: string
  thumbnail: string
  editorData: EditorPersistedData
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
  orderId: number
}
