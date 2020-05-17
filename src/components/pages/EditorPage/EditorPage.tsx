import { EditorComponent } from 'components/Editor/Editor'
import { observer } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import React from 'react'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'

export const EditorPage = observer(() => {
  const router = useRouter()
  const { id } = router.query
  console.log('router.query', router.query)
  if (!id) {
    return <SpinnerSplashScreen />
  }
  const wordcloudId = id[0]
  return (
    <EditorComponent
      wordcloudId={wordcloudId === 'create' ? undefined : wordcloudId}
    />
  )
})
