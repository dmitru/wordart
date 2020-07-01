import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  PopoverArrow,
  Text,
} from '@chakra-ui/core'
import css from '@emotion/css'
import {
  FolderMenuButton,
  FolderRow,
  FolderRowTag,
  FoldersList,
} from 'components/pages/DashboardPage/components'
import { dashboardUiState } from 'components/pages/DashboardPage/state'
import { Button } from 'components/shared/Button'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'
import { PromptModal } from 'components/shared/PromptModal'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { FaPencilAlt, FaPlus, FaRegFolder, FaTimes } from 'react-icons/fa'
import { Folder } from 'services/api/types'
import { useStore } from 'services/root-store'
import { useToasts } from 'use-toasts'

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
          isSelected={dashboardUiState.folder == null}
          onClick={() => {
            dashboardUiState.folder = null
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
            isSelected={dashboardUiState.folder === f}
            onClick={() => {
              dashboardUiState.folder = f
              dashboardUiState.selection.clear()
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
