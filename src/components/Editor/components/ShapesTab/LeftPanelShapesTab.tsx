import { Box } from '@chakra-ui/core'
import { ClipArtShapePicker } from 'components/Editor/components/ShapesTab/ClipArtShapePicker'
import { ShapeTypeSelector } from 'components/Editor/components/ShapesTab/ShapeTypeSelector'
import { leftPanelShapesState } from 'components/Editor/components/ShapesTab/state'
import { observer } from 'mobx-react'
import React from 'react'
import { IconShapePicker } from 'components/Editor/components/ShapesTab/IconShapePicker'

export const LeftPanelShapesTab: React.FC<{}> = observer(() => {
  return (
    <>
      <Box px="5" py="6">
        <Box mb="5">
          <ShapeTypeSelector />
        </Box>

        {leftPanelShapesState.shapeVariety === 'image' && (
          <ClipArtShapePicker />
        )}
        {leftPanelShapesState.shapeVariety === 'icon' && <IconShapePicker />}
      </Box>
    </>
  )
})
