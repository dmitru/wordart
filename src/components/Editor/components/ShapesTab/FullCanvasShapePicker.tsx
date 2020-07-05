import { Box, Text } from '@chakra-ui/core'
import { css } from '@emotion/core'
import { ShapeThumbnailBtn } from 'components/Editor/components/ShapeSelector'
import { applyTransformToObj } from 'components/Editor/lib/fabric-utils'
import { ShapeFullCanvasConf } from 'components/Editor/shape-config'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'
import { Button } from 'components/shared/Button'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { fabric } from 'fabric'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { isEqual } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce/lib'
import { FullCanvasShapeColorPicker } from 'components/Editor/components/ShapeColorpicker'

const initialState = {
  thumbnailPreview: '',
}

const state = observable<typeof initialState>({ ...initialState })

export type LeftPanelShapesTabProps = {}

const ShapeOpacitySlider = observer(({ style, onAfterChange }: any) => (
  <Slider
    label="Opacity"
    afterLabel="%"
    value={style.opacity}
    onChange={(value) => {
      style.opacity = value
    }}
    onAfterChange={onAfterChange}
    min={0}
    max={100}
    step={1}
  />
))

export const FullCanvasShapePicker: React.FC<{}> = observer(() => {
  const { editorPageStore: store } = useStore()
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

  const fonts = store.getAvailableFonts()

  const [updateShapeDebounced] = useDebouncedCallback(
    store.updateShapeFromSelectedShapeConf,
    300,
    {
      leading: false,
      trailing: true,
    }
  )

  const [updateShapeColoringDebounced] = useDebouncedCallback(
    async () => {
      if (!shape) {
        return
      }
      const style = mkShapeStyleConfFromOptions(shapeStyle)
      await store.editor?.updateShapeColors(shape.config, true)
      store.updateShapeThumbnail()
      if (style.items.coloring.kind === 'shape') {
        store.editor?.setShapeItemsStyle(style.items)
      }
    },
    20,
    {
      leading: true,
      trailing: true,
    }
  )

  useEffect(() => {
    return () => {
      if (store.leftTabIsTransformingShape) {
        store.editor?.deselectShape()
      }
    }
  }, [])

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

  const updateBlobThumbnailPreview = async () => {
    const shape = store.getShape()
    if (!shape || shape.kind !== 'full-canvas') {
      return
    }
    const canvasSize = 400

    const canvas = createCanvas({ w: canvasSize, h: canvasSize })
    const c = new fabric.StaticCanvas(canvas)
    c.backgroundColor = store.shapesPanel.fullCanvas.color
    c.renderAll()
    state.thumbnailPreview = c.toDataURL()
    c.dispose()
  }

  const updateFullCanvas = async () => {
    const shapeConfig: ShapeFullCanvasConf = {
      kind: 'full-canvas',
      color: store.shapesPanel.fullCanvas.color,
    }

    await store.selectShape(shapeConfig)
    updateBlobThumbnailPreview()

    store.animateVisualize(false)
  }

  useEffect(() => {
    if (shape && shape.kind === 'full-canvas') {
      updateBlobThumbnailPreview()
    }

    if (!shape || shape.kind !== 'full-canvas') {
      updateFullCanvas()
    }
  }, [shape])

  const [updateThumbnailDebounced] = useDebouncedCallback(
    updateBlobThumbnailPreview,
    300,
    {
      leading: false,
      trailing: true,
    }
  )

  if (!shape || shape.kind !== 'full-canvas') {
    return <></>
  }

  return (
    <>
      <Box>
        <>
          <Box display="flex" alignItems="flex-start" mb="3">
            {shape && (
              <ShapeThumbnailBtn
                css={css`
                  width: 180px;
                  height: 180px;
                  min-width: 180px;
                  cursor: default !important;

                  border: 2px solid #e9e9e9;

                  img {
                    position: relative;
                    z-index: 2;
                    width: 180px;
                    height: 180px;
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
                `}
                backgroundColor="white"
                url={state.thumbnailPreview}
              />
            )}
            <Box
              flex={1}
              ml="3"
              display="flex"
              flexDirection="column"
              alignItems="flex-start"
              justifyContent="space-between"
              height="120px"
            >
              <Box flex={1} width="100%" mb="2">
                <ShapeOpacitySlider
                  style={shapeStyle}
                  onAfterChange={(value: number) => {
                    store.editor?.setShapeOpacity(value / 100)
                  }}
                />
              </Box>

              <Box display="flex" alignItems="center" mb="5">
                <FullCanvasShapeColorPicker
                  shapeConf={shape.config}
                  onAfterChange={updateShapeColoringDebounced}
                  onChange={updateThumbnailDebounced}
                />
              </Box>
            </Box>
          </Box>
        </>
      </Box>
    </>
  )
})
