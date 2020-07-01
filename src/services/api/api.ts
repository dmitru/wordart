import {
  MyProfile,
  Wordcloud,
  EmailLoginParams,
  CreateWordcloudDto,
  EditorPersistedData,
  WordcloudId,
  SaveWordcloudDto,
  Order,
  ProcessOrderDto,
  HdDownloadDto,
  HdDownloadResult,
  CreateFolderDto,
  Folder,
  FolderId,
  UpdateFolderDto,
} from 'services/api/types'
import { apiClient } from './api-client'

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
    async delete(id: WordcloudId): Promise<void> {
      await apiClient.delete(`/wordclouds/${id}`)
    },
    async deleteMany(ids: WordcloudId[]): Promise<void> {
      // TODO: optimize it
      await Promise.all(ids.map((id) => apiClient.delete(`/wordclouds/${id}`)))
    },
    async save(id: WordcloudId, data: SaveWordcloudDto): Promise<void> {
      await apiClient.put(`/wordclouds/${id}`, data)
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
      emailOrUsername,
      password,
    }: EmailLoginParams): Promise<{ authToken: string }> {
      const response = await apiClient.post('/auth/login', {
        username: emailOrUsername,
        password,
      })
      return response.data as { authToken: string }
    },

    async getMyProfile(): Promise<MyProfile> {
      const response = await apiClient.get('/users/profile')
      return response.data as MyProfile
    },
  },
}
