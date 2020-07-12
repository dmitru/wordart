import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import { Urls } from 'urls'
import { useRouter } from 'next/dist/client/router'

const IS_SSR = typeof window === 'undefined'

export const LoggedInAndVerifiedPageGuard = (
  PageComponent: React.ComponentType
) => {
  const ProtectedPage = observer(() => {
    const { authStore } = useStore()
    const router = useRouter()

    if (IS_SSR || !authStore.hasInitialized) {
      return null
    }

    if (
      authStore.isLoggedIn &&
      !authStore.isEmailConfirmed &&
      router.pathname !== Urls.verifyEmail
    ) {
      router.replace(Urls.verifyEmail)
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
