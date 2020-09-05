import { Box, Flex, Stack, Text } from '@chakra-ui/core'
import { css } from '@emotion/core'
import { IconPicker } from 'components/Editor/components/IconPicker'
import { IconShapeColorPicker } from 'components/Editor/components/ShapeColorPicker'
import { ShapeThumbnailBtn } from 'components/Editor/components/ShapeSelector'
import { SectionLabel } from 'components/Editor/components/shared'
import { useEditorStore } from 'components/Editor/editor-store'
import { applyTransformToObj } from 'components/Editor/lib/fabric-utils'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'
import { Button } from 'components/shared/Button'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { AnimatePresence, motion } from 'framer-motion'
import { isEqual } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import { FaCog, FaSlidersH } from 'react-icons/fa'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { useDebouncedCallback } from 'use-debounce/lib'
import { BigShapeThumbnail, ShapeTransformLeftPanelSection } from './components'

type TabMode = 'home' | 'customize shape'
const initialState = {
  mode: 'home' as TabMode,
  isShowingCustomizeImage: false,
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

export const IconShapePicker: React.FC<{}> = observer(() => {
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
      Object.assign(state, initialState)
      store.leftTabIsTransformingShape = false
    }
  }, [])

  useEffect(() => {
    if (shapeConfig && shapeConfig.kind === 'icon') {
      shapeConfig.color = store.shapesPanel.icon.color
      updateShapeColoringDebounced()
    }
  }, [])

  const shapeConfig = store.getSelectedShapeConf()
  if (
    !shape ||
    !shapeConfig ||
    shape.kind !== 'icon' ||
    shapeConfig.kind !== 'icon'
  ) {
    return <></>
  }

  return (
    <>
      <Box>
        <>
          <Box display="flex" alignItems="flex-start" mb="3">
            {shape && (
              <BigShapeThumbnail
                url={shape.config.processedThumbnailUrl!}
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

              <Box display="flex" alignItems="center" mb="5" mt="2">
                <IconShapeColorPicker
                  shapeConf={shape.config}
                  onAfterChange={updateShapeColoringDebounced}
                />
              </Box>

              <Flex width="100%">
                {state.mode === 'home' && (
                  <Button
                    display="flex"
                    flex="1"
                    onClick={() => {
                      state.mode = 'customize shape'
                    }}
                    leftIcon={<FaSlidersH />}
                  >
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
                  <Stack mb="4" mt="5" position="absolute" width="100%">
                    <Box>
                      <ShapeTransformLeftPanelSection />
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
                  <Box
                    position="absolute"
                    width="100%"
                    height="100%"
                    display="flex"
                    flexDirection="column"
                  >
                    <IconPicker
                      onSelected={async (shapeConfig) => {
                        shapeConfig.color = store.shapesPanel.icon.color

                        if (
                          store.shapesPanel.icon.selected !== shapeConfig.id
                        ) {
                          store.shapesPanel.icon.selected = shapeConfig.id
                          await store.selectShapeAndSaveUndo(shapeConfig)
                        }
                        store.animateVisualize(false)
                      }}
                      selectedIconId={store.shapesPanel.icon.selected}
                    />
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </>
      </Box>
    </>
  )
})
