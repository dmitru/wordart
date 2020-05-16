import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import { observer } from 'mobx-react'

const IS_SSR = typeof window === 'undefined'

export const NoPrerenderingPage = (PageComponent: React.ComponentType) => {
  const ProtectedPage = observer(() => {
    if (IS_SSR) {
      return <SpinnerSplashScreen />
    }

    return <PageComponent />
  })

  return ProtectedPage
}
