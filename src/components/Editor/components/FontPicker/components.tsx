import {
  Badge,
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
} from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { FontPicker } from 'components/Editor/components/FontPicker/FontPicker'
import { SectionLabel } from 'components/Editor/components/shared'
import { BaseBtn } from 'components/shared/BaseBtn'
import { Button } from 'components/shared/Button'
import { FontConfig, FontStyleConfig } from 'data/fonts'
import { sortBy, capitalize } from 'lodash'
import { observer, useLocalStore } from 'mobx-react'
import { useEffect, useMemo } from 'react'
import { useStore } from 'services/root-store'
import { animateElement } from 'utils/animation'
import { ChevronDownIcon } from '@chakra-ui/icons'

export type FontListButtonProps = {
  title: string
  thumbnail: string
  isCustom?: boolean
  isSelected?: boolean
  containerProps?: React.HTMLAttributes<HTMLDivElement>
}

export const FontListButton: React.FC<FontListButtonProps> = ({
  title,
  isCustom,
  isSelected,
  thumbnail,
  containerProps = {},
}) => {
  return (
    <FontButtonContainer
      aria-label={`Font ${title}`}
      selected={isSelected}
      {...containerProps}
    >
      <FontButton>
        <img src={thumbnail} />
        {isCustom && (
          <Badge mr="2" ml="auto" colorScheme="purple">
            custom
          </Badge>
        )}
      </FontButton>
    </FontButtonContainer>
  )
}

export const Toolbar = styled(Box)``

export const FontDeleteButton = styled(IconButton)``

export const FontButton = styled(BaseBtn)`
  border: none;
  flex: 1;
  display: inline-flex;
  align-items: center;
  height: 38px;

  img {
    max-width: 100%;
    height: 30px;
    margin: 0;
    object-fit: contain;
  }
`

export const SelectedFontThumbnail = styled(Box)`
  border: none;
  flex: 1;
  display: block;
  align-items: center;
  width: 100%;

  border-radius: 4px;
  box-shadow: 0 0 4px 0 #0004;

  img {
    max-width: 270px;
    height: 50px;
    margin: 0;
    object-fit: contain;
  }
`

export const FontButtonContainer = styled(Box)<{
  theme: any
  selected?: boolean
}>`
  ${FontDeleteButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  transition: 0.1s background;

  ${(p) => (p.selected ? `background: ${p.theme.colors.blue['100']};` : '')}

  &:hover {
    background: ${(p) =>
      p.selected
        ? `${p.theme.colors.blue['50']}`
        : p.theme.colors.blackAlpha['50']};
    ${FontDeleteButton} {
      opacity: 1;
    }
  }
`
FontButtonContainer.defaultProps = {
  display: 'flex',
  alignItems: 'center',
}
