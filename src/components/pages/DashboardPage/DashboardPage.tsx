import {
  AspectRatioBox,
  Box,
  Checkbox,
  Flex,
  Heading,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  PopoverArrow,
  Text,
} from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { Button } from 'components/shared/Button'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { SearchInput } from 'components/shared/SearchInput'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { Wordcloud } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'

export type WordcloudThumbnailProps = {
  wordcloud: Wordcloud
  onDeleteClick: () => Promise<void>
}

const ThumbnailCheckbox = styled(Checkbox)`
  background: white;
  width: 40px;
  height: 40px;

  > div {
    width: 40px;
    height: 40px;
  }

  svg {
    height: 28px;
    width: 28px;
  }
`

export const WordcloudThumbnail: React.FC<WordcloudThumbnailProps> = ({
  wordcloud,
  onDeleteClick,
}) => {
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
      css={css`
        position: relative;
        transition: all 0.13s;
        box-shadow: 0 0px 25px -5px rgba(0, 0, 0, 0.05),
          0 0px 10px -5px rgba(0, 0, 0, 0.03);

        img {
          transition: all 0.18s;
        }

        &:hover {
          box-shadow: 0 0px 25px -5px rgba(0, 0, 0, 0.2),
            0 0px 10px -5px rgba(0, 0, 0, 0.06);

          img {
            transform: scale(1.2);
          }

          ${ThumbnailMenuButton}, ${ThumbnailCheckbox} {
            opacity: 1;
          }
        }

        ${ThumbnailCheckbox} {
          opacity: 0;
          z-index: 100;
          position: absolute;
          top: 8px;
          left: 8px;
        }

        ${ThumbnailMenuButton} {
          opacity: 0;
          z-index: 100;
          position: absolute;
          top: 8px;
          right: 8px;
        }
      `}
    >
      <ThumbnailCheckbox size="lg" variantColor="accent" />

      <Menu>
        <MenuButton
          as={ThumbnailMenuButton}
          noShadows={false}
          variant="solid"
        />
        <MenuList
          zIndex={10000}
          hasArrow
          css={css`
            top: 50px;
          `}
        >
          <PopoverArrow />
          <MenuItem>Edit...</MenuItem>
          <MenuDivider />
          <MenuItem>Select</MenuItem>
          <MenuItem>Move to folder</MenuItem>
          <MenuItem>Duplicate</MenuItem>
          <MenuItem>Rename</MenuItem>
          <MenuDivider />
          <MenuItem onClick={onDeleteClick}>
            <Icon name="small-close" size="20px" color="gray.500" mr="2" />
            Delete
          </MenuItem>
        </MenuList>
      </Menu>

      <Box cursor="pointer">
        <Link
          as={Urls.editor.edit(wordcloud.id)}
          href={Urls.editor._next}
          passHref
        >
          <div>
            <AspectRatioBox maxW="220px" ratio={4 / 3} overflow="hidden">
              <Image src={wordcloud.thumbnail} objectFit="contain" />
            </AspectRatioBox>
            <Text p="3" mb="0" fontSize="lg" fontWeight="semibold">
              {wordcloud.title}
            </Text>
          </div>
        </Link>
      </Box>
    </Box>
  )
}

const ThumbnailMenuButton = styled(MenuDotsButton)`
  /* background: #fff; */
`

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

export const DesignsView = observer(() => {
  const { wordcloudsStore: store } = useStore()
  const [query, setQuery] = useState('')

  return (
    <Box flex="3">
      <Box mt="4" mb="4" display="flex" alignItems="center">
        <Link href={Urls.editor._next} as={Urls.editor.create} passHref>
          <Button variantColor="accent" leftIcon="add" size="lg">
            Create New
          </Button>
        </Link>

        <Box ml="auto" maxWidth="300px">
          <SearchInput
            noBorder={false}
            onChange={setQuery}
            value={query}
            placeholder="Find..."
            size="lg"
          />
        </Box>
      </Box>

      {!store.hasFetchedWordclouds && 'Loading...'}
      {store.hasFetchedWordclouds && (
        <Box>
          {store.wordclouds.length === 0 && (
            <>
              <p>
                Welcome! Click the button below to create your first wordcloud.
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
          >
            {store.wordclouds.length > 0 &&
              store.wordclouds.map((wc) => (
                <WordcloudThumbnail
                  key={wc.id}
                  wordcloud={wc}
                  onDeleteClick={async () => {
                    store.delete(wc.id)
                  }}
                />
              ))}
          </Flex>
        </Box>
      )}
    </Box>
  )
})

export const FoldersView = observer(() => {
  const { wordcloudsStore: store } = useStore()

  const handleCreateFolder = () => {
    store.createFolder({ title: 'new folder' })
  }

  const deleteFolder = (folder: Folder) => {
    store.deleteFolder(folder.id)
  }

  return (
    <Box
      maxWidth="300px"
      minWidth="200px"
      mr="40px"
      flex="1"
      width="100%"
      css={css`
        position: relative;
        z-index: 2;
      `}
    >
      <FoldersList mr="4" mt="40px">
        <Text
          textTransform="uppercase"
          fontSize="sm"
          mb="4"
          fontWeight="semibold"
          color="gray.500"
        >
          Folders
        </Text>

        <FolderRow fontSize="lg" color="gray.700" py={2} px={3} isSelected>
          All Designs
        </FolderRow>

        {store.folders.map((f) => (
          <FolderRow fontSize="lg" color="gray.700" py={2} px={3} key={f.id}>
            {f.title}
            <Box ml="auto">
              <Menu>
                <MenuButton
                  as={ThumbnailMenuButton}
                  noShadows={false}
                  variant="solid"
                  size="sm"
                />
                <MenuList
                  zIndex={10000}
                  hasArrow
                  css={css`
                    top: 50px;
                  `}
                >
                  <MenuItem>Rename</MenuItem>
                  <MenuItem onClick={() => deleteFolder(f)}>Delete</MenuItem>
                  <PopoverArrow />
                </MenuList>
              </Menu>
            </Box>
          </FolderRow>
        ))}

        <Box mt="4">
          <Button
            variantColor="primary"
            width="140px"
            leftIcon="add"
            onClick={handleCreateFolder}
          >
            New Folder
          </Button>
        </Box>
      </FoldersList>
    </Box>
  )
})

export const FoldersList = styled(Box)`
  margin-left: 20px;
`

export const FolderRow = styled(Box)<{ isSelected?: boolean }>`
  display: flex;
  align-items: center;
  margin-left: -20px;
  padding-left: 20px;

  ${(p) => (p.isSelected ? `background: hsla(225, 0%, 95%, 1);` : '')}
  cursor: pointer;

  &:hover {
    background: hsla(225, 0%, 95%, 1);
  }
`
