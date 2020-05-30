import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { Label } from './shared'
import { Button } from 'components/shared/Button'
import { Box } from 'components/shared/Box'
import {
  ShapeThumbnails,
  ShapeThumbnailBtn,
  ShapeSelector,
} from 'components/Editor/components/ShapeSelector'
import { observable } from 'mobx'
import { uniqBy } from 'lodash'
import { TargetKind } from 'components/Editor/lib/editor'

export type LeftPanelIconsTabProps = {
  target: TargetKind
}

const Toolbar = styled(Box)``

const IconsList = styled(Box)``

const state = observable({
  isAdding: false,
})

export const LeftPanelIconsTab: React.FC<LeftPanelIconsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore } = useStore()
    const style = editorPageStore.styleOptions[target]
    const icons = style.icons.iconList

    const shapes = editorPageStore
      .getAvailableShapes()
      .filter((s) => s.kind === 'svg')

    return (
      <>
        <Toolbar display="flex" alignItems="center">
          <Label flex={1}>{state.isAdding ? 'Add Icon' : 'Icons'}</Label>
          {!state.isAdding && (
            <>
              <Button
                px="2"
                py="1"
                mt="2"
                primary
                onClick={() => {
                  state.isAdding = true
                }}
              >
                <evaicons.PlusOutline size="20" /> Add
              </Button>
              <Button
                px="2"
                py="1"
                outline
                onClick={() => {
                  style.icons.iconList = []
                }}
              >
                Clear
              </Button>
            </>
          )}

          {state.isAdding && (
            <>
              <Button
                px="2"
                py="1"
                mt="2"
                secondary
                onClick={() => {
                  state.isAdding = false
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Toolbar>

        {state.isAdding && (
          <ShapeSelector
            shapes={shapes}
            onSelected={(shape) => {
              style.icons.iconList = uniqBy(
                [...style.icons.iconList, { shapeId: shape.id }],
                'shapeId'
              )
              state.isAdding = false
            }}
          />
        )}

        {!state.isAdding && (
          <IconsList mt="2">
            <ShapeThumbnails mt="2">
              {icons.map((icon) => (
                <ShapeThumbnailBtn
                  key={icon.shapeId}
                  onClick={() => {
                    style.icons.iconList = style.icons.iconList.filter(
                      (i) => i.shapeId !== icon.shapeId
                    )
                  }}
                  backgroundColor="white"
                  shape={editorPageStore.getShapeConfById(icon.shapeId)!}
                />
              ))}
            </ShapeThumbnails>
          </IconsList>
        )}
      </>
    )
  }
)
