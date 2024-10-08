import {
  CloneWordcloudDto,
  CreateAnonymousWordcloudDto,
  CreateFolderDto,
  CreateWordcloudDto,
  EditorPersistedData,
  EmailLoginParams,
  EmailSignupParams,
  Folder,
  FolderId,
  HdDownloadDto,
  HdDownloadResult,
  MyProfile,
  Order,
  ProcessOrderDto,
  UpdateFolderDto,
  UpdateManyWordcloudsDto,
  UpdateWordcloudDto,
  Wordcloud,
  WordcloudId,
  Coupon,
} from 'services/api/types'
import { apiClient } from './api-client'
import pako from 'pako'

export const ApiErrors = {
  NoMediaUploadFreePlan: 'no_custom_media_for_free_plan',
  WordcloudsLimit: 'wordclouds_limit',
  FoldersLimit: 'folders_limit',
}

export const Api = {
  setAuthToken: apiClient.setAuthToken,
  clearAuthToken: apiClient.clearAuthToken,

  coupons: {
    async fetchLaunchCoupon(): Promise<Coupon> {
      const response = await apiClient.get('/users/launch-coupon')
      return response.data as Coupon
    },
  },

  feedback: {
    async sendForm(data: {
      email: string
      name?: string
      subject?: string
      message: string
      recaptcha: string
    }) {
      const response = await apiClient.post('/users/contact-form', data)
      return response.data
    },
  },

  extractor: {
    async imageFromUrl(data: { url: string }): Promise<{ data: string }> {
      const response = await apiClient.post('/extract/image', data)
      return response.data as { data: string }
    },
    async wordsFromUrl(data: {
      url: string
      removeCommon?: boolean
      removeNumbers?: boolean
      singularize?: boolean
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
      const compressedData = pako.deflate(JSON.stringify(data.editorData), {
        to: 'string',
      })
      const response = await apiClient.post('/wordclouds', {
        ...data,
        editorData: compressedData,
      })
      return response.data as Wordcloud
    },
    async createAnonymous(
      data: CreateAnonymousWordcloudDto
    ): Promise<Wordcloud> {
      const compressedData = pako.deflate(JSON.stringify(data.editorData), {
        to: 'string',
      })
      const response = await apiClient.post('/wordclouds/anonymous', {
        ...data,
        editorData: compressedData,
      })
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
      if ('editorData' in data) {
        const compressedData = pako.deflate(JSON.stringify(data.editorData), {
          to: 'string',
        })
        await apiClient.put(`/wordclouds/${id}`, {
          ...data,
          editorData: compressedData,
        })
      } else {
        await apiClient.put(`/wordclouds/${id}`, data)
      }
    },
    async updateMany(data: UpdateManyWordcloudsDto): Promise<void> {
      await apiClient.put(`/wordclouds`, data)
    },
    async fetchMy(): Promise<Wordcloud[]> {
      const response = await apiClient.get('/wordclouds')
      return response.data as Wordcloud[]
    },
    async fetchTemplates(): Promise<Wordcloud[]> {
      const response = await apiClient.get('/wordclouds/templates')
      return response.data as Wordcloud[]
    },
    async fetchById(id: WordcloudId): Promise<Wordcloud> {
      const response = await apiClient.get(`/wordclouds/${id}`)
      return response.data as Wordcloud
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
    async process(
      data: ProcessOrderDto
    ): Promise<{ profile: MyProfile; authToken?: string; isNewUser: boolean }> {
      const response = await apiClient.post('/users/orders', data)
      return response.data as {
        profile: MyProfile
        authToken?: string
        isNewUser: boolean
      }
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

    async deleteMyProfile(): Promise<void> {
      await apiClient.delete('/users/profile')
    },
  },
}
