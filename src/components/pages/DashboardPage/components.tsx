import {
  AspectRatioBox,
  Box,
  Checkbox,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuList,
  PopoverArrow,
  Tag,
  Text,
} from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { MenuItemWithIcon } from 'components/shared/MenuItemWithIcon'
import 'lib/wordart/console-extensions'
import { observer } from 'mobx-react'
import React from 'react'
import {
  FaChevronRight,
  FaPencilAlt,
  FaRegCheckSquare,
  FaRegCopy,
  FaRegFolder,
  FaTimes,
} from 'react-icons/fa'
import { Wordcloud } from 'services/api/types'
import { Urls } from 'urls'

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
  onClick: (e: React.MouseEvent) => void
  isSelected: boolean
  onSelectionChange: (isSelected: boolean) => void
  wordcloud: Wordcloud
  onMoveToFolder: () => void
  onDuplicate: () => void
  onRename: () => void
  onOpenInEditor: () => void
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
  onOpenInEditor,
  onRename,
  onDuplicate,
}) => {
  const content = (
    <div>
      <AspectRatioBox
        borderRadius="8px"
        borderBottomLeftRadius="0"
        borderBottomRightRadius="0"
        maxW="220px"
        ratio={4 / 3}
        overflow="hidden"
        border="none"
      >
        <Image src={wordcloud.thumbnail} objectFit="contain" css={css`&,`} />
      </AspectRatioBox>
      <Text
        p="3"
        mb="0"
        fontSize="lg"
        fontWeight="semibold"
        background={isSelected ? '#ffdedf' : 'white'}
      >
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
      borderRadius="8px"
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
            border-radius: 8px;
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
          onOpenInEditor={onOpenInEditor}
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
  onOpenInEditor: () => void
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

          <MenuItemWithIcon
            icon={<FaChevronRight />}
            fontWeight="semibold"
            onClick={props.onOpenInEditor}
          >
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

export const ThumbnailMenuButton = styled(MenuDotsButton)`
  /* background: #fff; */
`

export const FoldersList = styled(Box)``

export const FolderMenuButton = styled(MenuDotsButton)``

export const FolderRowTag = styled(Tag)`
  transition: all 0;
  background: ${(p) => p.theme.colors.primary['50']};
  color: ${(p) => p.theme.colors.gray['600']};
`

export const FolderRow = styled(Box)<{
  isSelected?: boolean
  hideCountOnHover?: boolean
}>`
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
      ${(p) => p.hideCountOnHover && 'opacity: 0;'}
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
