import {
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuTransition,
  Portal,
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
import { ConfirmModal } from 'components/shared/ConfirmModal'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'
import { PromptModal } from 'components/shared/PromptModal'
import { useUpgradeModal } from 'components/upgrade/UpgradeModal'
import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { FaPencilAlt, FaPlus, FaRegFolder, FaTimes } from 'react-icons/fa'
import { ApiErrors } from 'services/api/api'
import { Folder } from 'services/api/types'
import { useStore } from 'services/root-store'
import { useToasts } from 'use-toasts'
import { AccountUsage } from './AccountUsage'

export const FoldersView = observer(() => {
  const { wordcloudsStore: store } = useStore()
  const toasts = useToasts()
  const upgradeModal = useUpgradeModal()
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null)
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
      maxWidth="320px"
      ml="6"
      pr="2"
      minWidth="200px"
      flex="1"
      width="100%"
      css={css`
        position: relative;
        z-index: 2;
      `}
    >
      <FoldersList mr="4">
        {/* Account usage */}
        <Box height="96px" mt="70px" mb="6">
          <AccountUsage />
        </Box>

        <FolderRow
          fontSize="lg"
          fontWeight="medium"
          color="gray.600"
          py={2}
          px={3}
          isSelected={dashboardUiState.folder === 'all'}
          onClick={() => {
            dashboardUiState.folder = 'all'
          }}
        >
          All your designs
          <FolderRowTag ml="auto" size="sm">
            {store.wordclouds.length}
          </FolderRowTag>
        </FolderRow>

        {store.folders.length > 0 && (
          <FolderRow
            fontSize="lg"
            fontWeight="medium"
            color="gray.600"
            py={2}
            px={3}
            isSelected={dashboardUiState.folder === 'no folder'}
            onClick={() => {
              dashboardUiState.folder = 'no folder'
            }}
          >
            Designs with no folder
            <FolderRowTag ml="auto" size="sm">
              {store.wordclouds.filter((wc) => !wc.folderId).length}
            </FolderRowTag>
          </FolderRow>
        )}

        <Box py="3" mt="5" display="flex" alignItems="center">
          <Text
            flex="1"
            textTransform="uppercase"
            fontSize="sm"
            fontWeight="medium"
            color="gray.500"
            mb="0"
            mt="0"
          >
            Folders
          </Text>

          <Button
            color="gray.500"
            variant="outline"
            width="140px"
            size="sm"
            onClick={() => setIsCreatingFolder(true)}
          >
            <Box mr="2">
              <FaPlus />
            </Box>
            New Folder
          </Button>
        </Box>

        <Box
          overflow="auto"
          css={css`
            min-height: 160px;
            max-height: 400px;
            max-height: calc(100vh - 450px);

            &::-webkit-scrollbar {
              display: none; /* Chrome Safari */
            }
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE 10+ */
          `}
        >
          {store.folders.map((f) => (
            <FolderRow
              hideCountOnHover
              fontSize="lg"
              fontWeight="medium"
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
                <Menu isLazy placement="bottom-end">
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

                  <Portal>
                    <MenuTransition>
                      {(styles) => (
                        <MenuList
                          // @ts-ignore
                          css={styles}
                          fontWeight="normal"
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
                            onClick={() => setDeletingFolder(f)}
                          >
                            Delete
                          </MenuItemWithIcon>
                          {/* <PopoverArrow /> */}
                        </MenuList>
                      )}
                    </MenuTransition>
                  </Portal>
                </Menu>
              </Box>
            </FolderRow>
          ))}
        </Box>

        {/* Delete folder */}
        <ConfirmModal
          isOpen={deletingFolder != null}
          title={`Delete folder`}
          onSubmit={async () => {
            if (!deletingFolder) {
              return
            }
            try {
              await deleteFolder(deletingFolder)
            } finally {
              setDeletingFolder(null)
            }
          }}
          onCancel={() => setDeletingFolder(null)}
        >
          <Text>
            Are you sure you want to delete folder "{deletingFolder?.title}"?
          </Text>
          <Text>
            All designs in this folder will <strong>not</strong> be deleted and
            will be simply moved outside of the deleted folder.
          </Text>
        </ConfirmModal>

        {/* Rename folder */}
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

        {/* Create new folder */}
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
              if (error.response?.data?.message === ApiErrors.FoldersLimit) {
                upgradeModal.show('folder-limits')
              }
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
      </FoldersList>
    </Box>
  )
})
