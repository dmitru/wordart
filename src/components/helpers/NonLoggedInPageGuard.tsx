import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import { Urls } from 'urls'
import { useRouter } from 'next/dist/client/router'

const IS_SSR = typeof window === 'undefined'

export const NonLoggedInPageGuard = (PageComponent: React.ComponentType) => {
  const ProtectedPage = observer(() => {
    const { authStore } = useStore()
    const router = useRouter()

    if (IS_SSR || !authStore.hasInitialized) {
      return null
    }

    if (authStore.isLoggedIn === true) {
      router.replace(Urls.loginRedirect)
      return <SpinnerSplashScreen />
    }

    return <PageComponent />
  })

  return ProtectedPage
}
