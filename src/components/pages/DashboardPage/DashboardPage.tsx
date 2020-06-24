import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import {
  Box,
  Image,
  AspectRatioBox,
  Heading,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  PopoverArrow,
  Icon,
  Text,
  MenuDivider,
  Divider,
} from '@chakra-ui/core'
import 'lib/wordart/console-extensions'
import css from '@emotion/css'
import { observer } from 'mobx-react'
import React from 'react'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import { useStore } from 'services/root-store'
import { Wordcloud } from 'services/api/types'
import { Button, IconButton, Tooltip } from '@chakra-ui/core'
import Link from 'next/link'
import { Urls } from 'urls'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import styled from '@emotion/styled'

export type WordcloudThumbnailProps = {
  wordcloud: Wordcloud
  onDeleteClick: () => Promise<void>
}

export const WordcloudThumbnail: React.FC<WordcloudThumbnailProps> = ({
  wordcloud,
  onDeleteClick,
}) => {
  return (
    <Box
      p={4}
      maxWidth="220px"
      minWidth="220px"
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

          ${ThumbnailMenuButton} {
            opacity: 1;
          }
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
      <Menu>
        <MenuButton
          as={ThumbnailMenuButton}
          noShadows={false}
          variant="outline"
        />
        <MenuList
          hasArrow
          css={css`
            top: 50px;
          `}
        >
          <PopoverArrow />
          <MenuItem>
            <Icon name="folder" size="20px" color="gray.500" mr="2" />
            Move to folder...
          </MenuItem>
          <MenuItem onClick={() => {}}>
            <Icon name="check" size="20px" color="gray.500" mr="2" />
            Select
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={onDeleteClick}>
            <Icon name="small-close" size="20px" color="gray.500" mr="2" />
            Remove
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
            <Text mt="3" mb="0" fontSize="lg" fontWeight="semibold">
              {wordcloud.title}
            </Text>
          </div>
        </Link>
      </Box>
    </Box>
  )
}

const ThumbnailMenuButton = styled(MenuDotsButton)`
  background: #fff;
`

export const DashboardPage = observer(() => {
  const { wordcloudsStore } = useStore()

  return (
    <SiteLayout>
      <Box>
        <Heading size="lg" mb="4">
          Your Designs
        </Heading>

        <Box mb="4">
          <Link href={Urls.editor._next} as={Urls.editor.create} passHref>
            <Button variantColor="accent" leftIcon="add">
              Create New
            </Button>
          </Link>
        </Box>

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
                  <Button variantColor="accent">Create</Button>
                </Link>
              </>
            )}
            <Flex wrap="wrap">
              {wordcloudsStore.myWordclouds.length > 0 &&
                wordcloudsStore.myWordclouds.map((wc) => (
                  <WordcloudThumbnail
                    key={wc.id}
                    wordcloud={wc}
                    onDeleteClick={async () => {
                      wordcloudsStore.delete(wc.id)
                    }}
                  />
                ))}
            </Flex>
          </Box>
        )}
      </Box>
    </SiteLayout>
  )
})
