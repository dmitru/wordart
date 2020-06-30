import { useToast, useToastOptions } from '@chakra-ui/core'

export const useToasts = () => {
  const toasts = useToast()
  const commonParams: useToastOptions = {
    position: 'bottom-right',
    duration: 3000,
    isClosable: true,
    variant: 'subtle',
  }
  return {
    showWarning: (params: useToastOptions) =>
      toasts({
        ...commonParams,
        status: 'warning',
        ...params,
      }),
    showSuccess: (params: useToastOptions) =>
      toasts({
        ...commonParams,
        status: 'success',
        ...params,
      }),
    showError: (params: useToastOptions) =>
      toasts({
        ...commonParams,
        status: 'error',
        ...params,
      }),
  }
}
