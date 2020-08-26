import { EditorComponent } from 'components/Editor/components/Editor'
import { observer } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import React, { useEffect } from 'react'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'

export const EditorPage = observer(() => {
  const router = useRouter()
  const { id } = router.query
  if (!id) {
    return <SpinnerSplashScreen />
  }
  const wordcloudId = id[0]

  useEffect(() => {
    window.drift?.on('ready', (api: any) => {
      api.hideWelcomeMessage()
    })
  }, [])

  return (
    <EditorComponent
      wordcloudId={wordcloudId === 'create' ? undefined : wordcloudId}
    />
  )
})
