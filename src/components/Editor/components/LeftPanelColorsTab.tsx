import { Box, Button, Divider, Flex, Stack, Text } from '@chakra-ui/core'
import css from '@emotion/css'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import { SvgShapeColorPicker } from 'components/Editor/components/SvgShapeColorPicker'
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
import { themePresets } from 'components/Editor/theme-presets'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { Slider } from 'components/shared/Slider'
import { cloneDeep } from 'lodash'
import { toJS } from 'mobx'
import { observer, useLocalStore } from 'mobx-react'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce/lib'
import { ChoiceButtons } from 'components/Editor/components/ChoiceButtons'
import { ShapeItemsColorPicker } from 'components/Editor/components/ShapeItemsColorPicker'
import { BgItemsColorPicker } from 'components/Editor/components/BgItemsColorPicker'

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
      const shape = store.getShape()
      const shapeStyle = store.styleOptions.shape
      const bgStyle = store.styleOptions.bg
      await onUpdateImmediately()
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
        {state.view === 'themes' && (
          <Box>
            <Flex mb="5">
              <Button
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
                Cancel
              </Button>
              {state.selectedThemeTitle && (
                <Button
                  marginLeft="auto"
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
              )}
            </Flex>

            <Text fontSize="xl">Choose a theme</Text>
            <ThemePresetThumbnails
              display="flex"
              flexDirection="row"
              flexWrap="wrap"
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
                  {theme.title}
                </ThemePresetThumbnailContainer>
              ))}
            </ThemePresetThumbnails>
          </Box>
        )}

        {state.view === 'normal' && (
          <>
            <Box mb="3">
              <Button
                marginLeft="auto"
                variant="solid"
                variantColor="green"
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
              <Flex direction="column">
                <Box display="flex">
                  <Text fontSize="xl" mb="0">
                    Shape
                  </Text>
                </Box>

                <Flex direction="row" mb="3">
                  <Slider
                    css={css`
                      flex: 1;
                      margin-right: 20px;
                    `}
                    afterLabel="%"
                    labelCss="width: 60px"
                    label="Opacity"
                    horizontal
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
                    <SvgShapeColorPicker shape={shape} onUpdate={onUpdate} />
                  )}
                </Flex>

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

            <Divider />

            {/* <background> */}

            <Box>
              <Text fontSize="xl">Background</Text>
              <Stack direction="row" spacing="3">
                <Box mb="2" display="flex" alignItems="flex-start">
                  <Text fontSize="md" mr="3">
                    Fill:
                  </Text>

                  <ColorPickerPopover
                    value={chroma(bgStyle.fill.color.color).alpha(1).hex()}
                    onChange={(hex) => {
                      bgStyle.fill.color.color = chroma(hex).hex()
                      store.editor?.setBgColor(bgStyle.fill.color)
                    }}
                  />
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* <shape-items> */}
            <Box mb="1">
              <Text fontSize="xl">Shape Words & Icons</Text>
              <Flex direction="row" mb="0">
                <Slider
                  css={css`
                    flex: 1;
                    margin-right: 20px;
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

                <ShapeItemsColorPicker
                  shapeStyle={shapeStyle}
                  onUpdate={updateShapeItemsColoring}
                />
              </Flex>

              <Box mb="2">
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

            <Box mb="4">
              <Slider
                css={css`
                  flex: 1;
                `}
                horizontal
                label="Emphasize size"
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

            <Divider />

            <Box>
              <Text fontSize="xl">Background Words & Icons</Text>

              {store?.editor && store.editor.items.bg.items.length > 0 ? (
                <Flex direction="row" mb="3">
                  <Slider
                    css={css`
                      flex: 1;
                      margin-right: 20px;
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

                  <BgItemsColorPicker
                    bgStyle={bgStyle}
                    onUpdate={updateBgItemsColoring}
                  />
                </Flex>
              ) : (
                <Text>Add some items to the Background layer first.</Text>
              )}
            </Box>
            {/* </background> */}
          </>
        )}
      </>
    )
  }
)
