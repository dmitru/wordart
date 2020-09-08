import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuTransition,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Text,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import {
  pageSizePresets,
  PageSizeSettings,
} from 'components/Editor/page-size-presets'
import { observer } from 'mobx-react'
import React from 'react'

export type PageSizeValue = PageSizeSettings

export type PageSizePickerProps = {
  value: PageSizeValue
  onChange: (value: PageSizeValue) => void
  prefix?: string
}

export const PageSizePicker: React.FC<PageSizePickerProps> = observer(
  ({ value, onChange, prefix = 'Page size:' }) => {
    return (
      <>
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
                {value.preset?.title || 'Custom'}
              </Text>
              {/* <Text mb="0" color="gray.500" ml="4" fontWeight="normal">
            {value.preset?.subtitle || null}
          </Text> */}
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
                {/* <MenuItem
                  onClick={() => {
                    onChange({ ...value, preset: null })
                  }}
                >
                  <Box flexDirection="column">
                    <Box fontWeight="medium">Custom</Box>
                    <Box color="gray.500">Choose your own size!</Box>
                  </Box>
                </MenuItem> */}
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

        {!value.preset && (
          <>
            <Stack
              spacing="2"
              mt="5"
              mb="2rem"
              direction="row"
              alignItems="flex-end"
            >
              <Box>
                <Text mb="1">Width</Text>
                <NumberInput
                  step={1}
                  value={value.custom.width}
                  min={1}
                  max={8192}
                  onChange={(val) => {
                    value.custom.width = (val as any) as number
                  }}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              <Box>
                <Text mb="1">Height</Text>
                <NumberInput
                  step={1}
                  value={value.custom.height}
                  min={1}
                  max={8192}
                  onChange={(val) => {
                    value.custom.height = (val as any) as number
                  }}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            </Stack>
          </>
        )}
      </>
    )
  }
)
