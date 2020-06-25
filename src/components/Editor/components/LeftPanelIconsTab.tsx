import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { SectionLabel } from './shared'
import {
  ShapeThumbnails,
  ShapeThumbnailBtn,
  ShapeSelector,
} from 'components/Editor/components/ShapeSelector'
import { observable } from 'mobx'
import { uniqBy } from 'lodash'
import { TargetKind } from 'components/Editor/lib/editor'
import { Button, Box, Text } from '@chakra-ui/core'
import { Slider } from 'components/shared/Slider'

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
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const icons = style.items.icons.iconList

    const shapes = store.getAvailableShapes().filter((s) => s.kind === 'svg')

    return (
      <Box px="5" py="6">
        <SectionLabel>
          {state.isAdding ? 'Choose an Icon' : 'Added Icons'}
        </SectionLabel>

        <Toolbar display="flex" alignItems="center">
          {!state.isAdding && (
            <>
              <Button
                mr="3"
                flex="1"
                variantColor="primary"
                onClick={() => {
                  state.isAdding = true
                }}
              >
                <evaicons.PlusOutline size="20" /> Add
              </Button>
              {icons.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    style.items.icons.iconList = []
                    store.animateVisualize(false)
                  }}
                >
                  Clear
                </Button>
              )}
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
                store.animateVisualize(false)
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
                      store.animateVisualize(false)
                    }}
                    backgroundColor="white"
                    url={store.getShapeConfById(icon.shapeId)!.thumbnailUrl}
                  />
                ))}
              </ShapeThumbnails>
            </IconsList>

            {style.items.icons.iconList.length > 0 && (
              <Box mt="3.5rem">
                <SectionLabel>Icons Settings</SectionLabel>
                <Slider
                  horizontal
                  label="Size"
                  afterLabel="%"
                  value={style.items.placement.iconsMaxSize}
                  onChange={(value) => {
                    const val = (value as any) as number
                    style.items.placement.iconsMaxSize = val
                  }}
                  onAfterChange={() => {
                    store.animateVisualize(false)
                  }}
                  min={20}
                  max={100}
                  step={1}
                />
                <Slider
                  horizontal
                  label="Icons amount"
                  afterLabel="%"
                  value={style.items.placement.iconsProportion}
                  onChange={(value) => {
                    const val = (value as any) as number
                    style.items.placement.iconsProportion = val
                  }}
                  onAfterChange={() => {
                    store.animateVisualize(false)
                  }}
                  min={0}
                  max={100}
                  step={1}
                />
                <Text color="gray.500" fontSize="sm">
                  How many icons compared to words will be placed. E.g. 30%
                  means 30% icons, 70% words.
                </Text>
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }
)
