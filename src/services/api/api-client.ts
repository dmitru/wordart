import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { AuthTokenStore } from 'services/auth-token-store'
import { get } from 'lodash'
import { Urls } from 'urls'
import { config } from 'config'

export interface ApiClient extends AxiosInstance {
  setAuthToken: (authToken: string) => void
  clearAuthToken: () => void
}

export type ApiError = AxiosError

export class ApiResponseError extends Error {
  error: AxiosError
  response: AxiosResponse
  constructor(error: AxiosError) {
    super(error.message)
    this.response = error.response as AxiosResponse
    this.error = error
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class ApiRequestError extends Error {
  error: AxiosError
  request: any

  constructor(error: AxiosError) {
    super(error.message)
    this.error = error
    this.request = error.request
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

const createApiClient = ({
  baseUrl,
  errorHandler,
}: {
  baseUrl: string
  errorHandler: (apiError: ApiError) => void
}) => {
  const apiClient = axios.create({
    baseURL: baseUrl,
    validateStatus: (status: number) =>
      (status >= 200 && status < 300) || status === 404,
  }) as ApiClient

  apiClient.setAuthToken = (accessToken: string) => {
    if (accessToken) {
      apiClient.defaults.headers.authorization = `Bearer ${accessToken}`
    }
  }

  apiClient.clearAuthToken = () => {
    delete apiClient.defaults.headers.authorization
  }

  apiClient.interceptors.request.use((requestConfig) => {
    const headers = requestConfig.headers

    // if (config.sentry.enabled) {
    //   // Generate a unique ID for the request and set as Sentry tag
    //   const requestId = Math.random()
    //     .toString(36)
    //     .substr(2, 9)
    // Sentry.configureScope(scope => {
    //   scope.setTag('request_id', requestId)
    // })

    //   headers['X-Client-Request-Id'] = requestId
    // }

    // Send the app version to API (for debugging and analytics)
    // headers['X-Web-App-Version'] = config.release.version
    // headers['X-Web-App-Hash'] = config.release.hash

    return {
      ...requestConfig,
      headers,
    }
  })

  return apiClient
}

export const apiClient = createApiClient({
  // Base URL for all API requests, e.g. http://localhost:3000
  baseUrl: config.api.baseUrl,
  // A global handler for API errors
  // Differentiates between server errors and client-side errors (e.g. no network)
  errorHandler: (error: ApiError) => {
    if (
      !error.response ||
      error.response.status === 422 ||
      error.response.status >= 500
    ) {
      // Only report missing response, 422 (indicates invalid params), or 5XX errors
      // Sentry.captureException(new Error(error.message))
    }

    if (error.response) {
      console.error(
        'apiClient.errorHandler / response: ',
        error,
        error.response?.data?.errors
      )
      if (get(error.response.data, 'errors.token') === 'invalid') {
        apiClient.clearAuthToken()
        AuthTokenStore.clearAuthToken()
        window.location.replace(Urls.login)
      }
      return Promise.reject(new ApiResponseError(error))
    }
    if (error.request) {
      console.error('apiClient.errorHandler / request: ', error, error.request)
      return Promise.reject(new ApiRequestError(error))
    }
    return Promise.reject(error)
  },
})
