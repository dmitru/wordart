import { Box, Flex, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import { WordcloudThumbnail } from 'components/pages/DashboardPage/components'
import { dashboardUiState } from 'components/pages/DashboardPage/state'
import { Button } from 'components/shared/Button'
import { ConfirmModal } from 'components/shared/ConfirmModal'
import { PromptModal } from 'components/shared/PromptModal'
import { SearchInput } from 'components/shared/SearchInput'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import Link from 'next/link'
import pluralize from 'pluralize'
import React, { useState } from 'react'
import { FaFolder, FaRegCheckSquare } from 'react-icons/fa'
import { Wordcloud } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'

export const DesignsView = observer(() => {
  const { wordcloudsStore: store } = useStore()
  const toasts = useToasts()
  const [
    duplicatingWordcloud,
    setDuplicatingWordcloud,
  ] = useState<Wordcloud | null>(null)
  const [renamingWordcloud, setRenamingWordcloud] = useState<Wordcloud | null>(
    null
  )
  const [deletingWordclouds, setDeletingWordclouds] = useState<
    Wordcloud[] | null
  >(null)
  const [movingWordclouds, setMovindWordclouds] = useState<Wordcloud[] | null>(
    null
  )

  const [query, setQuery] = useState('')

  const wordcloudsInFolder = store.wordclouds.filter((wc) => {
    if (dashboardUiState.folder === 'all') {
      return true
    }
    if (dashboardUiState.folder === 'no folder') {
      return !wc.folder
    }
    return wc.folder === dashboardUiState.folder.id
  })

  const wordcloudsFiltered = wordcloudsInFolder.filter((wc) =>
    query
      ? wc.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      : true
  )

  const { selection } = dashboardUiState
  const isSelecting = selection.size > 0

  const rename = async (wc: Wordcloud, title: string) => {
    title = title.trim()

    if (!title) {
      return
    }
    if (title === wc.title) {
      return
    }
    await store.save(wc.id, { title })
    toasts.showSuccess({
      title: 'Changes saved',
    })
  }

  const remove = async (wcs: Wordcloud[]) => {
    const ids = wcs.map((wc) => wc.id)
    await store.delete(ids)
    toasts.showSuccess({
      title: `Deleted ${wcs.length} ${pluralize('design', wcs.length)}`,
    })
    selection.clear()
  }

  return (
    <>
      <Box flex="3" display="flex" flexDirection="column">
        {/* Toolbar */}
        <Box mt="4" mb="4" display="flex" alignItems="center">
          <Button
            as="a"
            css={css`
              &,
              &:hover,
              &:focus {
                text-decoration: none !important;
              }
            `}
            href={Urls.editor.create}
            target="_blank"
            variantColor="accent"
            leftIcon="add"
            size="lg"
          >
            Create New
          </Button>

          <Box ml="1rem" maxWidth="300px">
            <SearchInput
              noBorder={false}
              onChange={setQuery}
              value={query}
              placeholder="Filter..."
              size="md"
            />
          </Box>

          {isSelecting && (
            <Box ml="3">
              <Button
                variant="outline"
                mr="2"
                onClick={() =>
                  setDeletingWordclouds(
                    store.wordclouds.filter((w) => selection.has(w.id))
                  )
                }
              >
                Delete
              </Button>

              <Button
                mr="2"
                variant="outline"
                onClick={() =>
                  setMovindWordclouds(
                    store.wordclouds.filter((w) => selection.has(w.id))
                  )
                }
              >
                <Box mr="2">
                  <FaFolder />
                </Box>
                Move to folder
              </Button>

              <Button
                mr="2"
                variantColor="primary"
                onClick={() => {
                  const isAllSelected =
                    selection.size === wordcloudsFiltered.length
                  if (isAllSelected) {
                    selection.clear()
                  } else {
                    dashboardUiState.selection = new Set(
                      wordcloudsFiltered.map((w) => w.id)
                    )
                  }
                }}
              >
                <Box mr="2">
                  <FaRegCheckSquare />
                </Box>
                {selection.size === wordcloudsFiltered.length
                  ? `Deselect ${wordcloudsFiltered.length}`
                  : `Select all ${wordcloudsFiltered.length}`}
              </Button>
            </Box>
          )}
        </Box>

        {!store.hasFetchedWordclouds && 'Loading...'}
        {store.hasFetchedWordclouds && (
          <>
            {store.wordclouds.length === 0 && (
              <>
                <p>
                  Welcome! Click the button below to create your first
                  wordcloud.
                </p>
                <Link href={Urls.editor._next} as={Urls.editor.create} passHref>
                  <Button variantColor="accent">Create</Button>
                </Link>
              </>
            )}
            <Flex
              flex="1"
              wrap="wrap"
              alignItems="flex-start"
              justifyItems="flex-start"
              justifyContent="flex-start"
              alignContent="flex-start"
              css={css`
                min-height: calc(100vh - 200px);
                overflow-y: auto;
                background: #f8f8f8;
                padding: 2rem;
                box-shadow: inset 0 0 6px 0 #0001;
                margin-bottom: 3rem;
              `}
            >
              {/* TODO: empty UI */}

              {wordcloudsInFolder.length > 0 &&
                wordcloudsFiltered.length > 0 &&
                wordcloudsFiltered.map((wc) => (
                  <WordcloudThumbnail
                    key={wc.id}
                    wordcloud={wc}
                    isSelecting={isSelecting}
                    onClick={
                      isSelecting
                        ? () => {
                            console.log('onClick')
                            if (isSelecting) {
                              if (!selection.has(wc.id)) {
                                selection.add(wc.id)
                              } else {
                                selection.delete(wc.id)
                              }
                            } else {
                              // Open the editor...
                            }
                          }
                        : () => null
                    }
                    onMoveToFolder={() => setMovindWordclouds([wc])}
                    onRename={() => setRenamingWordcloud(wc)}
                    onDuplicate={() => setDuplicatingWordcloud(wc)}
                    onDelete={() => setDeletingWordclouds([wc])}
                    isSelected={selection.has(wc.id)}
                    onSelectionChange={(isSelected) => {
                      if (isSelected) {
                        selection.add(wc.id)
                      } else {
                        selection.delete(wc.id)
                      }
                    }}
                  />
                ))}
            </Flex>
          </>
        )}

        {/* Rename */}
        <PromptModal
          isOpen={renamingWordcloud != null}
          initialValue={renamingWordcloud?.title}
          onSubmit={async (title) => {
            if (!renamingWordcloud) {
              return
            }
            try {
              await rename(renamingWordcloud, title)
            } finally {
              setRenamingWordcloud(null)
            }
          }}
          onCancel={() => setRenamingWordcloud(null)}
          title="Rename design"
          inputProps={{
            placeholder: 'Enter name...',
          }}
        />

        {/* Delete */}
        <ConfirmModal
          isOpen={deletingWordclouds != null}
          title={
            deletingWordclouds && deletingWordclouds.length > 1
              ? `Delete ${deletingWordclouds.length} ${pluralize(
                  'design',
                  deletingWordclouds.length
                )}`
              : `Delete "${(deletingWordclouds || [])[0]?.title}"`
          }
          onSubmit={async () => {
            if (!deletingWordclouds) {
              return
            }
            try {
              await remove(deletingWordclouds)
            } finally {
              setDeletingWordclouds(null)
            }
          }}
          onCancel={() => setDeletingWordclouds(null)}
        >
          <Text>
            Are you sure you want to delete this design? You won't be able to
            undo this action.
          </Text>
        </ConfirmModal>
      </Box>
    </>
  )
})
