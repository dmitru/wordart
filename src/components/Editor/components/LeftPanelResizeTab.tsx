import {
  Box,
  Button,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Text,
} from '@chakra-ui/core'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { useEditorStore } from 'components/Editor/editor-store'
import { SectionLabel } from './shared'
import { PageSizePicker } from 'components/Editor/components/PageSizePicker'

export const LeftPanelResizeTab: React.FC<{
  children: React.ReactNode
}> = observer(({ children }) => {
  const store = useEditorStore()!

  return (
    <Box px="3" py="5">
      <SectionLabel>Resize page</SectionLabel>

      <Box display="flex" flexWrap="wrap" mb="5">
        <PageSizePicker
          prefix=""
          value={store.pageSize}
          onChange={(pageSize) => {
            store.setPageSize(pageSize, true)
          }}
        />
      </Box>

      {/* Custom aspect ratio input */}
      {!store.pageSize.preset && (
        <>
          <Stack
            spacing="2"
            mt="5"
            mb="2rem"
            direction="row"
            alignItems="flex-end"
          >
            {/* <Box>
              <Text mb="1">Width</Text>
              <NumberInput
                step={1}
                value={store.pageSize.custom.width}
                min={1}
                max={8192}
                onChange={(value) => {
                  store.pageSize.custom.width = (value as any) as number
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
                value={store.pageSize.custom.height}
                min={1}
                max={8192}
                onChange={(value) => {
                  store.pageSize.custom.height = (value as any) as number
                }}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box> */}

            {/* <Button
              colorScheme="primary"
              onClick={() => {
                store.setPageSize()
              }}
            >
              Apply
            </Button> */}
          </Stack>
        </>
      )}

      {children}
    </Box>
  )
})
