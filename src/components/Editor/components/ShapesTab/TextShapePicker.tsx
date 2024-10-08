import { Box, Stack, Text } from '@chakra-ui/core'
import { css } from '@emotion/core'
import { SelectedFontThumbnail } from 'components/Editor/components/FontPicker/components'
import { FontPickerModal } from 'components/Editor/components/FontPicker/FontPickerModal'
import { TextShapeColorPicker } from 'components/Editor/components/ShapeColorPicker'
import { createMultilineFabricTextGroup } from 'components/Editor/lib/fabric-utils'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'
import { BaseBtn } from 'components/shared/BaseBtn'
import { EditableTextarea } from 'components/shared/EditableTextarea'
import { Slider } from 'components/shared/Slider'
import { fabric } from 'fabric'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce'
import { BigShapeThumbnail, ShapeTransformLeftPanelSection } from './components'
import { useEditorStore } from 'components/Editor/editor-store'

type TabMode = 'home' | 'customize shape'
const initialState = {
  mode: 'home' as TabMode,
  thumbnailPreview: '',
  previewText: '',
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
  const store = useEditorStore()!
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()
  const [isShowingFontPicker, setIsShowingFontPicker] = useState(false)

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

  useEffect(() => {
    state.previewText = store.shapesPanel.text.text
  }, [])

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

    const text = state.previewText

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
              <BigShapeThumbnail
                url={state.thumbnailPreview}
                bg={
                  store.styleOptions.bg.fill.kind === 'color' &&
                  store.styleOptions.bg.fill.color.opacity > 0
                    ? store.styleOptions.bg.fill.color.color
                    : 'transparent'
                }
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

              <Box mb="5">
                <TextShapeColorPicker
                  shapeConf={shape.config}
                  onAfterChange={updateShapeColoringDebounced}
                  onChange={updateThumbnailDebounced}
                  placement="right"
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
                <Box>
                  <Text fontWeight="semibold" color="gray.500">
                    Font
                  </Text>
                  <Box>
                    <BaseBtn
                      onClick={() => {
                        setIsShowingFontPicker(true)
                      }}
                      // @ts-ignore
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

                <Box mt="5">
                  <Text fontWeight="semibold" color="gray.500" mb="2">
                    Text
                  </Text>

                  <EditableTextarea
                    mb="3"
                    value={store.shapesPanel.text.text}
                    onSave={async (value) => {
                      store.shapesPanel.text.text = value

                      const shape = store.getShape()
                      if (!shape || shape.kind !== 'text') {
                        return
                      }

                      state.previewText = value
                      updateThumbnailDebounced()

                      store.selectShapeAndSaveUndo({
                        ...shape.config,
                        text: value,
                      })
                    }}
                    onEdit={(value) => {
                      state.previewText = value
                      updateThumbnailDebounced()
                    }}
                    onSaveCancel={(value) => {
                      state.previewText = value
                      updateThumbnailDebounced()
                    }}
                    textareaProps={{
                      autoFocus: true,
                      placeholder: 'Type your text here...',
                    }}
                  />
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
                  store.selectShapeAndSaveUndo({
                    ...shape.config,
                    textStyle: {
                      ...shape.config.textStyle,
                      fontId: style.fontId,
                    },
                  })

                  updateTextThumbnailPreview()
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
