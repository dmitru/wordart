import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { useCallback } from 'react'
import { ShapeSelector } from 'components/pages/EditorPage/components/ShapeSelector'
import { observable } from 'mobx'
import { Modal } from 'components/shared/Modal'
import { Slider } from 'components/shared/Slider'
import { Box } from 'components/shared/Box'
import { css } from '@emotion/react'

export type LeftPanelShapesTabProps = {}

const state = observable({
  showCustomize: true,
})

export const LeftPanelShapesTab: React.FC<LeftPanelShapesTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    const shapeStyle = editorPageStore.shapeStyle

    const visualize = useCallback(() => {
      editorPageStore.editor?.generateItems('shape')
    }, [])

    return (
      <>
        <ShapeSelector
          shapes={editorPageStore.getAvailableShapes()}
          onSelected={(shape) => {
            if (shape.id === editorPageStore.selectedShapeId) {
              // open customize modal
              state.showCustomize = true
            } else {
              editorPageStore.selectShape(shape.id).then(visualize)
            }
          }}
          selectedShapeId={editorPageStore.getSelectedShape().id}
        />

        <Modal
          isOpen={state.showCustomize}
          onRequestClose={() => {
            state.showCustomize = false
          }}
        >
          <Box
            css={css`
              min-width: 300px;
            `}
          >
            <Slider
              label="Edges"
              min={0}
              max={100}
              step={1}
              value={shapeStyle.processing.edges.amount}
              onAfterChange={(value) => {
                shapeStyle.processing.edges.amount = value
                visualize()
              }}
            />
          </Box>
        </Modal>
      </>
    )
  }
)
