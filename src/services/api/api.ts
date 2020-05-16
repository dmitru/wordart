import { MyProfile } from 'services/api/types'
import { apiClient } from './api-client'

export const Api = {
  setAuthToken: apiClient.setAuthToken,
  clearAuthToken: apiClient.clearAuthToken,

  auth: {
    async login({
      emailOrUsername,
      password,
    }: LoginParams): Promise<{ authToken: string }> {
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

export type LoginParams = { emailOrUsername: string; password: string }
