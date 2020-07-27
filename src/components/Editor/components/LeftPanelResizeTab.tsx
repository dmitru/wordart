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
import { pageSizePresets } from 'components/Editor/editor-store'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { useEditorStore } from 'components/Editor/editor-store'
import { SectionLabel } from './shared'

export const LeftPanelResizeTab: React.FC<{
  children: React.ReactNode
}> = observer(({ children }) => {
  const { wordcloudsStore } = useStore()
  const store = useEditorStore()!

  return (
    <Box px="3" py="5">
      <SectionLabel>Page size</SectionLabel>

      <Box display="flex" flexWrap="wrap">
        {pageSizePresets.map((preset) => (
          <Button
            variant="outline"
            outline={
              store.pageSize.kind === 'preset' &&
              store.pageSize.preset.id === preset.id
                ? '3px solid hsl(358, 80%, 65%) !important'
                : undefined
            }
            mr="2"
            mb="3"
            key={preset.id}
            onClick={() => {
              store.setPageSize({ kind: 'preset', preset })
              store.animateVisualize(false)
            }}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            width="160px"
            minHeight="70px"
          >
            <Text fontSize="md">{preset.title}</Text>
            <Text my="0" fontSize="xs" color="gray.500">
              {preset.subtitle}
            </Text>
          </Button>
        ))}
        <Button
          variant="outline"
          outline={
            store.pageSize.kind === 'custom'
              ? '3px solid hsl(358, 80%, 65%) !important'
              : undefined
          }
          mr="2"
          mb="3"
          display="flex"
          flexDirection="column"
          justifyContent="center"
          width="160px"
          minHeight="70px"
          onClick={() => {
            store.setPageSize({
              kind: 'custom',
            })
          }}
        >
          <Text fontSize="md">Custom</Text>
          <Text my="0" fontSize="xs" color="gray.500">
            Choose your own
          </Text>
        </Button>
      </Box>

      {/* Custom aspect ratio input */}
      {store.pageSize.kind === 'custom' && (
        <>
          <Box mt="5">
            <SectionLabel>Custom aspect ratio</SectionLabel>
          </Box>

          <Stack
            spacing="2"
            mt="5"
            mb="4"
            direction="row"
            alignItems="flex-end"
          >
            <Box>
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
            </Box>

            <Button
              colorScheme="primary"
              onClick={() => {
                store.setPageSize({})
              }}
            >
              Update
            </Button>
          </Stack>
        </>
      )}

      {children}
    </Box>
  )
})
