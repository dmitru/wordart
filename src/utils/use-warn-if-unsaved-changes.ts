import { useEffect } from 'react'
import Router from 'next/router'

export const useWarnIfUnsavedChanges = (
  hasUnsavedChanges: (newUrl?: string) => boolean,
  message = 'Do you want to leave? Unsaved changes may be lost.'
) => {
  useEffect(() => {
    const routeChangeStart = (url: string) => {
      if (
        Router.asPath !== url &&
        hasUnsavedChanges(url) &&
        !confirm(message)
      ) {
        Router.events.emit('routeChangeError')
        Router.replace(Router, Router.asPath)
        throw 'Abort route change. Please ignore this error.'
      }
    }

    const beforeunload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', beforeunload)
    Router.events.on('routeChangeStart', routeChangeStart)

    return () => {
      window.removeEventListener('beforeunload', beforeunload)
      Router.events.off('routeChangeStart', routeChangeStart)
    }
  }, [hasUnsavedChanges, message])
}
