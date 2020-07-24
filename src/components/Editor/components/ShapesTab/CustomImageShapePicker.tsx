import { Box, Flex, Heading, Stack, Text, Textarea } from '@chakra-ui/core'
import { css } from '@emotion/core'
import { FontPickerModal } from 'components/Editor/components/FontPicker/FontPickerModal'
import { ShapeThumbnailBtn } from 'components/Editor/components/ShapeSelector'
import {
  applyTransformToObj,
  createMultilineFabricTextGroup,
} from 'components/Editor/lib/fabric-utils'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'
import { Button } from 'components/shared/Button'
import { TextShapeColorPicker } from 'components/Editor/components/ShapeColorPicker'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { fabric } from 'fabric'
import { AnimatePresence, motion } from 'framer-motion'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { isEqual } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect, useState } from 'react'
import { BaseBtn } from 'components/shared/BaseBtn'
import { SelectedFontThumbnail } from 'components/Editor/components/FontPicker/components'
import { FaCog } from 'react-icons/fa'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce'
import { ResetShapeTransformButton } from './components'
import styled from '@emotion/styled'

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

export const CustomImageShapePicker: React.FC<{}> = observer(() => {
  const { editorPageStore: store } = useStore()
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()
  const [isShowingFontPicker, setIsShowingFontPicker] = useState(false)

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

  // Reset on unmount
  useEffect(() => {
    return () => {
      if (store.leftTabIsTransformingShape) {
        store.editor?.deselectShape()
      }
      initialState.mode = 'home'
    }
  }, [])

  const resetTransformBtn = <ResetShapeTransformButton />

  const updateTextThumbnailPreview = async () => {
    if (!shape || shape.kind !== 'text') {
      return
    }
    const fontInfo = store.getFontConfigById(store.shapesPanel.text.fontId)
    if (!fontInfo) {
      return
    }
    const font = await store.fetchFontById(fontInfo.style.fontId)
    if (!font) {
      return
    }

    const canvasSize = 400
    const pad = 10
    const fontSize = 100

    const canvas = createCanvas({ w: canvasSize, h: canvasSize })
    const c = new fabric.StaticCanvas(canvas)

    const text = store.shapesPanel.text.text
    const group = createMultilineFabricTextGroup(
      text,
      font,
      fontSize,
      store.shapesPanel.text.color
    )
    if (group.height! > group.width!) {
      group.scaleToHeight(canvasSize - 2 * pad)
    } else {
      group.scaleToWidth(canvasSize - 2 * pad)
    }
    group.setPositionByOrigin(
      new fabric.Point(canvasSize / 2, canvasSize / 2),
      'center',
      'center'
    )
    c.add(group)

    c.renderAll()
    state.thumbnailPreview = c.toDataURL()
    c.dispose()
  }

  useEffect(() => {
    if (shape && shape.kind === 'text') {
      updateTextThumbnailPreview()
    }
  }, [shape])

  const [updateThumbnailDebounced] = useDebouncedCallback(
    updateTextThumbnailPreview,
    300,
    {
      leading: false,
      trailing: true,
    }
  )

  if (!shape || shape.kind !== 'text') {
    return <></>
  }

  return (
    <>
      <Box>
        <>
          <Box display="flex" alignItems="flex-start" mb="3">
            {shape && (
              <CustomImageShapeThumbnail url={state.thumbnailPreview} />
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
              {state.mode === 'home' && (
                <motion.div
                  key="main"
                  transition={{ ease: 'easeInOut', duration: 0.2 }}
                  initial={{ x: -400, y: 0, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  exit={{ x: -400, y: 0, opacity: 0 }}
                >
                  <Stack
                    mb="4"
                    p="2"
                    position="absolute"
                    width="100%"
                    spacing="3"
                  >
                    <Box></Box>
                  </Stack>
                </motion.div>
              )}

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
            </AnimatePresence>
          </Box>
        </>
      </Box>
    </>
  )
})

const CustomImageShapeThumbnail = styled(ShapeThumbnailBtn)`
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
