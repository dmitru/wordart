import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import { Urls } from 'urls'
import { useRouter } from 'next/dist/client/router'

const IS_SSR = typeof window === 'undefined'

export const AuthGuardPage = (PageComponent: React.ComponentType) => {
  const ProtectedPage = observer(() => {
    const { authStore } = useStore()
    const router = useRouter()

    if (IS_SSR || !authStore.hasInitialized) {
      return <SpinnerSplashScreen />
    }

    if (authStore.isLoggedIn === false) {
      router.replace(Urls.login)
      return <SpinnerSplashScreen />
    }

    return <PageComponent />
  })

  return ProtectedPage
}
