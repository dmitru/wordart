import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { useState, useCallback, useRef } from 'react'
import { Label } from './shared'
import { Button } from 'components/shared/Button'
import { Box } from 'components/shared/Box'
import { BaseBtn } from 'components/shared/BaseBtn'
import { TextInput } from 'components/shared/TextInput'
import {
  ShapeThumbnails,
  ShapeThumbnailBtn,
  ShapeSelector,
} from 'components/pages/EditorPage/components/ShapeSelector'
import { observable } from 'mobx'
import { uniqBy } from 'lodash'

export type LeftPanelIconsTabProps = {
  type: 'shape' | 'background'
}

const Toolbar = styled(Box)``

const IconsList = styled(Box)``

const WordRow = styled(Box)`
  width: 100%;
  padding: 4px 0;
  display: flex;
`

const state = observable({
  isAdding: false,
})

export const LeftPanelIconsTab: React.FC<LeftPanelIconsTabProps> = observer(
  (props) => {
    const { editorPageStore } = useStore()
    const style = props.type
      ? editorPageStore.shapeStyle
      : editorPageStore.backgroundStyle
    const icons = style.icons

    const shapes = editorPageStore
      .getAvailableShapes()
      .filter((s) => s.kind === 'svg')

    return (
      <>
        <Label>{state.isAdding ? 'Add Icon' : 'Icons'}</Label>
        <Toolbar mt={2} display="flex" alignItems="center">
          {!state.isAdding && (
            <>
              <Button
                px={2}
                py={1}
                mr={2}
                accent
                onClick={() => {
                  state.isAdding = true
                }}
              >
                <evaicons.PlusOutline size="20" /> Add
              </Button>
              <Button
                px={2}
                py={1}
                outline
                onClick={() => {
                  style.icons = []
                }}
              >
                Clear
              </Button>
            </>
          )}

          {state.isAdding && (
            <>
              <Button
                px={2}
                py={1}
                mr={2}
                accent
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
              style.icons = uniqBy(
                [...style.icons, { shapeId: shape.id }],
                'shapeId'
              )
              state.isAdding = false
            }}
          />
        )}

        {!state.isAdding && (
          <IconsList mt={2}>
            <ShapeThumbnails mt={2}>
              {icons.map((icon) => (
                <ShapeThumbnailBtn
                  key={icon.shapeId}
                  onClick={() => {
                    style.icons = style.icons.filter(
                      (i) => i.shapeId !== icon.shapeId
                    )
                  }}
                  backgroundColor="white"
                  shape={editorPageStore.getShapeById(icon.shapeId)!}
                />
              ))}
            </ShapeThumbnails>
          </IconsList>
        )}
      </>
    )
  }
)
