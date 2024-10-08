import {
  Box,
  Text,
  Flex,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
} from '@chakra-ui/core'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import { useThrottleCallback } from '@react-hook/throttle'
import { BackgroundColorOptions } from 'components/Editor/components/BackgroundColorOptions'
import {
  BgItemsColorPickerInline,
  BgItemsColorPickerKindDropdown,
} from 'components/Editor/components/BgItemsColorPicker'
import { ShapeColorPicker } from 'components/Editor/components/ShapeColorPicker'
import {
  ShapeItemsColorPickerInline,
  ShapeItemsColorPickerKindDropdown,
} from 'components/Editor/components/ShapeItemsColorPicker'
import { SectionLabel } from 'components/Editor/components/shared'
import {
  ThemePresetThumbnail,
  ThemePresetThumbnailContainer,
  ThemePresetThumbnails,
} from 'components/Editor/components/ThemePresetThumbnail'
import { TargetKind } from 'components/Editor/lib/editor'
import {
  mkBgStyleConfFromOptions,
  mkShapeStyleConfFromOptions,
  ThemePreset,
} from 'components/Editor/style'
import {
  BgStyleOptions,
  ShapeStyleOptions,
} from 'components/Editor/style-options'
import { themePresets } from 'components/Editor/theme-presets'
import { Button } from 'components/shared/Button'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { Slider } from 'components/shared/Slider'
import { AnimatePresence, motion } from 'framer-motion'
import { cloneDeep } from 'lodash'
import { toJS } from 'mobx'
import { observer, useLocalStore, Observer } from 'mobx-react'
import { FaCog, FaPalette } from 'react-icons/fa'
import { useDebouncedCallback } from 'use-debounce/lib'
import { defaultShapeStyleOptions } from '../default-style-options'
import { useEditorStore } from 'components/Editor/editor-store'

export type LeftPanelColorsTabProps = {
  target: TargetKind
}

const ItemsAdvancedControls: React.FC<{
  items: ShapeStyleOptions['items'] | BgStyleOptions['items']
  onUpdate: () => void
}> = ({ items, onUpdate }) => (
  <Popover closeOnBlur closeOnEsc>
    <PopoverTrigger>
      <Button
        ml="auto"
        variant="ghost"
        color="gray.500"
        css={css`
          width: 50px;
        `}
      >
        <FaCog />
      </Button>
    </PopoverTrigger>
    <Portal>
      <PopoverContent width="330px">
        <PopoverArrow />
        <PopoverBody p={3}>
          <Observer>
            {() => (
              <Box pb="0.5rem" pt="4">
                <Box>
                  <Slider
                    afterLabel="%"
                    label="Brightness"
                    value={items.brightness}
                    onChange={(value) => {
                      const val = (value as any) as number
                      items.brightness = val
                    }}
                    onAfterChange={onUpdate}
                    resetValue={0}
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
                    label="Opacity"
                    value={items.opacity}
                    onChange={(value) => {
                      items.opacity = value
                    }}
                    onAfterChange={onUpdate}
                    resetValue={100}
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
                    label={
                      <>
                        <Box display="flex" alignItems="center">
                          Emphasize size
                          <HelpTooltipIcon
                            label="Make larger words brighter and smaller words dimmer"
                            ml="2"
                          />
                        </Box>
                      </>
                    }
                    afterLabel="%"
                    value={items.dimSmallerItems}
                    onChange={(value) => {
                      const val = value
                      items.dimSmallerItems = val
                    }}
                    onAfterChange={onUpdate}
                    min={0}
                    resetValue={40}
                    max={100}
                    step={1}
                  />
                </Box>
              </Box>
            )}
          </Observer>
        </PopoverBody>
      </PopoverContent>
    </Portal>
  </Popover>
)

export const LeftPanelColorsTab: React.FC<LeftPanelColorsTabProps> = observer(
  ({ target }) => {
    const store = useEditorStore()!
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
      await store.editor?.updateShapeColors(shape.config, true)
      store.renderKey++
      store.updateShapeThumbnail()
      if (updateItems && shapeStyle.items.coloring.kind === 'shape') {
        store.editor?.setShapeItemsStyle(style.items)
      }

      if (shape.kind === 'custom:raster') {
        await store.updateShapeFromSelectedShapeConf({ resetTransform: false })
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
      store.editor?.setShapeOpacity(shapeStyle.opacity / 100)
      await store.editor?.setShapeItemsStyle(
        mkShapeStyleConfFromOptions(shapeStyle).items
      )
      await store.editor?.setBgItemsStyle(
        mkBgStyleConfFromOptions(bgStyle).items
      )
      store.editor?.setBgColor(bgStyle.fill.color)
      if (bgStyle.fill.kind === 'color') {
        store.editor?.setBgOpacity(bgStyle.fill.color.opacity / 100)
      } else {
        store.editor?.setBgOpacity(0)
      }
    }

    const applyTheme = (theme: ThemePreset) => {
      store.applyColorTheme(theme)
    }

    return (
      <>
        <Box
          position="relative"
          overflow="hidden"
          width="100%"
          height="calc(100vh - 60px)"
          css={css`
            overflow-y: auto;
            overflow-x: hidden;
          `}
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
                <Box position="absolute" height="100%" px="5" py="6">
                  <Flex mb="5">
                    <Button
                      css={css`
                        min-width: 120px;
                      `}
                      leftIcon={<ChevronLeftIcon />}
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
                            colorScheme="accent"
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

                  <ThemePresetThumbnails
                    css={css`
                      height: calc(100vh - 160px);
                    `}
                    display="flex"
                    flexDirection="row"
                    flexWrap="wrap"
                    overflowY="scroll"
                    pb="4rem"
                  >
                    {themePresets.map((theme) => (
                      <ThemePresetThumbnailContainer
                        aria-role="button"
                        key={theme.title}
                        isActive={state.selectedThemeTitle === theme.title}
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
                  height="calc(100vh - 60px)"
                  overflowY="auto"
                  px="5"
                  py="6"
                  pb="5rem"
                  width="100%"
                  css={css`
                    &::-webkit-scrollbar {
                      display: none; /* Chrome Safari */
                    }
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE 10+ */
                    overflow-y: scroll;
                    overflow-x: hidden;
                  `}
                >
                  <Box mb="5" display="flex">
                    <Button
                      colorScheme="primary"
                      rightIcon={<ChevronRightIcon />}
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
                      leftIcon={<FaPalette />}
                    >
                      Color Themes
                    </Button>

                    {/* <Tooltip label="Save current settings as a new theme">
                      <Button ml="2" variant="outline">
                        <FaSave />
                      </Button>
                    </Tooltip> */}
                  </Box>

                  {/* <shape-color> */}
                  <Box mb="2rem">
                    <SectionLabel>Shape</SectionLabel>

                    <Box mb="4">
                      <ShapeOpacitySlider />
                    </Box>

                    <ShapeColorPicker onUpdate={onUpdate} />
                    {/* </svg-shape> */}
                  </Box>
                  {/* </shape-color> */}

                  {/* <shape-items> */}
                  <Box mb="2rem">
                    <Box mt="2" mb="4" display="flex" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <Text
                          my="0"
                          mr="3"
                          fontWeight="medium"
                          color="gray.500"
                        >
                          Words color
                        </Text>
                        <ShapeItemsColorPickerKindDropdown
                          shapeStyle={shapeStyle}
                          onUpdate={updateShapeItemsColoring}
                        />
                      </Box>

                      <ItemsAdvancedControls
                        items={shapeStyle.items}
                        onUpdate={updateShapeItemsColoring}
                      />
                    </Box>

                    <Box mt="2">
                      <ShapeItemsColorPickerInline
                        shapeStyle={shapeStyle}
                        bgFill={bgStyle.fill}
                        onUpdate={updateShapeItemsColoring}
                      />
                    </Box>
                  </Box>
                  {/* </shape-items> */}

                  {/* <background> */}

                  <Box mb="2rem">
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
                    <BgItemsStyleOptions
                      target={target}
                      updateBgItemsColoring={updateBgItemsColoring}
                    />
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

const ShapeOpacitySlider = observer(() => {
  const store = useEditorStore()!
  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store
  const shape = store.getShape()
  const shapeStyle = store.styleOptions.shape

  return (
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
      resetValue={defaultShapeStyleOptions.opacity}
      min={0}
      max={100}
      step={1}
    />
  )
})

export const BgItemsStyleOptions: React.FC<{
  target: TargetKind
  updateBgItemsColoring: () => void
}> = observer(({ updateBgItemsColoring, target }) => {
  const store = useEditorStore()!
  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store
  const shape = store.getShape()
  const shapeStyle = store.styleOptions.shape
  const bgStyle = store.styleOptions.bg

  return (
    <Box mb="2rem">
      <Box mt="2" mb="2" display="flex" alignItems="center">
        <Box display="flex" alignItems="center">
          <Text my="0" mr="3" fontWeight="medium" color="gray.500">
            Words color
          </Text>
          <BgItemsColorPickerKindDropdown
            bgStyle={bgStyle}
            onUpdate={updateBgItemsColoring}
          />
        </Box>

        <ItemsAdvancedControls
          items={bgStyle.items}
          onUpdate={updateBgItemsColoring}
        />
      </Box>

      <Box mt="2">
        <BgItemsColorPickerInline
          bgStyle={bgStyle}
          bgFill={bgStyle.fill}
          onUpdate={updateBgItemsColoring}
        />
      </Box>
    </Box>
  )
})
