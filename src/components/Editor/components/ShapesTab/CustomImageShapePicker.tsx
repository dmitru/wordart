import { Box, Button, Stack } from '@chakra-ui/core'
import css from '@emotion/css'
import { Slider } from 'components/shared/Slider'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import { useStore } from 'services/root-store'
import { BigShapeThumbnail, ShapeTransformLeftPanelSection } from './components'
import { CustomizeRasterImageModal } from './CustomImages/CustomizeRasterImageModal'
import { AddCustomImageModal } from './CustomImages/AddCustomImageModal'
import { FaUpload } from 'react-icons/fa'

const initialState = {
  isShowingUploadModal: false,
  isShowingCustomizeImage: false,
  thumbnailPreview: '',
}

const state = observable<typeof initialState>({ ...initialState })

export type LeftPanelShapesTabProps = {}

export const CustomImageShapePicker: React.FC<{}> = observer(() => {
  const { editorPageStore: store } = useStore()
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
                colorScheme="secondary"
                onClick={() => {
                  state.isShowingUploadModal = true
                }}
              >
                Upload image
              </Button>
            )}
            {shape && shape.kind === 'custom:raster' && (
              <>
                <Button
                  colorScheme="secondary"
                  onClick={() => {
                    state.isShowingUploadModal = true
                  }}
                >
                  Change image
                </Button>

                {shape.kind === 'custom:raster' && (
                  <Button
                    onClick={() => {
                      state.isShowingCustomizeImage = true
                    }}
                  >
                    Customize
                  </Button>
                )}
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
        onSubmit={({ thumbnailUrl, state }) => {
          store.selectShapeAndSaveUndo({
            kind: 'custom:raster',
            processedThumbnailUrl: thumbnailUrl,
            thumbnailUrl: thumbnailUrl,
            processing: {
              edges: {
                amount: 80,
              },
              invert: state.invert
                ? {
                    color: state.invertColor,
                  }
                : undefined,
              removeLightBackground: {
                threshold: state.removeLightBackground,
              },
            },
            url: state.originalUrl!,
          })
        }}
      />

      {shape && shape.kind === 'custom:raster' && (
        <CustomizeRasterImageModal
          isOpen={state.isShowingCustomizeImage}
          value={{
            removeLightBackground:
              (shape.config.processing?.removeLightBackground?.threshold || 0) >
              0,
            removeLightBackgroundThreshold:
              shape.config.processing?.removeLightBackground?.threshold || 0,
            removeEdges: shape.config.processing?.edges?.amount || 0,
            originalUrl: shape.url,
          }}
          onClose={() => {
            state.isShowingCustomizeImage = false
          }}
          onSubmit={async (thumbnailUrl, value) => {
            state.thumbnailPreview = thumbnailUrl

            shape.config.processedThumbnailUrl = thumbnailUrl
            shape.config.processing = {
              invert: undefined,
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
            await store.updateShapeFromSelectedShapeConf()
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
