import { Box, Button, Stack } from '@chakra-ui/core'
import { BlobShapeColorPicker } from 'components/Editor/components/ShapeColorPicker'
import { generateBlobShapePathData } from 'components/Editor/lib/blob-shape-gen'
import { ShapeRandomBlobConf } from 'components/Editor/shape-config'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'
import { Slider } from 'components/shared/Slider'
import { fabric } from 'fabric'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce/lib'
import { SectionLabel } from '../shared'
import { BigShapeThumbnail, ShapeTransformLeftPanelSection } from './components'
import css from '@emotion/css'
import { FiRefreshCw } from 'react-icons/fi'
import { useEditorStore } from 'components/Editor/editor-store'

type TabMode = 'home' | 'customize shape'
const initialState = {
  mode: 'home' as TabMode,
  thumbnailPreview: '',
  isUpdatingBlobShape: false,
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

export const BlobShapePicker: React.FC<{}> = observer(() => {
  const store = useEditorStore()!
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

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
      initialState.mode = 'home'
    }
  }, [])

  const updateBlobThumbnailPreview = async () => {
    const shape = store.getShape()
    if (!shape || shape.kind !== 'blob') {
      return
    }
    const canvasSize = 400
    const pad = 10

    const canvas = createCanvas({ w: canvasSize, h: canvasSize })
    const c = new fabric.StaticCanvas(canvas)

    const shapeObj = new fabric.Path(shape.config.pathData)
    c.add(shapeObj)
    shapeObj.set({ fill: store.shapesPanel.blob.color })

    if (shapeObj.height! > shapeObj.width!) {
      shapeObj.scaleToHeight(canvasSize - 2 * pad)
    } else {
      shapeObj.scaleToWidth(canvasSize - 2 * pad)
    }
    shapeObj.setPositionByOrigin(
      new fabric.Point(canvasSize / 2, canvasSize / 2),
      'center',
      'center'
    )

    c.renderAll()
    state.thumbnailPreview = c.toDataURL()
    c.dispose()
  }

  const updateBlobShape = async (saveUndoFrame = true) => {
    state.isUpdatingBlobShape = true
    const blobShapeSvg = generateBlobShapePathData({
      color: store.shapesPanel.blob.color,
      points: store.shapesPanel.blob.points,
      complexity: store.shapesPanel.blob.complexity,
      aspect: store.editor?.aspectRatio || 1,
    })

    const shapeConfig: ShapeRandomBlobConf = {
      kind: 'blob',
      color: store.shapesPanel.blob.color,
      points: store.shapesPanel.blob.points,
      complexity: store.shapesPanel.blob.complexity,
      pathData: blobShapeSvg,
    }

    if (saveUndoFrame) {
      await store.selectShapeAndSaveUndo(shapeConfig)
    } else {
      await store.selectShape(shapeConfig)
    }
    updateBlobThumbnailPreview()

    state.isUpdatingBlobShape = false
    store.animateVisualize(false)
  }

  useEffect(() => {
    if (shape && shape.kind === 'blob') {
      updateBlobThumbnailPreview()
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

  if (!shape || shape.kind !== 'blob') {
    return <></>
  }

  return (
    <>
      <Box>
        <>
          <Box display="flex" alignItems="flex-start" mb="3">
            <BigShapeThumbnail
              url={state.thumbnailPreview}
              bg={
                store.styleOptions.bg.fill.kind === 'color' &&
                store.styleOptions.bg.fill.color.opacity > 0
                  ? store.styleOptions.bg.fill.color.color
                  : 'transparent'
              }
            />

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

              <Box display="flex" alignItems="center" mt="3">
                <BlobShapeColorPicker
                  shapeConf={shape.config}
                  onAfterChange={updateShapeColoringDebounced}
                  onChange={updateThumbnailDebounced}
                />
              </Box>
            </Box>
          </Box>

          <Box
            mt="5"
            mx="-5"
            px="5"
            css={css`
              overflow: auto;
              height: calc(100vh - 340px);
            `}
          >
            <SectionLabel>Customize Shape</SectionLabel>
            <Stack mb="4" p="2" mt="6">
              <Box>
                <Slider
                  label="Complexity"
                  afterLabel="%"
                  value={store.shapesPanel.blob.complexity}
                  onChange={(value) => {
                    store.shapesPanel.blob.complexity = value
                    updateThumbnailDebounced()
                  }}
                  onAfterChange={() => updateBlobShape()}
                  resetValue={70}
                  min={0}
                  max={100}
                  step={1}
                />
              </Box>

              <Box mb="1rem">
                <Slider
                  label="Points"
                  value={store.shapesPanel.blob.points}
                  onChange={(value) => {
                    store.shapesPanel.blob.points = value
                    updateThumbnailDebounced()
                  }}
                  resetValue={5}
                  onAfterChange={() => updateBlobShape()}
                  min={3}
                  max={10}
                  step={1}
                />
              </Box>

              <Button
                onClick={() => updateBlobShape()}
                isDisabled={state.isUpdatingBlobShape}
                isLoading={state.isUpdatingBlobShape}
                leftIcon={<FiRefreshCw />}
              >
                Randomize
              </Button>
            </Stack>

            <Box mt="6" mb="2rem">
              <ShapeTransformLeftPanelSection />
            </Box>
          </Box>
        </>
      </Box>
    </>
  )
})
