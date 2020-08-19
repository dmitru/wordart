import { Box, Button, Stack } from '@chakra-ui/core'
import css from '@emotion/css'
import { Slider } from 'components/shared/Slider'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import { BigShapeThumbnail, ShapeTransformLeftPanelSection } from './components'
import { CustomizeRasterImageModal } from './CustomImages/CustomizeRasterImageModal'
import { AddCustomImageModal } from './CustomImages/AddCustomImageModal'
import { FaUpload } from 'react-icons/fa'
import { ShapeCustomImageRasterConf } from 'components/Editor/shape-config'
import { useEditorStore } from 'components/Editor/editor-store'
import { loadImageUrlToCanvasCtx } from 'lib/wordart/canvas-utils'

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
            </Box>
          </Box>
        )}

        <Box mt="5" mx="-5" px="5">
          <Stack direction="row" spacing="3">
            {!(shape && shape.kind === 'custom:raster') && (
              <Button
                mt="4"
                leftIcon={<FaUpload />}
                colorScheme="primary"
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
                  >
                    Customize
                  </Button>
                )}

                <Button
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
              invert: value.invert
                ? {
                    color: value.invertColor,
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

          store.setPageSize({
            kind: 'custom',
            custom: {
              width: Math.ceil(canvas.canvas.width),
              height: Math.ceil(canvas.canvas.height),
            },
          })
          store.selectShapeAndSaveUndo(shapeConf)
        }}
      />

      {shape && shape.kind === 'custom:raster' && (
        <CustomizeRasterImageModal
          isOpen={state.isShowingCustomizeImage}
          value={{
            processedThumbnailUrl: shape.url,
            removeLightBackground:
              (shape.config.processing?.removeLightBackground?.threshold || 0) >
              0,
            removeLightBackgroundThreshold:
              shape.config.processing?.removeLightBackground?.threshold || 0,
            removeEdges: shape.config.processing?.edges?.amount || 0,
            originalUrl: shape.url,
            invert: shape.config.processing?.invert != null ? true : false,
            invertColor: shape.config.processing?.invert?.color || 'red',
          }}
          onClose={() => {
            state.isShowingCustomizeImage = false
          }}
          onSubmit={async (value) => {
            state.thumbnailPreview = value.processedThumbnailUrl

            shape.config.processedThumbnailUrl = value.processedThumbnailUrl
            shape.config.processing = {
              invert: value.invert
                ? {
                    color: value.invertColor,
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
