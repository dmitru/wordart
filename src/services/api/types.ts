import {
  BackgroundStyleConfig,
  ShapeStyleConfig,
  ShapeId,
} from 'components/Editor/style'

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
  author: string
  createdAt: string
  updatedAt: string
}

export type WordcloudEditorData = {
  version: 1
  data: {
    bg: {
      style: BackgroundStyleConfig
    }
    shape: {
      shapeId: ShapeId | null
      style: ShapeStyleConfig
    }
  }
}

// export type SerializedItem = SerializedWordItem

export type CreateWordcloudDto = {
  title: string
  editorData: WordcloudEditorData
}

export type SaveWordcloudDto = {
  title: string
  editorData: WordcloudEditorData
}
