import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { useRouter } from 'next/dist/client/router'
import { AuthTokenStore } from 'services/auth-token-store'
import { useEffect } from 'react'
import { Urls } from 'urls'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'

const LoginSuccessPage = observer(() => {
  const { authStore } = useStore()
  const router = useRouter()

  useEffect(() => {
    const { authToken } = router.query
    if (authToken) {
      AuthTokenStore.setAuthToken(authToken as string)
      authStore.initUsingSavedLocalAuthToken().then(() => {
        router.replace(Urls.loginRedirect)
      })
    }
  }, [router?.query?.authToken])

  return <SpinnerSplashScreen />
})

export default LoginSuccessPage
