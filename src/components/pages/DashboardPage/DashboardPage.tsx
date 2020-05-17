import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { Box } from 'components/shared/Box'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { Wordcloud } from 'services/api/types'
import { Button } from 'components/shared/Button'
import Link from 'next/link'
import { Urls } from 'urls'

export type WordcloudThumbnailProps = {
  wordcloud: Wordcloud
}

export const WordcloudThumbnail: React.FC<WordcloudThumbnailProps> = ({
  wordcloud,
}) => {
  return (
    <Box my={2} p={3}>
      <pre>{JSON.stringify(wordcloud, null, 2)}</pre>
      <Link
        as={Urls.editor.edit(wordcloud.id)}
        href={Urls.editor._next}
        passHref
      >
        <Button accent>Edit</Button>
      </Link>
    </Box>
  )
}

export const DashboardPage = observer(() => {
  const { wordcloudsStore } = useStore()

  return (
    <SiteLayout>
      <Box>
        <h1>Dashboard</h1>
        {!wordcloudsStore.hasFetchedMy && 'Loading...'}
        {wordcloudsStore.hasFetchedMy && (
          <Box>
            {wordcloudsStore.myWordclouds.length === 0 && (
              <>
                <p>
                  Welcome! Click the button below to create your first
                  wordcloud.
                </p>
                <Link href={Urls.editor._next} as={Urls.editor.create} passHref>
                  <Button accent>Create</Button>
                </Link>
              </>
            )}
            {wordcloudsStore.myWordclouds.length > 0 &&
              wordcloudsStore.myWordclouds.map((wc) => (
                <WordcloudThumbnail key={wc.id} wordcloud={wc} />
              ))}
          </Box>
        )}
      </Box>
    </SiteLayout>
  )
})
