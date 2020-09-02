import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuTransition,
  Portal,
  Text,
} from '@chakra-ui/core'
import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import { Spinner } from 'components/Editor/components/Spinner'
import { WordcloudThumbnail } from 'components/pages/DashboardPage/components'
import { MoveToFolderModal } from 'components/pages/DashboardPage/MoveToFolderModal'
import { dashboardUiState } from 'components/pages/DashboardPage/state'
import { Button } from 'components/shared/Button'
import { ConfirmModal } from 'components/shared/ConfirmModal'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'
import { PromptModal } from 'components/shared/PromptModal'
import { SearchInput } from 'components/shared/SearchInput'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import { observer } from 'mobx-react'
import Link from 'next/link'
import pluralize from 'pluralize'
import React, { useState } from 'react'
import {
  FaRegCheckSquare,
  FaRegFolder,
  FaSearch,
  FaTimes,
} from 'react-icons/fa'
import { ApiErrors } from 'services/api/api'
import { Folder, Wordcloud } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'
import { openUrlInNewTab } from 'utils/browser'
import { BsHeartFill } from 'react-icons/bs'

export const DesignsView = observer(() => {
  const {
    wordcloudsStore: store,
    authStore: { profile },
  } = useStore()
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
  const upgradeModal = useUpgradeModal()

  const allWordclouds = store.wordclouds
  const wordcloudsInFolder = allWordclouds.filter((wc) => {
    if (dashboardUiState.folder === 'all') {
      return true
    }
    if (dashboardUiState.folder === 'no folder') {
      return !wc.folderId
    }
    return wc.folderId === dashboardUiState.folder.id
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

  const moveToFolder = async (wcs: Wordcloud[], folder: Folder | null) => {
    await store.moveToFolder(wcs, folder)
    toasts.showSuccess({
      title: `Moved ${wcs.length} ${pluralize('design', wcs.length)}${
        folder ? ` to "${folder.title}"` : ' out of folder'
      }`,
    })
    selection.clear()
  }

  const duplicate = async (wc: Wordcloud, title: string) => {
    title = title.trim()

    if (!title) {
      toasts.showWarning({
        title: 'You need to enter a name to make a copy',
      })
      return
    }
    await store.copy(wc.id, { title })
    toasts.showSuccess({
      title: 'Copy created',
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
      <Box flex="3" display="flex" flexDirection="column" overflow="hidden">
        {/* Toolbar */}
        <Box
          py="4"
          zIndex="1"
          boxShadow="0 0px 3px 0 rgba(0,0,0,0.1), 0 0px 2px 0 rgba(0,0,0,0.06)"
          display="flex"
          alignItems="center"
        >
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
            colorScheme="accent"
            leftIcon={<AddIcon />}
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
              <Menu isLazy>
                <MenuButton
                  as={Button}
                  colorScheme="accent"
                  rightIcon={<ChevronDownIcon />}
                >
                  {selection.size} selected
                </MenuButton>
                <MenuTransition>
                  {(styles) => (
                    <Portal>
                      {/* 
                      @ts-ignore */}
                      <MenuList css={styles}>
                        <MenuItemWithIcon
                          icon={<FaRegFolder />}
                          onClick={() =>
                            setMovindWordclouds(
                              store.wordclouds.filter((w) =>
                                selection.has(w.id)
                              )
                            )
                          }
                        >
                          Move to folder
                        </MenuItemWithIcon>
                        <MenuItemWithIcon
                          icon={<FaTimes />}
                          onClick={() =>
                            setDeletingWordclouds(
                              store.wordclouds.filter((w) =>
                                selection.has(w.id)
                              )
                            )
                          }
                        >
                          Delete
                        </MenuItemWithIcon>
                      </MenuList>
                    </Portal>
                  )}
                </MenuTransition>
              </Menu>

              <Button
                ml="2"
                variant="ghost"
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
                  ? `Deselect all`
                  : `Select all`}
              </Button>
            </Box>
          )}
        </Box>

        {/* Grid */}
        <Flex
          flex="1"
          wrap="wrap"
          alignItems="flex-start"
          justifyItems="flex-start"
          justifyContent="flex-start"
          alignContent="flex-start"
          mr="1rem"
          css={css`
            min-height: calc(100vh - 200px);
            overflow-y: auto;
            background: #f8f8f8;
            padding: 1.5rem;
            box-shadow: inset 0 0 8px 0 #0003;
            margin-bottom: 1rem;
          `}
        >
          {!store.hasFetchedWordclouds && (
            <Box
              display="flex"
              width="100%"
              alignItems="center"
              justifyContent="center"
              minHeight="50vh"
            >
              <Spinner size="xl" mx="auto" />
            </Box>
          )}

          {store.hasFetchedWordclouds && allWordclouds.length === 0 && (
            <Box
              borderRadius="lg"
              mx="auto"
              p="6"
              fontSize="lg"
              bg="white"
              boxShadow="md"
              maxWidth="600px"
              width="100%"
            >
              <Text fontSize="1.4rem" fontWeight="medium">
                Welcome to WordCloudy!
              </Text>

              <Text>We're happy to see you here!</Text>

              <Text>
                To get started quickly, please follow this quick tutorial:
                <br />
                <a
                  href="https://wordcloudy.com/blog/getting-started-in-5-minutes/"
                  target="_blank"
                >
                  Getting Started: Create Your First Word Design in 3 Minutes.
                </a>
              </Text>
              <Text>
                You may also want to explore explore{' '}
                <a
                  href="https://wordcloudy.com/blog/tag/tutorials/"
                  target="_blank"
                >
                  our other tutorials
                </a>{' '}
                to learn about more advanced features of Wordcloudy.
              </Text>

              <Box display="flex" mt="6" mb="2rem">
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
                  colorScheme="accent"
                  leftIcon={<AddIcon />}
                  mr="3"
                  size="lg"
                >
                  Create your First Design
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  as="a"
                  target="_blank"
                  href="https://wordcloudy.com/blog/tag/tutorials/"
                >
                  Check out tutorials
                </Button>
              </Box>

              <Text fontWeight="medium" fontSize="1.4rem">
                Getting help
              </Text>
              <Text>
                Please refer to our{' '}
                <Link passHref href={Urls.faq}>
                  <a>FAQ</a>
                </Link>{' '}
                for common questions. If you need more help, please{' '}
                <Link passHref href={Urls.contact}>
                  <a>write to us via the Contact Form</a>
                </Link>
                – our friendly support team will reply within 24 hours.
              </Text>
            </Box>
          )}

          {allWordclouds.length > 0 && wordcloudsInFolder.length === 0 && (
            <Box
              display="flex"
              maxWidth="600px"
              width="100%"
              mx="auto"
              alignItems="center"
              flexDirection="column"
              boxShadow="sm"
              borderColor="gray.100"
              borderWidth="1px"
              p="6"
              bg="white"
            >
              <Box
                mb="1rem"
                bg="primary.50"
                color="primary.400"
                width="90px"
                height="90px"
                borderRadius="100%"
                borderWidth="2px"
                borderColor="primary.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {dashboardUiState.folder !== 'no folder' && (
                  <FaRegFolder size={48} />
                )}
                {dashboardUiState.folder === 'no folder' && (
                  <FaSearch size={40} />
                )}
              </Box>

              <Text
                fontSize="xl"
                flex={1}
                textAlign="center"
                color="gray.600"
                mb="0"
              >
                {dashboardUiState.folder === 'no folder' && 'Nothinig to show'}
                {dashboardUiState.folder !== 'no folder' &&
                  'This folder is empty'}
              </Text>

              <Text
                mt="4"
                fontSize="md"
                flex={1}
                textAlign="center"
                color="gray.500"
                maxWidth="300px"
              >
                {dashboardUiState.folder !== 'no folder' &&
                  `You can move some of you designs to this folder, or create a new design here.`}
                {dashboardUiState.folder === 'no folder' &&
                  `All your designs are already in folders.`}
              </Text>

              {dashboardUiState.folder === 'no folder' && (
                <Button
                  colorScheme="secondary"
                  onClick={() => {
                    dashboardUiState.folder = 'all'
                  }}
                >
                  Show all designs
                </Button>
              )}
            </Box>
          )}

          {/* No search results */}
          {wordcloudsInFolder.length > 0 && wordcloudsFiltered.length === 0 && (
            <Box
              display="flex"
              maxWidth="600px"
              width="100%"
              mx="auto"
              alignItems="center"
              flexDirection="column"
              boxShadow="sm"
              borderColor="gray.100"
              borderWidth="1px"
              p="6"
              bg="white"
            >
              <Box
                mb="1rem"
                bg="primary.50"
                color="primary.400"
                width="90px"
                height="90px"
                borderRadius="100%"
                borderWidth="2px"
                borderColor="primary.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FaSearch size={40} />
              </Box>

              <Text
                fontSize="xl"
                flex={1}
                textAlign="center"
                color="gray.600"
                mb="0"
              >
                No results to show
              </Text>

              <Text
                mt="4"
                fontSize="md"
                flex={1}
                textAlign="center"
                color="gray.500"
                maxWidth="400px"
              >
                There are no designs matching the filter.
              </Text>
            </Box>
          )}

          {wordcloudsInFolder.length > 0 &&
            wordcloudsFiltered.length > 0 &&
            wordcloudsFiltered.map((wc) => (
              <WordcloudThumbnail
                key={wc.id}
                wordcloud={wc}
                isSelecting={isSelecting}
                onClick={(e) => {
                  if (isSelecting) {
                    e.preventDefault()

                    if (!selection.has(wc.id)) {
                      selection.add(wc.id)
                    } else {
                      selection.delete(wc.id)
                    }
                  } else {
                    // Open the editor...
                  }
                }}
                onOpenInEditor={() => {
                  openUrlInNewTab(Urls.editor.edit(wc.id))
                }}
                onMoveToFolder={() => setMovindWordclouds([wc])}
                onRename={() => setRenamingWordcloud(wc)}
                onDuplicate={() => {
                  if (
                    profile &&
                    profile.limits.maxWordclouds <= allWordclouds.length
                  ) {
                    upgradeModal.show('design-limits')
                    return
                  }
                  setDuplicatingWordcloud(wc)
                }}
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

        {/* Move to folder */}
        <MoveToFolderModal
          title={
            movingWordclouds
              ? `Move ${movingWordclouds.length} ${pluralize(
                  'design',
                  movingWordclouds.length
                )} to folder`
              : ''
          }
          isOpen={movingWordclouds != null}
          onSubmit={async (folder) => {
            if (!movingWordclouds) {
              return
            }
            try {
              await moveToFolder(movingWordclouds, folder)
            } finally {
              setMovindWordclouds(null)
            }
          }}
          onCancel={() => setMovindWordclouds(null)}
        ></MoveToFolderModal>
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
        {/* Duplicate */}
        <PromptModal
          isOpen={duplicatingWordcloud != null}
          initialValue={duplicatingWordcloud?.title}
          onSubmit={async (title) => {
            if (!duplicatingWordcloud) {
              return
            }
            try {
              await duplicate(duplicatingWordcloud, title)
            } catch (error) {
              if (error.response?.data?.message === ApiErrors.WordcloudsLimit) {
                upgradeModal.show('design-limits')
              }
              setDuplicatingWordcloud(null)
            } finally {
              setDuplicatingWordcloud(null)
            }
          }}
          onCancel={() => setDuplicatingWordcloud(null)}
          title="Save as a copy"
          inputProps={{
            placeholder: 'Enter name for the copy...',
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
