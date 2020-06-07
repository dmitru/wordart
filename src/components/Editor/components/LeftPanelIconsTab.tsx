import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { Label } from './shared'
import {
  ShapeThumbnails,
  ShapeThumbnailBtn,
  ShapeSelector,
} from 'components/Editor/components/ShapeSelector'
import { observable } from 'mobx'
import { uniqBy } from 'lodash'
import { TargetKind } from 'components/Editor/lib/editor'
import { Button, Box, Text } from '@chakra-ui/core'

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
    const icons = style.items.icons.iconList

    const shapes = editorPageStore
      .getAvailableShapes()
      .filter((s) => s.kind === 'svg')

    return (
      <>
        <Toolbar display="flex" alignItems="center">
          {!state.isAdding && (
            <>
              <Button
                mr="3"
                variantColor="green"
                onClick={() => {
                  state.isAdding = true
                }}
              >
                <evaicons.PlusOutline size="20" /> Add
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  style.items.icons.iconList = []
                }}
              >
                Clear
              </Button>
            </>
          )}

          {state.isAdding && (
            <>
              <Button
                leftIcon="chevron-left"
                onClick={() => {
                  state.isAdding = false
                }}
              >
                Back
              </Button>
            </>
          )}
        </Toolbar>

        {state.isAdding && (
          <Text fontSize="xl" mb="2" mt="5" flex={1}>
            Add Icon
          </Text>
        )}
        {!state.isAdding && icons.length === 0 && (
          <Text fontSize="lg" mb="2" mt="5" flex={1}>
            You haven't added icons yet.
          </Text>
        )}

        {state.isAdding && (
          <>
            <ShapeSelector
              shapes={shapes}
              onSelected={(shape) => {
                style.items.icons.iconList = uniqBy(
                  [...style.items.icons.iconList, { shapeId: shape.id }],
                  'shapeId'
                )
                state.isAdding = false
              }}
            />
          </>
        )}
        {!state.isAdding && icons.length > 0 && (
          <>
            <Text mb="3" mt="2" fontSize="sm" color="gray.500">
              Hint: click on icon to remove it.
            </Text>
            <IconsList mt="2">
              <ShapeThumbnails mt="2">
                {icons.map((icon) => (
                  <ShapeThumbnailBtn
                    key={icon.shapeId}
                    onClick={() => {
                      style.items.icons.iconList = style.items.icons.iconList.filter(
                        (i) => i.shapeId !== icon.shapeId
                      )
                    }}
                    backgroundColor="white"
                    url={
                      editorPageStore.getShapeConfById(icon.shapeId)!
                        .thumbnailUrl
                    }
                  />
                ))}
              </ShapeThumbnails>
            </IconsList>
          </>
        )}
      </>
    )
  }
)
