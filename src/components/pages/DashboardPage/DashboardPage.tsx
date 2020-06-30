import {
  AspectRatioBox,
  Box,
  Checkbox,
  Flex,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  PopoverArrow,
  Text,
  Tag,
  useToast,
} from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { Button } from 'components/shared/Button'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { SearchInput } from 'components/shared/SearchInput'
import 'lib/wordart/console-extensions'
import { observer, useLocalStore } from 'mobx-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { Wordcloud, Folder, FolderId } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import {
  FaFolder,
  FaFolderPlus,
  FaPlug,
  FaPlus,
  FaCheckSquare,
  FaRegCheckSquare,
  FaRegFolder,
  FaPencilAlt,
  FaTimes,
  FaCopy,
  FaRegCopy,
  FaChevronRight,
} from 'react-icons/fa'
import { observable } from 'mobx'
import { PromptModal } from 'components/shared/PromptModal'
import { useToasts } from 'use-toasts'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'

const state = observable({
  folder: null as Folder | null,
})

export const DashboardPage = observer(() => {
  const { wordcloudsStore } = useStore()

  return (
    <SiteLayout fullWidth>
      <Box display="flex">
        <FoldersView />
        <DesignsView />
      </Box>
    </SiteLayout>
  )
})

const ThumbnailCheckbox = styled(Checkbox)`
  width: 30px;
  height: 30px;
  padding-right: 16px;
  padding-bottom: 16px;
  box-sizing: content-box;

  &:hover {
    > div {
      background: hsla(225, 0%, 95%, 1);
    }
  }

  > div {
    width: 30px;
    height: 30px;
    background: white;
  }

  svg {
    height: 22px;
    width: 22px;
  }
`

export type WordcloudThumbnailProps = {
  isSelecting: boolean
  onClick: () => void
  isSelected: boolean
  onSelectionChange: (isSelected: boolean) => void
  wordcloud: Wordcloud
  onMoveToFolder: () => void
  onDuplicate: () => void
  onRename: () => void
  onDelete: () => void
}

export const WordcloudThumbnail: React.FC<WordcloudThumbnailProps> = ({
  isSelecting,
  onClick,
  isSelected,
  onSelectionChange,
  wordcloud,
  onDelete,
  onMoveToFolder,

  onRename,
  onDuplicate,
}) => {
  const content = (
    <div>
      <AspectRatioBox
        maxW="220px"
        ratio={4 / 3}
        overflow="hidden"
        border="none"
      >
        <Image src={wordcloud.thumbnail} objectFit="contain" css={css`&,`} />
      </AspectRatioBox>
      <Text p="3" mb="0" fontSize="lg" fontWeight="semibold">
        {wordcloud.title}
      </Text>
    </div>
  )

  return (
    <Box
      p={0}
      maxWidth="180px"
      minWidth="180px"
      flex="1"
      borderWidth="1px"
      borderRadius="sm"
      border="gray.50"
      mr="4"
      mb="6"
      bg="white"
      css={css`
        position: relative;
        transition: all 0.13s;

        img {
          transition: all 0.18s;
        }

        box-shadow: 0 0px 16px -5px rgba(0, 0, 0, 0.1),
          0 0px 6px -5px rgba(0, 0, 0, 0.03);

        ${isSelecting &&
        `
        box-shadow: 0 0px 20px -5px rgba(0, 0, 0, 0.22),
                    0 0px 10px -5px rgba(0, 0, 0, 0.08);
        `}

        &:hover {
          box-shadow: 0 0px 18px -5px rgba(0, 0, 0, 0.17),
            0 0px 10px -5px rgba(0, 0, 0, 0.04);

          ${isSelecting &&
          `
            outline: 3px solid hsl(358,80%,85%);
          `}

          img {
            transform: scale(1.2);
            border: none;
          }

          ${ThumbnailMenuButton}, ${ThumbnailCheckbox} {
            opacity: 1;
          }
        }

        ${ThumbnailCheckbox} {
          opacity: 0;
          z-index: 100;
          position: absolute;
          top: 12px;
          left: 8px;
        }

        ${ThumbnailMenuButton} {
          opacity: 0;
          z-index: 100;
          position: absolute;
          top: 8px;
          right: 8px;
        }

        ${isSelecting &&
        `
          ${ThumbnailCheckbox} {
              opacity: 1;
            }
        `}

        ${isSelected &&
        `
          &, &:hover {
            outline: 3px solid hsl(358,80%,65%);
          }
        `}
      `}
    >
      <ThumbnailCheckbox
        size="lg"
        variantColor="accent"
        isChecked={isSelected}
        onChange={(e) => {
          onSelectionChange(e.target.checked)
        }}
      />

      {!isSelecting && (
        <WordcloudThumbnailMenu
          wordcloud={wordcloud}
          onDelete={onDelete}
          onMoveToFolder={onMoveToFolder}
          onSelect={() => onSelectionChange(true)}
          onRename={onRename}
          onDuplicate={onDuplicate}
        />
      )}

      <Box cursor="pointer">
        <Text
          as="a"
          color="gray.600"
          href={isSelecting ? '#' : Urls.editor.edit(wordcloud.id)}
          rel={isSelecting ? '' : 'noopener noreferrer'}
          target={isSelecting ? '' : '_blank'}
          onClick={isSelecting ? onClick : undefined}
          css={css`
            ${isSelecting &&
            `
            &, &:hover, &:focus { text-decoration: none !important; }
          `}
          `}
        >
          {content}
        </Text>
      </Box>
    </Box>
  )
}

type WordcloudThumbnailMenuProps = {
  wordcloud: Wordcloud
  onMoveToFolder: () => void
  onDuplicate: () => void
  onSelect: () => void
  onRename: () => void
  onDelete: () => void
}

const WordcloudThumbnailMenu: React.FC<WordcloudThumbnailMenuProps> = observer(
  (props: WordcloudThumbnailMenuProps) => {
    return (
      <Menu>
        <MenuButton
          as={ThumbnailMenuButton}
          noShadows={false}
          variant="solid"
        />
        <MenuList zIndex={10000} hasArrow>
          <PopoverArrow />

          <MenuItemWithIcon icon={<FaChevronRight />} fontWeight="semibold">
            Open in Editor...
          </MenuItemWithIcon>

          <MenuDivider />

          <MenuItemWithIcon
            onClick={props.onSelect}
            icon={<FaRegCheckSquare />}
          >
            Select
          </MenuItemWithIcon>
          <MenuItemWithIcon
            onClick={props.onMoveToFolder}
            icon={<FaRegFolder />}
          >
            Move to folder
          </MenuItemWithIcon>
          <MenuItemWithIcon icon={<FaRegCopy />} onClick={props.onDuplicate}>
            Duplicate
          </MenuItemWithIcon>
          <MenuItemWithIcon icon={<FaPencilAlt />} onClick={props.onRename}>
            Rename
          </MenuItemWithIcon>

          <MenuDivider />

          <MenuItemWithIcon icon={<FaTimes />} onClick={props.onDelete}>
            Delete
          </MenuItemWithIcon>
        </MenuList>
      </Menu>
    )
  }
)

const ThumbnailMenuButton = styled(MenuDotsButton)`
  /* background: #fff; */
`

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
  const [deletingWordcloud, setDeletingWordcloud] = useState<Wordcloud | null>(
    null
  )
  const [movingWordcloud, setMovindWordcloud] = useState<Wordcloud | null>(null)

  const [query, setQuery] = useState('')

  const { selection } = useLocalStore(() => ({
    selection: new Set<FolderId>(),
  }))
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

  return (
    <>
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

      <Box flex="3">
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
        </Box>

        {!store.hasFetchedWordclouds && 'Loading...'}
        {store.hasFetchedWordclouds && (
          <Box>
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
              wrap="wrap"
              alignItems="flex-start"
              justifyItems="flex-start"
              justifyContent="flex-start"
              alignContent="flex-start"
              css={css`
                min-height: calc(100vh - 200px);
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
                      onMoveToFolder={() => setMovindWordcloud(wc)}
                      onRename={() => setRenamingWordcloud(wc)}
                      onDuplicate={() => setDuplicatingWordcloud(wc)}
                      onDelete={() => setDeletingWordcloud(wc)}
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
          </Box>
        )}
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

export const FoldersList = styled(Box)``

const FolderMenuButton = styled(MenuDotsButton)``

const FolderRowTag = styled(Tag)`
  transition: all 0;
  background: ${(p) => p.theme.colors.primary['50']};
  color: ${(p) => p.theme.colors.gray['600']};
`

export const FolderRow = styled(Box)<{ isSelected?: boolean }>`
  display: flex;
  cursor: pointer;
  align-items: center;
  position: relative;
  border-radius: 8px;
  font-size: 16px;

  ${(p) => (p.isSelected ? `background: hsla(220, 71%, 97%, 1);` : '')}
  cursor: pointer;

  &:hover {
    ${FolderRowTag} {
      opacity: 0;
    }

    ${(p) => !p.isSelected && `background: hsla(220, 71%, 98%, 1);`}

    ${FolderMenuButton} {
      opacity: 1;
    }
  }

  ${FolderMenuButton} {
    opacity: 0;
    z-index: 100;
    position: absolute;
    top: 4px;
    right: 8px;
  }
`
