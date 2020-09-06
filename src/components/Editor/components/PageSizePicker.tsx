import {
  Box,
  Button,
  Menu,
  MenuButton,
  Portal,
  MenuDivider,
  Text,
  MenuItem,
  MenuList,
  MenuTransition,
  Stack,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import {
  pageSizePresets,
  PageSizeSettings,
} from 'components/Editor/page-size-presets'
import React from 'react'

export type PageSizeValue = PageSizeSettings

export type PageSizePickerProps = {
  value: PageSizeValue
  onChange: (value: PageSizeValue) => void
  prefix?: string
}

export const PageSizePicker: React.FC<PageSizePickerProps> = ({
  value,
  onChange,
  prefix = 'Page size:',
}) => {
  return (
    <Menu isLazy>
      <MenuButton
        as={Button}
        variant="outline"
        rightIcon={<ChevronDownIcon />}
        width="100%"
      >
        <Box display="flex" alignItems="center" flexDirection="row">
          <Text mb="0" mr="2">
            {prefix}
          </Text>
          <Text mb="0" fontWeight="normal">
            {value.preset?.title || 'custom'}
          </Text>
          <Text mb="0" color="gray.500" ml="4" fontWeight="normal">
            {value.preset?.subtitle || null}
          </Text>
        </Box>
      </MenuButton>

      <MenuTransition>
        {(styles) => (
          <MenuList
            // @ts-ignore
            css={css`
              ${styles}
              max-height: 400px;
              max-width: 300px;
              width: 100%;
              overflow: auto;
            `}
            zIndex={4}
          >
            {pageSizePresets.map((preset) => (
              <MenuItem
                key={preset.id}
                onClick={() => {
                  onChange({ ...value, preset })
                }}
              >
                <Box flexDirection="column">
                  <Box fontWeight="medium">{preset.title}</Box>
                  <Box color="gray.500">{preset.subtitle}</Box>
                </Box>
              </MenuItem>
            ))}
          </MenuList>
        )}
      </MenuTransition>
    </Menu>
  )
}
