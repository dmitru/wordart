import { Box } from '@chakra-ui/core'
import { BlobShapePicker } from 'components/Editor/components/ShapesTab/BlobShapePicker'
import { ClipArtShapePicker } from 'components/Editor/components/ShapesTab/ClipArtShapePicker'
import { IconShapePicker } from 'components/Editor/components/ShapesTab/IconShapePicker'
import { ShapeTypeSelector } from 'components/Editor/components/ShapesTab/ShapeTypeSelector'
import { TextShapePicker } from 'components/Editor/components/ShapesTab/TextShapePicker'
import { CustomImageShapePicker } from 'components/Editor/components/ShapesTab/CustomImageShapePicker'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { FullCanvasShapePicker } from 'components/Editor/components/ShapesTab/FullCanvasShapePicker'
import css from '@emotion/css'
import { useEditorStore } from 'components/Editor/editor-store'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'

export const LeftPanelShapesTab: React.FC<{}> = observer(() => {
  const { shapesPanel: leftPanelShapesState } = useEditorStore()!
  return (
    <>
      <Box px="5" py="6">
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          mb="4"
          shadow="md"
          css={css`
            margin: -1.5rem -1.5rem 2rem;
            padding: 10px 1.5rem;
          `}
        >
          <Box mr="3" color="gray.600" display="flex" alignItems="center">
            Shape type:
          </Box>

          <ShapeTypeSelector />
          <HelpTooltipIcon
            label={`There are many different shape types to explore! E.g. you can use your own text or image as a shape, or fill the entire canvas.`}
            ml="3"
          />
        </Box>

        {leftPanelShapesState.shapeKind === 'image' && <ClipArtShapePicker />}
        {leftPanelShapesState.shapeKind === 'icon' && <IconShapePicker />}
        {leftPanelShapesState.shapeKind === 'text' && <TextShapePicker />}
        {leftPanelShapesState.shapeKind === 'blob' && <BlobShapePicker />}
        {leftPanelShapesState.shapeKind === 'custom image' && (
          <CustomImageShapePicker />
        )}
        {leftPanelShapesState.shapeKind === 'full-canvas' && (
          <FullCanvasShapePicker />
        )}
      </Box>
    </>
  )
})
