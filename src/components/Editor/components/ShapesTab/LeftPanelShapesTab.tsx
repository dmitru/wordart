import { Box } from '@chakra-ui/core'
import { ClipArtShapePicker } from 'components/Editor/components/ShapesTab/ClipArtShapePicker'
import { IconShapePicker } from 'components/Editor/components/ShapesTab/IconShapePicker'
import { ShapeTypeSelector } from 'components/Editor/components/ShapesTab/ShapeTypeSelector'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'

export const LeftPanelShapesTab: React.FC<{}> = observer(() => {
  const {
    editorPageStore: { shapesPanel: leftPanelShapesState },
  } = useStore()
  return (
    <>
      <Box px="5" py="6">
        <Box mb="5">
          <ShapeTypeSelector />
        </Box>

        {leftPanelShapesState.shapeKind === 'image' && <ClipArtShapePicker />}
        {leftPanelShapesState.shapeKind === 'icon' && <IconShapePicker />}
      </Box>
    </>
  )
})
