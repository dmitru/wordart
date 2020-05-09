import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { useCallback } from 'react'
import { ShapeSelector } from 'components/pages/EditorPage/components/ShapeSelector'

export type LeftPanelShapesTabProps = {}

export const LeftPanelShapesTab: React.FC<LeftPanelShapesTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()

    const visualize = useCallback(() => {
      editorPageStore.editor?.generateItems('shape')
    }, [])

    return (
      <>
        <ShapeSelector
          shapes={editorPageStore.getAvailableShapes()}
          onSelected={(shape) => {
            editorPageStore.selectShape(shape.id)
            visualize()
          }}
          selectedShapeId={editorPageStore.getSelectedShape().id}
        />
      </>
    )
  }
)
