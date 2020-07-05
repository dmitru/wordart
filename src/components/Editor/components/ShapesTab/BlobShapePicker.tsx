import {
  Box,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import chroma from 'chroma-js'
import { fabric } from 'fabric'
import {
  ShapeSelector,
  ShapeThumbnailBtn,
} from 'components/Editor/components/ShapeSelector'
import {
  applyTransformToObj,
  createMultilineFabricTextGroup,
  loadObjFromSvgString,
} from 'components/Editor/lib/fabric-utils'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'
import { Button } from 'components/shared/Button'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { SearchInput } from 'components/shared/SearchInput'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { AnimatePresence, motion } from 'framer-motion'
import { isEqual } from 'lodash'
import { observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect, useState, useMemo } from 'react'
import { FaCog } from 'react-icons/fa'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce/lib'
import { iconsCategories } from 'data/icon-categories'
import { useDebounce } from 'use-debounce'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { SectionLabel } from 'components/Editor/components/shared'
import { FontPicker } from 'components/Editor/components/FontPicker'
import { ShapeRandomBlobConf } from 'components/Editor/shape-config'
import { generateBlobShapePathData } from 'components/Editor/lib/blob-shape-gen'
import { BlobShapeColorPicker } from 'components/Editor/components/ShapeColorpicker'

type TabMode = 'home' | 'customize shape'
const initialState = {
  mode: 'home' as TabMode,
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

export const BlobShapePicker: React.FC<{}> = observer(() => {
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
      initialState.mode = 'home'
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

  const updateBlobShape = async () => {
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

    await store.selectShape(shapeConfig)
    updateBlobThumbnailPreview()

    store.animateVisualize(false)
  }

  useEffect(() => {
    if (shape && shape.kind === 'blob') {
      updateBlobThumbnailPreview()
    }

    if (!shape || shape.kind !== 'blob') {
      updateBlobShape()
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
            {shape && (
              <ShapeThumbnailBtn
                css={css`
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
                <BlobShapeColorPicker
                  shapeConf={shape.config}
                  onAfterChange={updateShapeColoringDebounced}
                  onChange={updateThumbnailDebounced}
                />
              </Box>

              <Flex width="100%">
                {state.mode === 'home' && (
                  <Button
                    variant="outline"
                    display="flex"
                    flex="1"
                    onClick={() => {
                      state.mode = 'customize shape'
                    }}
                  >
                    <FaCog style={{ marginRight: '5px' }} />
                    Customize
                  </Button>
                )}

                {state.mode === 'customize shape' && (
                  <Button
                    flex="1"
                    colorScheme="accent"
                    onClick={() => {
                      state.mode = 'home'
                      if (store.leftTabIsTransformingShape) {
                        store.leftTabIsTransformingShape = false
                        store.editor?.deselectShape()
                      }
                    }}
                  >
                    Done
                  </Button>
                )}
              </Flex>
            </Box>
          </Box>

          <Box position="relative" width="100%" height="calc(100vh - 350px)">
            <AnimatePresence initial={false}>
              {shape && state.mode === 'customize shape' && (
                <motion.div
                  key="customize"
                  initial={{ x: 355, y: 0, opacity: 0 }}
                  transition={{ ease: 'easeInOut', duration: 0.2 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  exit={{ x: 355, y: 0, opacity: 0 }}
                >
                  <Stack mb="4" p="2" position="absolute" width="100%">
                    <Box mt="6">
                      <Heading size="md" m="0" display="flex">
                        Resize, rotate, transform
                      </Heading>
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
                            {resetTransformBtn}
                          </Stack>
                        </>
                      )}

                      {store.leftTabIsTransformingShape && (
                        <Box>
                          <Text mt="2">
                            Drag the shape to move or rotate it.
                          </Text>
                          <Stack direction="row" mt="3" spacing="2">
                            <Button
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
                            {resetTransformBtn}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </motion.div>
              )}

              {state.mode === 'home' && (
                <motion.div
                  key="main"
                  transition={{ ease: 'easeInOut', duration: 0.2 }}
                  initial={{ x: -400, y: 0, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  exit={{ x: -400, y: 0, opacity: 0 }}
                >
                  <Stack mb="4" p="2" mt="6" position="absolute" width="100%">
                    <Box>
                      <Slider
                        label="Complexity"
                        afterLabel="%"
                        value={store.shapesPanel.blob.complexity}
                        onChange={(value) => {
                          store.shapesPanel.blob.complexity = value
                          updateThumbnailDebounced()
                        }}
                        resetValue={20}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </Box>

                    <Box mb="1.5rem">
                      <Slider
                        label="Points"
                        value={store.shapesPanel.blob.points}
                        onChange={(value) => {
                          store.shapesPanel.blob.points = value
                          updateThumbnailDebounced()
                        }}
                        resetValue={5}
                        onAfterChange={updateShapeDebounced}
                        min={3}
                        max={16}
                        step={1}
                      />
                    </Box>

                    <Button colorScheme="secondary" onClick={updateBlobShape}>
                      Randomize shape
                    </Button>
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </>
      </Box>
    </>
  )
})
