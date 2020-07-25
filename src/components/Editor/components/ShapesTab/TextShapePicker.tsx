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
import { ShapeTransformLeftPanelSection } from './components'

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

export const TextShapePicker: React.FC<{}> = observer(() => {
  const { editorPageStore: store } = useStore()
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()
  const [isShowingFontPicker, setIsShowingFontPicker] = useState(false)

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

  const [updateShapeDebounced] = useDebouncedCallback(() => {
    store.updateShapeFromSelectedShapeConf()
  }, 300)

  const [updateShapeColoringDebounced] = useDebouncedCallback(async () => {
    const shape = store.getShape()
    if (!shape) {
      return
    }
    const shapeStyle = store.styleOptions.shape
    const style = mkShapeStyleConfFromOptions(shapeStyle)
    await store.editor?.updateShapeColors(shape.config, true)
    store.updateShapeThumbnail()
    if (style.items.coloring.kind === 'shape') {
      store.editor?.setShapeItemsStyle(style.items)
    }
  }, 20)

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
            <Stack mb="4" p="2" width="100%" spacing="3">
              <Box>
                <Text fontWeight="semibold" color="gray.500">
                  Text
                </Text>

                <Textarea
                  mb="3"
                  autoFocus
                  value={store.shapesPanel.text.text}
                  onChange={async (e: any) => {
                    const text = e.target.value
                    store.shapesPanel.text.text = text

                    const shape = store.getShape()
                    if (!shape || shape.kind !== 'text') {
                      return
                    }

                    shape.config.text = text
                    updateShapeDebounced()
                    updateThumbnailDebounced()
                  }}
                  placeholder="Type text here..."
                />
              </Box>

              <Box display="flex" alignItems="center" mb="5">
                <TextShapeColorPicker
                  shapeConf={shape.config}
                  onAfterChange={updateShapeColoringDebounced}
                  onChange={updateThumbnailDebounced}
                  placement="right"
                />
              </Box>

              <Box>
                <Text fontWeight="semibold" color="gray.500">
                  Font
                </Text>
                <Box>
                  <BaseBtn
                    onClick={() => {
                      setIsShowingFontPicker(true)
                    }}
                    as={SelectedFontThumbnail}
                    mb="0"
                    p="3"
                  >
                    <img
                      src={
                        store.getFontConfigById(store.shapesPanel.text.fontId)
                          ?.style.thumbnail
                      }
                    />
                  </BaseBtn>
                </Box>
              </Box>

              <FontPickerModal
                isOpen={isShowingFontPicker}
                onClose={() => setIsShowingFontPicker(false)}
                selectedFontId={store.shapesPanel.text.fontId}
                onSubmit={async (font, style) => {
                  store.shapesPanel.text.fontId = style.fontId
                  const shape = store.getShape()
                  if (!shape || shape.kind !== 'text') {
                    return
                  }
                  shape.config.textStyle.fontId = style.fontId
                  updateTextThumbnailPreview()
                  store.updateShapeFromSelectedShapeConf()
                  setIsShowingFontPicker(false)
                }}
              />
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
