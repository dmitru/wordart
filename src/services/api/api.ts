import {
  MyProfile,
  Wordcloud,
  EmailLoginParams,
  CreateWordcloudDto,
  EditorPersistedData,
  WordcloudId,
  UpdateWordcloudDto,
  Order,
  ProcessOrderDto,
  HdDownloadDto,
  HdDownloadResult,
  CreateFolderDto,
  Folder,
  FolderId,
  UpdateFolderDto,
  CloneWordcloudDto,
  UpdateManyWordcloudsDto,
  EmailSignupParams,
  CreateAnonymousWordcloudDto,
} from 'services/api/types'
import { apiClient, ApiResponseError } from './api-client'

export const Api = {
  setAuthToken: apiClient.setAuthToken,
  clearAuthToken: apiClient.clearAuthToken,

  extractor: {
    async fromUrl(data: {
      url: string
      removeCommon?: boolean
      removeNumbers?: boolean
      stemming?: boolean
      limit?: number
    }): Promise<{ words: string[]; counts: number[] }> {
      const response = await apiClient.post('/extract/url', data)
      return response.data as { words: string[]; counts: number[] }
    },
  },

  folders: {
    async create(data: CreateFolderDto): Promise<Folder> {
      const response = await apiClient.post('/folders', data)
      return response.data as Folder
    },
    async delete(id: FolderId): Promise<void> {
      await apiClient.delete(`/folders/${id}`)
    },
    async update(id: FolderId, data: UpdateFolderDto): Promise<Folder> {
      const response = await apiClient.put(`/folders/${id}`, data)
      return response.data as Folder
    },
    async fetchMy(): Promise<Folder[]> {
      const response = await apiClient.get('/folders')
      return response.data as Folder[]
    },
  },

  wordclouds: {
    async create(data: CreateWordcloudDto): Promise<Wordcloud> {
      const response = await apiClient.post('/wordclouds', data)
      return response.data as Wordcloud
    },
    async createAnonymous(
      data: CreateAnonymousWordcloudDto
    ): Promise<Wordcloud> {
      const response = await apiClient.post('/wordclouds/anonymous', data)
      return response.data as Wordcloud
    },
    async restoreAnonymous(id: WordcloudId): Promise<Wordcloud> {
      const response = await apiClient.put(
        `/wordclouds/${id}/restore-anonymous`
      )
      return response.data as Wordcloud
    },
    async copy(id: WordcloudId, data: CloneWordcloudDto): Promise<Wordcloud> {
      const response = await apiClient.post(`/wordclouds/${id}/copy`, data)
      return response.data as Wordcloud
    },
    async delete(id: WordcloudId): Promise<void> {
      await apiClient.delete(`/wordclouds/${id}`)
    },
    async deleteMany(ids: WordcloudId[]): Promise<void> {
      await apiClient.delete(`/wordclouds/`, { data: { ids } })
    },
    async update(id: WordcloudId, data: UpdateWordcloudDto): Promise<void> {
      await apiClient.put(`/wordclouds/${id}`, data)
    },
    async updateMany(data: UpdateManyWordcloudsDto): Promise<void> {
      await apiClient.put(`/wordclouds`, data)
    },
    async fetchMy(): Promise<Wordcloud[]> {
      const response = await apiClient.get('/wordclouds')
      return response.data as Wordcloud[]
    },
    async fetchEditorData(id: WordcloudId): Promise<EditorPersistedData> {
      const response = await apiClient.get(`/wordclouds/${id}/editorData`)
      return response.data as EditorPersistedData
    },
    async hdDownload(data: HdDownloadDto): Promise<HdDownloadResult> {
      const response = await apiClient.post(`/wordclouds/hd-download`, data)
      return response.data as HdDownloadResult
    },
  },

  orders: {
    async fetchMy(): Promise<Order[]> {
      const response = await apiClient.get(`/users/orders`)
      return response.data as Order[]
    },
    async process(data: ProcessOrderDto): Promise<MyProfile> {
      const response = await apiClient.post('/users/orders', data)
      return response.data as MyProfile
    },
  },

  auth: {
    async login({
      email,
      password,
    }: EmailLoginParams): Promise<{ authToken: string }> {
      const response = await apiClient.post('/auth/login', {
        username: email,
        password,
      })
      return response.data as { authToken: string }
    },

    async signup(params: EmailSignupParams): Promise<{ authToken: string }> {
      const response = await apiClient.post('/auth/signup', params)
      return response.data as { authToken: string }
    },

    async verifyEmail(emailVerificationToken: string): Promise<void> {
      const response = await apiClient.post('/auth/email-verification', {
        emailVerificationToken,
      })
      return response.data
    },

    async resetPasswordRequest(params: {
      email: string
      recaptcha: string
    }): Promise<void> {
      await apiClient.post('/auth/reset-password-request', params)
    },

    async resetPassword(params: {
      newPassword: string
      passwordResetToken: string
    }): Promise<{ authToken: string }> {
      const response = await apiClient.post('/auth/reset-password', params)
      return response.data as { authToken: string }
    },

    async getMyProfile(): Promise<MyProfile> {
      const response = await apiClient.get('/users/profile')
      return response.data as MyProfile
    },
  },
}
