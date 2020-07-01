import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  PopoverArrow,
  Text,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import {
  FolderRow,
  FoldersList,
  WordcloudThumbnail,
  FolderRowTag,
  FolderMenuButton,
} from 'components/pages/DashboardPage/components'
import { Button } from 'components/shared/Button'
import { ConfirmModal } from 'components/shared/ConfirmModal'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'
import { PromptModal } from 'components/shared/PromptModal'
import { SearchInput } from 'components/shared/SearchInput'
import 'lib/wordart/console-extensions'
import { observable } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import Link from 'next/link'
import pluralize from 'pluralize'
import React, { useState } from 'react'
import {
  FaPencilAlt,
  FaPlus,
  FaRegFolder,
  FaTimes,
  FaFolder,
} from 'react-icons/fa'
import { Folder, FolderId, Wordcloud, WordcloudId } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'

const state = observable({
  folder: null as Folder | null,
  selection: new Set<WordcloudId>(),
})

export const DashboardPage = observer(() => {
  const { wordcloudsStore } = useStore()

  return (
    <SiteLayout fullWidth fullHeight noFooter>
      <Box height="100%" display="flex">
        <FoldersView />
        <DesignsView />
      </Box>
    </SiteLayout>
  )
})

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

  const { selection } = state
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
              {store.wordclouds.length > 0 &&
                store.wordclouds
                  .filter(
                    (wc) =>
                      (query
                        ? wc.title
                            .toLocaleLowerCase()
                            .includes(query.toLocaleLowerCase())
                        : true) &&
                      (state.folder == null || state.folder.id === wc.folder)
                  )
                  .map((wc) => (
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

export const FoldersView = observer(() => {
  const { wordcloudsStore: store } = useStore()
  const toasts = useToasts()
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  const deleteFolder = (folder: Folder) => {
    store.deleteFolder(folder.id)
    toasts.showSuccess({
      title: 'Folder deleted',
    })
  }

  const renameFolder = async (folder: Folder, title: string) => {
    if (!title) {
      return
    }
    await store.updateFolder(folder.id, { title })
    toasts.showSuccess({
      title: 'Folder renamed',
    })
  }

  return (
    <Box
      maxWidth="300px"
      minWidth="200px"
      flex="1"
      width="100%"
      css={css`
        position: relative;
        z-index: 2;
      `}
    >
      <FoldersList mr="4" mt="96px">
        <FolderRow
          fontSize="lg"
          fontWeight="semibold"
          color="gray.600"
          py={2}
          px={3}
          isSelected={state.folder == null}
          onClick={() => {
            state.folder = null
          }}
        >
          All your designs
        </FolderRow>

        <Text
          textTransform="uppercase"
          fontSize="sm"
          mb="2"
          mt="6"
          fontWeight="semibold"
          color="gray.500"
        >
          Folders
        </Text>

        {store.folders.map((f) => (
          <FolderRow
            fontSize="lg"
            fontWeight="semibold"
            color="gray.600"
            py={2}
            px={3}
            key={f.id}
            isSelected={state.folder === f}
            onClick={() => {
              state.folder = f
              state.selection.clear()
            }}
          >
            <Box mr="3" color="gray.400">
              <FaRegFolder />
            </Box>

            {f.title}

            <FolderRowTag ml="auto" size="sm">
              {f.wordclouds.length}
            </FolderRowTag>

            <Box>
              <Menu>
                <MenuButton
                  as={FolderMenuButton}
                  noShadows={false}
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    e.nativeEvent.preventDefault()
                    e.nativeEvent.stopPropagation()
                  }}
                />
                <MenuList
                  fontWeight="normal"
                  zIndex={10000}
                  hasArrow
                  css={css`
                    top: 50px;
                  `}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    e.nativeEvent.preventDefault()
                    e.nativeEvent.stopPropagation()
                  }}
                >
                  <MenuItemWithIcon
                    icon={<FaPencilAlt />}
                    onClick={() => setRenamingFolder(f)}
                  >
                    Rename
                  </MenuItemWithIcon>
                  <MenuItemWithIcon
                    icon={<FaTimes />}
                    onClick={() => deleteFolder(f)}
                  >
                    Delete
                  </MenuItemWithIcon>
                  <PopoverArrow />
                </MenuList>
              </Menu>
            </Box>
          </FolderRow>
        ))}

        <PromptModal
          isOpen={renamingFolder != null}
          initialValue={renamingFolder?.title}
          onSubmit={async (title) => {
            if (!renamingFolder) {
              return
            }
            try {
              await renameFolder(renamingFolder, title)
            } finally {
              setRenamingFolder(null)
            }
          }}
          onCancel={() => setRenamingFolder(null)}
          title="Rename folder"
          inputProps={{
            placeholder: 'Enter folder name...',
          }}
        />

        <PromptModal
          isOpen={isCreatingFolder}
          onSubmit={async (title) => {
            try {
              await store.createFolder({ title })
              toasts.showSuccess({
                title: 'New folder created',
              })
              setIsCreatingFolder(false)
            } catch (error) {
              toasts.showError({
                title: 'Sorry, there was an error when creating new folder',
              })
            } finally {
            }
          }}
          onCancel={() => setIsCreatingFolder(false)}
          title="New folder"
          inputProps={{
            placeholder: 'Enter folder name...',
          }}
        />

        <Box mt="4">
          <Button
            color="gray.500"
            variant="outline"
            width="140px"
            onClick={() => setIsCreatingFolder(true)}
          >
            <Box mr="2">
              <FaPlus />
            </Box>
            New Folder
          </Button>
        </Box>
      </FoldersList>
    </Box>
  )
})
