import { applyTransformToObj } from 'components/Editor/lib/fabric-utils'
import { Button } from 'components/shared/Button'
import { Tooltip } from 'components/shared/Tooltip'
import { isEqual } from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { useStore } from 'services/root-store'
import { SectionLabel } from '../shared'
import { Stack, Box, Text } from '@chakra-ui/core'
import styled from '@emotion/styled'
import { ShapeThumbnailBtn } from '../ShapeSelector'

export const ResetShapeTransformButton: React.FC<{}> = observer(() => {
  const { editorPageStore: store } = useStore()
  const shape = store.getShape()

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

  const resetTransformBtn =
    shape && !isEqual(shape.originalTransform, shape.transform) ? (
      <Tooltip
        label="Center shape and restore its original size"
        isDisabled={isEqual(shape.originalTransform, shape.transform)}
      >
        <Button
          ml="1"
          variant="outline"
          onClick={() => {
            store.editor?.clearItems('shape')
            store.editor?.clearItems('bg')
            applyTransformToObj(shape.obj, shape.originalTransform)
            shape.transform = [...shape.originalTransform] as MatrixSerialized
            store.editor?.canvas.requestRenderAll()
            store.renderKey++
          }}
        >
          Reset original
        </Button>
      </Tooltip>
    ) : null

  return resetTransformBtn
})

export const ShapeTransformLeftPanelSection: React.FC<{}> = observer(() => {
  const { editorPageStore: store } = useStore()
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

  if (!shape) {
    return <></>
  }

  return (
    <>
      <SectionLabel>Resize, rotate, transform</SectionLabel>
      {!store.leftTabIsTransformingShape && (
        <>
          <Stack direction="row" mt="3" spacing="3">
            <Button
              colorScheme="primary"
              onClick={() => {
                if (!store.editor) {
                  return
                }
                const totalItemsCount =
                  (store.editor.items.shape.items.length || 0) +
                  (store.editor.items.bg.items.length || 0)
                if (
                  totalItemsCount > 0 &&
                  !window.confirm(
                    'All unlocked words will be removed. Do you want to continue?'
                  )
                ) {
                  return
                }
                store.leftTabIsTransformingShape = true
                store.editor.selectShape()
              }}
            >
              Transform shape
            </Button>
            <ResetShapeTransformButton />
          </Stack>
        </>
      )}

      {store.leftTabIsTransformingShape && (
        <Box>
          <Text mt="2">Drag the shape to move or rotate it.</Text>
          <Stack direction="row" mt="3" spacing="2">
            <Button
              flex={1}
              colorScheme="accent"
              onClick={() => {
                store.leftTabIsTransformingShape = false
                store.editor?.deselectShape()
                store.editor?.clearItems('shape')
                store.editor?.clearItems('bg')
                store.animateVisualize(false)
              }}
            >
              Apply
            </Button>
            <ResetShapeTransformButton />
          </Stack>
        </Box>
      )}
    </>
  )
})

export const BigShapeThumbnail = styled(ShapeThumbnailBtn)`
  background: white;
  width: 180px;
  height: 180px;
  min-width: 180px;
  cursor: default !important;

  padding: 10px;
  border: 2px solid #e9e9e9;

  img {
    position: relative;
    z-index: 2;
    width: 165px;
    height: 165px;
  }

  &,
  &:hover,
  &:focus {
    background-image: url(/images/editor/transparent-bg.svg);
    background-repeat: repeat;
    background-size: 15px;
  }

  position: relative;

  &:after {
    position: absolute;
    content: '';
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1;
    background: white !important;
    opacity: 0.6;
  }
`
