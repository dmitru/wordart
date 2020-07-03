import { useToast, UseToastOptions } from '@chakra-ui/core'

export const useToasts = () => {
  const toasts = useToast()
  const commonParams: UseToastOptions = {
    position: 'bottom-right',
    duration: 3000,
    isClosable: true,
  }
  return {
    showWarning: (params: UseToastOptions) =>
      toasts({
        ...commonParams,
        status: 'warning',
        ...params,
      }),
    showSuccess: (params: UseToastOptions) =>
      toasts({
        ...commonParams,
        status: 'success',
        ...params,
      }),
    showError: (params: UseToastOptions) =>
      toasts({
        ...commonParams,
        status: 'error',
        ...params,
      }),
  }
}
