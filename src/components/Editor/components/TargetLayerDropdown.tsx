import { Box, Button, Stack } from '@chakra-ui/core'
import { useEditorStore } from 'components/Editor/editor-store'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { observer } from 'mobx-react'
import React from 'react'
import { BsLayersHalf } from 'react-icons/bs'

export const LeftPanelTargetLayerDropdown = () => (
  <Box mb="6" display="flex" flexDirection="row" alignItems="center">
    <Box mr="3" color="gray.600" display="flex" alignItems="center">
      <Box as="span" mr="1">
        <BsLayersHalf />
      </Box>
      Layer:
    </Box>
    <TargetLayerSelector />
    <HelpTooltipIcon
      label={`You can place words and icons on 2 layers: Shape layer and Background layer. When you click "Visualize", both layers will update!`}
      ml="3"
    />
  </Box>
)

export const TargetLayerSelector = observer(() => {
  const store = useEditorStore()!

  return (
    <Stack direction="row" spacing="0">
      <Button
        variant={store.targetTab === 'shape' ? 'solid' : 'ghost'}
        onClick={() => {
          store.targetTab = 'shape'
        }}
      >
        Shape
      </Button>
      <Button
        variant={store.targetTab === 'bg' ? 'solid' : 'ghost'}
        onClick={() => {
          store.targetTab = 'bg'
        }}
      >
        Background
      </Button>
    </Stack>
  )
})
