import { Box, Button, Flex, Stack, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import { BgItemsColorPickerInline } from 'components/Editor/components/BgItemsColorPicker'
import { ShapeItemsColorPickerInline } from 'components/Editor/components/ShapeItemsColorPicker'
import { SectionLabel } from 'components/Editor/components/shared'
import { SvgShapeColorPickerCollapse } from 'components/Editor/components/SvgShapeColorPicker'
import {
  ThemePresetThumbnail,
  ThemePresetThumbnailContainer,
  ThemePresetThumbnails,
} from 'components/Editor/components/ThemePresetThumbnail'
import { AnimatePresence, motion } from 'framer-motion'
import { TargetKind } from 'components/Editor/lib/editor'
import {
  mkBgStyleConfFromOptions,
  mkShapeStyleConfFromOptions,
  ThemePreset,
} from 'components/Editor/style'
import { themePresets } from 'components/Editor/theme-presets'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { Slider } from 'components/shared/Slider'
import { cloneDeep } from 'lodash'
import { toJS } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce/lib'
import { FaQuestionCircle } from 'react-icons/fa'
import { Tooltip } from 'components/shared/Tooltip'

export type LeftPanelColorsTabProps = {
  target: TargetKind
}

export const LeftPanelColorsTab: React.FC<LeftPanelColorsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const {
      // @ts-ignore
      renderKey, // eslint-disable-line
    } = store
    const shape = store.getShape()
    const shapeStyle = store.styleOptions.shape
    const bgStyle = store.styleOptions.bg

    const state = useLocalStore(() => ({
      view: 'normal' as 'normal' | 'themes',
      selectedThemeTitle: '',
      savedStyle: null as any,
    }))

    const updateShapeItemsColoring = useThrottleCallback(
      () => {
        store.editor?.setShapeItemsStyle(
          mkShapeStyleConfFromOptions(shapeStyle).items
        )
      },
      20,
      true
    )

    const updateBgItemsColoring = useThrottleCallback(
      () => {
        store.editor?.setBgItemsStyle(mkBgStyleConfFromOptions(bgStyle).items)
      },
      20,
      true
    )

    const onUpdateImmediately = async (updateItems = true) => {
      if (!shape) {
        return
      }
      const style = mkShapeStyleConfFromOptions(shapeStyle)
      await store.editor?.updateShapeColors(shape.config)
      store.renderKey++
      store.updateShapeThumbnail()
      if (updateItems && shapeStyle.items.coloring.kind === 'shape') {
        store.editor?.setShapeItemsStyle(style.items)
      }
    }

    const [onUpdate] = useDebouncedCallback(onUpdateImmediately, 20, {
      leading: true,
      trailing: true,
    })

    const updateAllStyles = async () => {
      const shapeStyle = store.styleOptions.shape
      const bgStyle = store.styleOptions.bg
      await onUpdateImmediately()
      store.editor?.setShapeOpacity(shapeStyle.opacity)
      await store.editor?.setShapeItemsStyle(
        mkShapeStyleConfFromOptions(shapeStyle).items
      )
      await store.editor?.setBgItemsStyle(
        mkBgStyleConfFromOptions(bgStyle).items
      )
      store.editor?.setBgColor(bgStyle.fill.color)
    }

    const applyTheme = (theme: ThemePreset) => {
      // <update-styles>
      // Shape
      shapeStyle.opacity = theme.shapeOpacity

      // Bg
      bgStyle.fill.kind = 'color'
      bgStyle.fill.color = {
        kind: 'color',
        color: theme.bgFill,
      }

      // Shape fill
      if (shape?.kind === 'svg') {
        shape.config.processing.colors = {
          kind: 'single-color',
          color: theme.shapeFill,
        }
        shapeStyle.colors.color = theme.shapeFill
      } else if (shape?.kind === 'text') {
        shape.config.textStyle.color = theme.shapeFill
      }

      // Shape items coloring
      shapeStyle.items.coloring.kind = theme.shapeItemsColoring.kind
      if (theme.shapeItemsColoring.kind === 'color') {
        shapeStyle.items.coloring.color = theme.shapeItemsColoring
      } else if (theme.shapeItemsColoring.kind === 'gradient') {
        shapeStyle.items.coloring.gradient = theme.shapeItemsColoring
      } else if (theme.shapeItemsColoring.kind === 'shape') {
        shapeStyle.items.coloring.shape = theme.shapeItemsColoring
      }

      // Bg items coloring
      bgStyle.items.coloring.kind = theme.bgItemsColoring.kind
      if (theme.bgItemsColoring.kind === 'color') {
        bgStyle.items.coloring.color = theme.bgItemsColoring
      } else if (theme.bgItemsColoring.kind === 'gradient') {
        shapeStyle.items.coloring.gradient = theme.bgItemsColoring
      }

      shapeStyle.items.dimSmallerItems = theme.shapeDimSmallerItems
      bgStyle.items.dimSmallerItems = theme.bgDimSmallerItems
      // </update-styles>

      updateAllStyles()
    }

    return (
      <>
        <Box
          position="relative"
          overflow="hidden"
          width="100%"
          height="calc(100vh - 50px)"
        >
          <AnimatePresence initial={false}>
            {state.view === 'themes' && (
              <motion.div
                key="themes"
                initial={{ x: 355, y: 0, opacity: 0 }}
                transition={{ ease: 'easeInOut', duration: 0.2 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                exit={{ x: 355, y: 0, opacity: 0 }}
              >
                <Box position="absolute" height="100%" px="3" py="3">
                  <Flex mb="5">
                    <Button
                      css={css`
                        min-width: 120px;
                      `}
                      leftIcon="chevron-left"
                      onClick={() => {
                        state.view = 'normal'
                        if (state.savedStyle) {
                          store.styleOptions.shape = state.savedStyle.shapeStyle
                          store.styleOptions.bg = state.savedStyle.bgStyle
                          // @ts-ignore
                          shape.config = state.savedStyle.shapeConfig
                          updateAllStyles()
                        }
                      }}
                    >
                      Back
                    </Button>
                    {state.selectedThemeTitle && (
                      <Button
                        ml="3"
                        width="100%"
                        variantColor="green"
                        variant="solid"
                        isDisabled={!state.selectedThemeTitle}
                        onClick={() => {
                          state.view = 'normal'
                          state.savedStyle = null
                        }}
                      >
                        Apply Theme
                      </Button>
                    )}
                  </Flex>

                  <Text fontSize="xl">Try a color theme</Text>
                  <ThemePresetThumbnails
                    css={css`
                      height: calc(100vh - 180px);
                    `}
                    display="flex"
                    flexDirection="row"
                    flexWrap="wrap"
                    overflowY="scroll"
                  >
                    {themePresets.map((theme) => (
                      <ThemePresetThumbnailContainer
                        aria-role="button"
                        key={theme.title}
                        css={css`
                          ${state.selectedThemeTitle === theme.title &&
                          'transform: scale(1.05); svg { outline: 5px solid #d53f8c; }'}
                        `}
                        onClick={() => {
                          state.selectedThemeTitle = theme.title
                          applyTheme(theme)
                        }}
                      >
                        <ThemePresetThumbnail theme={theme} />
                      </ThemePresetThumbnailContainer>
                    ))}
                  </ThemePresetThumbnails>
                </Box>
              </motion.div>
            )}

            {state.view === 'normal' && (
              <motion.div
                key="normal"
                initial={{ x: -355, y: 0, opacity: 0 }}
                transition={{ ease: 'easeInOut', duration: 0.2 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                exit={{ x: -355, y: 0, opacity: 0 }}
              >
                <Box
                  position="absolute"
                  height="calc(100vh - 50px)"
                  overflowY="auto"
                  px="3"
                  py="3"
                  width="100%"
                >
                  <Box mb="5">
                    <Button
                      marginLeft="auto"
                      variant="solid"
                      variantColor="accent"
                      rightIcon="chevron-right"
                      onClick={() => {
                        state.view = 'themes'
                        state.selectedThemeTitle = ''
                        state.savedStyle = cloneDeep({
                          shapeStyle: toJS(shapeStyle, {
                            recurseEverything: true,
                            exportMapsAsObjects: false,
                          }),
                          bgStyle: toJS(bgStyle, { recurseEverything: true }),
                          shapeConfig: toJS(shape!.config, {
                            recurseEverything: true,
                          }),
                        })
                      }}
                    >
                      Explore Color Themes
                    </Button>
                  </Box>

                  {/* <shape-color> */}
                  <Box mb="0">
                    <SectionLabel>Shape</SectionLabel>

                    <Flex direction="column">
                      {/* <Box display="flex">
                  <Text fontSize="xl" mb="0">
                    Shape
                  </Text>
                </Box> */}

                      <Slider
                        css={css`
                          flex: 1;
                          margin-right: 20px;
                        `}
                        horizontal
                        afterLabel="%"
                        label="Opacity"
                        value={100 * shapeStyle.opacity}
                        onChange={(value) => {
                          shapeStyle.opacity = value / 100
                        }}
                        onAfterChange={(value) => {
                          store.editor?.setShapeOpacity(value / 100)
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />

                      {shape?.kind === 'svg' && (
                        <>
                          <SvgShapeColorPickerCollapse
                            shape={shape}
                            onUpdate={onUpdate}
                          />
                        </>
                      )}

                      {/* {shape?.kind === 'text' && (
                  <Box mb="5">
                    <ColorPicker
                      value={chroma(shape.config.textStyle.color)
                        .alpha(1)
                        .hex()}
                      onChange={(hex) => {
                        shape.config.textStyle.color = chroma(hex).hex()
                        onUpdate(false)
                      }}
                      onAfterChange={() => {
                        onUpdate()
                      }}
                    />
                  </Box>
                )} */}

                      {/* <svg-shape */}
                      {shape?.kind === 'svg' && (
                        <>
                          {/* <svg-color-options> */}

                          {/* <svg-color-options> */}
                        </>
                      )}
                      {/* </svg-shape> */}
                    </Flex>
                  </Box>
                  {/* </shape-color> */}

                  {/* <background> */}

                  <Box mt="2.5rem">
                    <SectionLabel>Background</SectionLabel>
                    <Stack direction="row" spacing="3">
                      <Box display="flex" alignItems="flex-start">
                        <Text my="0" fontWeight="600" mr="3">
                          Color
                        </Text>

                        <ColorPickerPopover
                          value={chroma(bgStyle.fill.color.color)
                            .alpha(1)
                            .hex()}
                          onChange={(hex) => {
                            bgStyle.fill.color.color = chroma(hex).hex()
                            store.editor?.setBgColor(bgStyle.fill.color)
                          }}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  {/* <shape-items> */}
                  <Box mt="2.5rem">
                    <SectionLabel>Shape Words & Icons</SectionLabel>

                    <Box>
                      <ShapeItemsColorPickerInline
                        shapeStyle={shapeStyle}
                        onUpdate={updateShapeItemsColoring}
                      />
                    </Box>

                    <Flex direction="row" mb="0">
                      <Slider
                        css={css`
                          flex: 1;
                        `}
                        afterLabel="%"
                        labelCss="width: 60px"
                        horizontal
                        label="Opacity"
                        value={100 * shapeStyle.items.opacity}
                        onChange={(value) => {
                          shapeStyle.items.opacity = value / 100
                        }}
                        onAfterChange={updateShapeItemsColoring}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </Flex>

                    <Box mb="0">
                      {/* {shapeStyle.items.coloring.kind === 'shape' && (
              <Box mb="4">
                <Slider
                  css={css`
                    width: 50%;
                  `}
                  label="Brightness"
                  value={shapeStyle.items.coloring.shape.shapeBrightness}
                  onChange={(value) => {
                    const val = (value as any) as number
                    shapeStyle.items.coloring.shape.shapeBrightness = val
                  }}
                  onAfterChange={updateShapeItemsColoring}
                  min={-100}
                  max={100}
                  step={1}
                />
              </Box>
            )} */}
                    </Box>
                  </Box>

                  <Box mb="2">
                    <Slider
                      css={css`
                        flex: 1;
                      `}
                      horizontal
                      label={
                        <>
                          <Box display="flex" alignItems="center">
                            Emphasize size{' '}
                            <Tooltip
                              label="Make larger words brighter and smaller words dimmer"
                              zIndex={100}
                              showDelay={200}
                            >
                              <Text my="0" color="blue" cursor="help" ml="2">
                                <FaQuestionCircle style={{ color: '#999' }} />
                              </Text>
                            </Tooltip>
                          </Box>
                        </>
                      }
                      afterLabel="%"
                      value={shapeStyle.items.dimSmallerItems}
                      onChange={(value) => {
                        const val = (value as any) as number
                        shapeStyle.items.dimSmallerItems = val
                      }}
                      onAfterChange={updateShapeItemsColoring}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </Box>
                  {/* </shape-items> */}

                  {store?.editor && store.editor.items.bg.items.length > 0 && (
                    <Box mt="2.5rem">
                      <SectionLabel>Background Words & Icons</SectionLabel>

                      <BgItemsColorPickerInline
                        bgStyle={bgStyle}
                        onUpdate={updateBgItemsColoring}
                      />

                      <>
                        <Flex direction="row" mb="0">
                          <Slider
                            css={css`
                              flex: 1;
                            `}
                            horizontal
                            afterLabel="%"
                            label="Opacity"
                            value={100 * bgStyle.items.opacity}
                            onChange={(value) => {
                              bgStyle.items.opacity = value / 100
                            }}
                            onAfterChange={updateBgItemsColoring}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </Flex>

                        <Box mb="4">
                          <Slider
                            css={css`
                              flex: 1;
                            `}
                            horizontal
                            label={
                              <>
                                <Box display="flex" alignItems="center">
                                  Emphasize size{' '}
                                  <Tooltip
                                    label="Make larger words brighter and smaller words dimmer"
                                    zIndex={100}
                                    showDelay={200}
                                  >
                                    <Text
                                      my="0"
                                      color="blue"
                                      cursor="help"
                                      ml="2"
                                    >
                                      <FaQuestionCircle
                                        style={{ color: '#999' }}
                                      />
                                    </Text>
                                  </Tooltip>
                                </Box>
                              </>
                            }
                            afterLabel="%"
                            value={bgStyle.items.dimSmallerItems}
                            onChange={(value) => {
                              const val = (value as any) as number
                              bgStyle.items.dimSmallerItems = val
                            }}
                            onAfterChange={updateBgItemsColoring}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </Box>
                      </>
                    </Box>
                  )}
                  {/* </background> */}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </>
    )
  }
)
