import {
  Box,
  Button,
  Flex,
  Stack,
  Text,
  Collapse,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  Checkbox,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import { BgItemsColorPickerInline } from 'components/Editor/components/BgItemsColorPicker'
import {
  ShapeItemsColorPickerInline,
  ShapeItemsColorPickerKindDropdown,
} from 'components/Editor/components/ShapeItemsColorPicker'
import { SectionLabel } from 'components/Editor/components/shared'
import {
  SvgShapeColorPickerCollapse,
  SvgShapeColorKindDropdown,
  ShapeColorOptions,
} from 'components/Editor/components/ShapeColorOptions'
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
import { FaQuestionCircle, FaCog, FaSave } from 'react-icons/fa'
import { Tooltip } from 'components/shared/Tooltip'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import { BackgroundColorOptions } from 'components/Editor/components/BackgroundColorOptions'

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
      shapeStyle.items.brightness = 0

      // Bg
      bgStyle.fill.kind = 'color'
      bgStyle.items.brightness = 0
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

      return updateAllStyles()
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
                        if (state.savedStyle && state.selectedThemeTitle) {
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
                    <AnimatePresence>
                      {state.selectedThemeTitle && (
                        <motion.div
                          key="btn"
                          style={{ display: 'flex', flex: '1' }}
                          initial={{ x: 0, y: 0, opacity: 0, scale: 1.4 }}
                          transition={{ ease: 'easeInOut', duration: 0.4 }}
                          animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        >
                          <Button
                            ml="3"
                            flex="1"
                            // width="100%"
                            variantColor="accent"
                            variant="solid"
                            isDisabled={!state.selectedThemeTitle}
                            onClick={() => {
                              state.view = 'normal'
                              state.savedStyle = null
                            }}
                          >
                            Apply Theme
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                  <Box mb="5" display="flex">
                    <Button
                      flex="1"
                      marginLeft="auto"
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

                    {/* <Tooltip label="Save current settings as a new theme">
                      <Button ml="2" variant="outline">
                        <FaSave />
                      </Button>
                    </Tooltip> */}
                  </Box>

                  {/* <shape-color> */}
                  <Box mb="0">
                    <SectionLabel>Shape</SectionLabel>

                    <Box mb="4">
                      <Slider
                        css={css`
                          flex: 1;
                          margin-right: 20px;
                        `}
                        horizontal
                        afterLabel="%"
                        label="Opacity"
                        value={shapeStyle.opacity}
                        onChange={(value) => {
                          shapeStyle.opacity = value
                        }}
                        onAfterChange={(value) => {
                          store.editor?.setShapeOpacity(value / 100)
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </Box>

                    <ShapeColorOptions onUpdate={onUpdate} />
                    {/* </svg-shape> */}
                  </Box>
                  {/* </shape-color> */}

                  {/* <shape-items> */}
                  <Box mt="2.5rem">
                    <Box display="flex" alignItems="center">
                      <SectionLabel
                        css={css`
                          margin-bottom: 0;
                        `}
                      >
                        Shape Items
                      </SectionLabel>
                    </Box>

                    <Box mt="2" mb="4" display="flex" alignItems="center">
                      <Box>
                        <ShapeItemsColorPickerKindDropdown
                          shapeStyle={shapeStyle}
                          onUpdate={updateShapeItemsColoring}
                        />
                      </Box>

                      <Button
                        css={css`
                          width: 120px;
                        `}
                        ml="auto"
                        size="sm"
                        variant={
                          store.leftColorTab.showShapeItemsAdvanced
                            ? 'solid'
                            : 'ghost'
                        }
                        variantColor={
                          store.leftColorTab.showShapeItemsAdvanced
                            ? 'primary'
                            : 'gray'
                        }
                        onClick={() => {
                          store.leftColorTab.showShapeItemsAdvanced = !store
                            .leftColorTab.showShapeItemsAdvanced
                        }}
                      >
                        <FaCog
                          style={{
                            color: 'currentColor',
                            marginRight: '5px',
                          }}
                        />
                        Advanced
                      </Button>
                    </Box>

                    <Box mt="2">
                      <ShapeItemsColorPickerInline
                        shapeStyle={shapeStyle}
                        bgFill={bgStyle.fill}
                        onUpdate={updateShapeItemsColoring}
                      />
                    </Box>

                    <Collapse
                      isOpen={store.leftColorTab.showShapeItemsAdvanced}
                    >
                      <Box pb="0.5rem" pr="3">
                        <Box>
                          <Slider
                            afterLabel="%"
                            horizontal
                            label="Brightness"
                            value={shapeStyle.items.brightness}
                            onChange={(value) => {
                              const val = (value as any) as number
                              shapeStyle.items.brightness = val
                            }}
                            onAfterChange={updateShapeItemsColoring}
                            min={-100}
                            max={100}
                            step={1}
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
                            value={shapeStyle.items.opacity}
                            onChange={(value) => {
                              shapeStyle.items.opacity = value
                            }}
                            onAfterChange={updateShapeItemsColoring}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </Flex>

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
                      </Box>
                    </Collapse>
                  </Box>
                  {/* </shape-items> */}

                  {/* <background> */}

                  <Box mt="1.5rem">
                    <SectionLabel>Background</SectionLabel>

                    <BackgroundColorOptions
                      onUpdate={() => {
                        if (bgStyle.fill.kind === 'color') {
                          store.editor?.setBgOpacity(
                            bgStyle.fill.color.opacity / 100
                          )
                          store.editor?.setBgColor(bgStyle.fill.color, true)
                        } else {
                          store.editor?.setBgOpacity(0, true)
                        }
                      }}
                    />
                  </Box>

                  {store?.editor && store.editor.items.bg.items.length > 0 && (
                    <Box mt="2.5rem">
                      <SectionLabel display="flex" alignItems="center">
                        Background Items
                        <Button
                          size="xs"
                          ml="auto"
                          variant={
                            store.leftColorTab.showBgItemsAdvanced
                              ? 'solid'
                              : 'ghost'
                          }
                          variantColor={
                            store.leftColorTab.showBgItemsAdvanced
                              ? 'primary'
                              : 'muted'
                          }
                          onClick={() => {
                            store.leftColorTab.showBgItemsAdvanced = !store
                              .leftColorTab.showBgItemsAdvanced
                          }}
                        >
                          <FaCog
                            style={{
                              color: 'currentColor',
                              marginRight: '5px',
                            }}
                          />{' '}
                          Advanced
                        </Button>
                      </SectionLabel>

                      <Box mt="0">
                        <BgItemsColorPickerInline
                          bgStyle={bgStyle}
                          onUpdate={updateBgItemsColoring}
                        />
                      </Box>

                      <Collapse isOpen={store.leftColorTab.showBgItemsAdvanced}>
                        <Flex direction="row" mb="0">
                          <Slider
                            css={css`
                              flex: 1;
                            `}
                            horizontal
                            afterLabel="%"
                            label="Opacity"
                            value={bgStyle.items.opacity}
                            onChange={(value) => {
                              bgStyle.items.opacity = value
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
                      </Collapse>
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
