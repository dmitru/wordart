import { Box, Button, Stack } from '@chakra-ui/core'
import css from '@emotion/css'
import { Slider } from 'components/shared/Slider'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import { BigShapeThumbnail, ShapeTransformLeftPanelSection } from './components'
import { CustomizeRasterImageModal } from './CustomImages/CustomizeRasterImageModal'
import { AddCustomImageModal } from './CustomImages/AddCustomImageModal'
import { FaSlidersH, FaUpload } from 'react-icons/fa'
import { ShapeCustomImageRasterConf } from 'components/Editor/shape-config'
import { useEditorStore } from 'components/Editor/editor-store'
import { loadImageUrlToCanvasCtx } from 'lib/wordart/canvas-utils'
import { useDebouncedCallback } from 'use-debounce/lib'
import { CustomRasterShapeColorPicker } from 'components/Editor/components/ShapeColorPicker'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'

const initialState = {
  isShowingUploadModal: false,
  isShowingCustomizeImage: false,
  thumbnailPreview: '',
}

const state = observable<typeof initialState>({ ...initialState })

let lastShapeConfig: ShapeCustomImageRasterConf | undefined

export type LeftPanelShapesTabProps = {}

export const CustomImageShapePicker: React.FC<{}> = observer(() => {
  const store = useEditorStore()!
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

  useEffect(() => {
    if (shape && shape.kind === 'clipart:raster') {
      state.thumbnailPreview = shape.config.url
      // state.thumbnailPreview = shape.config.processedThumbnailUrl
    }
  }, [shape])

  useEffect(() => {
    if (lastShapeConfig && (!shape || shape.kind !== lastShapeConfig.kind)) {
      store.selectShapeAndSaveUndo(lastShapeConfig)
    } else if (!lastShapeConfig && shape?.kind === 'custom:raster') {
      lastShapeConfig = shape.config
    }
  }, [])

  // Reset on unmount
  useEffect(() => {
    return () => {
      if (store.leftTabIsTransformingShape) {
        store.editor?.deselectShape()
      }
    }
  }, [])

  const [updateShapeColoringDebounced] = useDebouncedCallback(
    async () => {
      if (!shape) {
        return
      }
      const style = mkShapeStyleConfFromOptions(shapeStyle)
      await store.updateShapeFromSelectedShapeConf({
        resetTransform: false,
      })
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

  return (
    <>
      <Box>
        {shape && shape.kind === 'custom:raster' && (
          <Box display="flex" alignItems="flex-start" mb="3">
            <BigShapeThumbnail url={shape.config.processedThumbnailUrl} />
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

              <Box display="flex" alignItems="center" mb="5" mt="2">
                <CustomRasterShapeColorPicker
                  shapeConf={shape.config}
                  onAfterChange={updateShapeColoringDebounced}
                />
              </Box>
            </Box>
          </Box>
        )}

        <Box mt="5" mx="-5" px="5">
          <Stack direction="row" spacing="3">
            {!(shape && shape.kind === 'custom:raster') && (
              <Button
                mt="4"
                leftIcon={<FaUpload />}
                colorScheme="accent"
                onClick={() => {
                  state.isShowingUploadModal = true
                }}
              >
                Upload image
              </Button>
            )}
            {shape && shape.kind === 'custom:raster' && (
              <>
                {shape.kind === 'custom:raster' && (
                  <Button
                    colorScheme="primary"
                    onClick={() => {
                      state.isShowingCustomizeImage = true
                    }}
                    leftIcon={<FaSlidersH />}
                  >
                    Customize
                  </Button>
                )}

                <Button
                  colorScheme="accent"
                  leftIcon={<FaUpload />}
                  onClick={() => {
                    state.isShowingUploadModal = true
                  }}
                >
                  Change image
                </Button>
              </>
            )}
          </Stack>

          {shape && shape.kind === 'custom:raster' && (
            <Box mt="2rem" mb="2rem">
              <ShapeTransformLeftPanelSection />
            </Box>
          )}
        </Box>
      </Box>

      <AddCustomImageModal
        isOpen={state.isShowingUploadModal}
        onClose={() => {
          state.isShowingUploadModal = false
        }}
        onSubmit={async (value) => {
          const shapeConf: ShapeCustomImageRasterConf = {
            kind: 'custom:raster',
            processedThumbnailUrl: value.processedThumbnailUrl!,
            thumbnailUrl: value.processedThumbnailUrl!,
            processing: {
              edges: value.removeEdges
                ? {
                    amount: value.removeEdges,
                  }
                : undefined,
              invert:
                value.fill === 'invert'
                  ? {
                      color: value.fillColor,
                    }
                  : undefined,
              fill:
                value.fill === 'fill'
                  ? {
                      color: value.fillColor,
                    }
                  : undefined,
              removeLightBackground: {
                threshold: value.removeLightBackgroundThreshold,
              },
            },
            url: value.originalUrl!,
          }
          lastShapeConfig = shapeConf

          const canvas = await loadImageUrlToCanvasCtx(value.originalUrl)

          store.setPageSize(
            {
              kind: 'custom',
              custom: {
                width: Math.ceil(canvas.canvas.width),
                height: Math.ceil(canvas.canvas.height),
              },
            },
            false
          )
          store.selectShapeAndSaveUndo(shapeConf)
        }}
      />

      {shape &&
        shape.kind === 'custom:raster' &&
        state.isShowingCustomizeImage && (
          <CustomizeRasterImageModal
            isOpen
            value={{
              processedThumbnailUrl: shape.url,
              removeLightBackground:
                (shape.config.processing?.removeLightBackground?.threshold ||
                  0) > 0,
              removeLightBackgroundThreshold:
                shape.config.processing?.removeLightBackground?.threshold || 0,
              removeEdges: shape.config.processing?.edges?.amount || 0,
              originalUrl: shape.url,
              fill:
                shape.config.processing?.invert != null
                  ? 'invert'
                  : shape.config.processing?.fill != null
                  ? 'fill'
                  : 'original',
              fillColor:
                shape.config.processing?.invert?.color ||
                shape.config.processing?.fill?.color ||
                'red',
            }}
            onClose={() => {
              state.isShowingCustomizeImage = false
            }}
            onSubmit={async (value) => {
              state.thumbnailPreview = value.processedThumbnailUrl

              shape.config.processedThumbnailUrl = value.processedThumbnailUrl
              shape.config.processing = {
                invert:
                  value.fill === 'invert'
                    ? {
                        color: value.fillColor,
                      }
                    : undefined,
                fill:
                  value.fill === 'fill'
                    ? {
                        color: value.fillColor,
                      }
                    : undefined,
                removeLightBackground: value.removeLightBackground
                  ? {
                      threshold: value.removeLightBackgroundThreshold,
                    }
                  : undefined,
                edges: value.removeEdges
                  ? {
                      amount: value.removeEdges,
                    }
                  : undefined,
              }

              if (value.fill) {
                store.shapesPanel.customImage.fillColor = value.fillColor
              }

              await store.updateShapeFromSelectedShapeConf({
                resetTransform: false,
              })
              store.updateShapeThumbnail()
            }}
          />
        )}
    </>
  )
})

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
