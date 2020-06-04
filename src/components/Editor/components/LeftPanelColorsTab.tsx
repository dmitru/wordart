import { Box, Button, Heading, Flex, Stack } from '@chakra-ui/core'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import { TargetKind } from 'components/Editor/lib/editor'
import {
  mkShapeStyleConfFromOptions,
  mkBgStyleConfFromOptions,
} from 'components/Editor/style'
import { ColorPicker } from 'components/shared/ColorPicker'
import { Slider } from 'components/shared/Slider'
import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce/lib'
import css from '@emotion/css'

export type LeftPanelColorsTabProps = {
  target: TargetKind
}

export const LeftPanelColorsTab: React.FC<LeftPanelColorsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const shape = store.getShape()
    const shapeStyle = store.styleOptions.shape
    const bgStyle = store.styleOptions.bg

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

    const [updateShapeColoring] = useDebouncedCallback(
      async (updateItems = true) => {
        if (!shape) {
          return
        }
        const style = mkShapeStyleConfFromOptions(shapeStyle)
        await store.editor?.updateShapeColors(shape.config)
        store.updateShapeThumbnail()
        if (updateItems && shapeStyle.items.coloring.kind === 'shape') {
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
        <Box mb="5">
          <Heading size="md" mt="0" mb="3">
            Shape Color
          </Heading>

          <Slider
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

          {shape?.kind === 'text' && (
            <ColorPicker
              value={chroma(shape.config.textStyle.color).alpha(1).hex()}
              onChange={(hex) => {
                shape.config.textStyle.color = chroma(hex).hex()
                updateShapeColoring(false)
              }}
              onAfterChange={() => {
                updateShapeColoring()
              }}
            />
          )}

          {shape?.kind === 'svg' && (
            <>
              <Box>
                <Button
                  px="2"
                  py="1"
                  mr="0"
                  size="sm"
                  variantColor={
                    shape.config.processing.colors.kind === 'original'
                      ? 'primary'
                      : undefined
                  }
                  onClick={() => {
                    shape.config.processing.colors = {
                      kind: 'original',
                    }
                    updateShapeColoring()
                  }}
                >
                  Original
                </Button>

                <Button
                  px="2"
                  py="1"
                  mr="0"
                  size="sm"
                  variantColor={
                    shape.config.processing.colors.kind === 'single-color'
                      ? 'primary'
                      : undefined
                  }
                  onClick={() => {
                    shape.config.processing.colors = {
                      kind: 'single-color',
                      color: shapeStyle.colors.color,
                    }
                    updateShapeColoring()
                  }}
                >
                  Single color
                </Button>

                <Button
                  px="2"
                  py="1"
                  mr="0"
                  size="sm"
                  variantColor={
                    shape.config.processing.colors.kind === 'color-map'
                      ? 'primary'
                      : undefined
                  }
                  onClick={() => {
                    shape.config.processing.colors = {
                      kind: 'color-map',
                      colors: shapeStyle.colors.colorMaps.get(shape.id)!,
                    }
                    updateShapeColoring()
                  }}
                >
                  Color map
                </Button>
              </Box>

              <Box mt="2">
                {shape.config.processing.colors.kind === 'single-color' && (
                  <ColorPicker
                    disableAlpha
                    value={chroma(shape.config.processing.colors.color)
                      .alpha(1)
                      .hex()}
                    onChange={(hex) => {
                      if (
                        shape.config.processing.colors.kind === 'single-color'
                      ) {
                        shape.config.processing.colors.color = chroma(hex).hex()
                      }
                    }}
                    onAfterChange={() => {
                      updateShapeColoring()
                    }}
                  />
                )}

                {shape.config.processing.colors.kind === 'color-map' &&
                  shape.config.processing.colors.colors.map((color, index) => (
                    <Box mr="1" key={index} display="inline-block">
                      <ColorPicker
                        disableAlpha
                        value={chroma(color).alpha(1).hex()}
                        onChange={(hex) => {
                          if (
                            shape.config.processing.colors.kind === 'color-map'
                          ) {
                            shape.config.processing.colors.colors[
                              index
                            ] = chroma(hex).hex()
                          }
                        }}
                        onAfterChange={() => {
                          updateShapeColoring()
                        }}
                      />
                    </Box>
                  ))}
              </Box>
            </>
          )}
        </Box>

        <Box mb="5">
          <Heading size="md" mt="0" mb="3">
            Shape Items
          </Heading>

          <Box flex="1">
            <Button
              px="2"
              py="1"
              mr="0"
              size="sm"
              variantColor={
                shapeStyle.items.coloring.kind === 'shape'
                  ? 'primary'
                  : undefined
              }
              onClick={() => {
                shapeStyle.items.coloring.kind = 'shape'
                updateShapeItemsColoring()
              }}
            >
              Shape color
            </Button>

            <Button
              px="2"
              py="1"
              size="sm"
              variantColor={
                shapeStyle.items.coloring.kind === 'gradient'
                  ? 'primary'
                  : undefined
              }
              onClick={() => {
                shapeStyle.items.coloring.kind = 'gradient'
                updateShapeItemsColoring()
              }}
            >
              Gradient
            </Button>

            <Button
              px="2"
              py="1"
              mr="0"
              size="sm"
              variantColor={
                shapeStyle.items.coloring.kind === 'color'
                  ? 'primary'
                  : undefined
              }
              onClick={() => {
                shapeStyle.items.coloring.kind = 'color'
                updateShapeItemsColoring()
              }}
            >
              Color
            </Button>
          </Box>

          <Box mt="3">
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
            {shapeStyle.items.coloring.kind === 'color' && (
              <ColorPicker
                disableAlpha
                value={shapeStyle.items.coloring.color.color}
                onChange={(hex) => {
                  shapeStyle.items.coloring.color.color = hex
                }}
                onAfterChange={updateShapeItemsColoring}
              />
            )}
            {shapeStyle.items.coloring.kind === 'gradient' && (
              <>
                <Box mr="1" display="inline-block">
                  <ColorPicker
                    disableAlpha
                    value={shapeStyle.items.coloring.gradient.gradient.from}
                    onChange={(hex) => {
                      shapeStyle.items.coloring.gradient.gradient.from = hex
                    }}
                    onAfterChange={updateShapeItemsColoring}
                  />
                </Box>
                <Box mr="1" display="inline-block">
                  <ColorPicker
                    disableAlpha
                    value={shapeStyle.items.coloring.gradient.gradient.to}
                    onChange={(hex) => {
                      shapeStyle.items.coloring.gradient.gradient.to = hex
                    }}
                    onAfterChange={updateShapeItemsColoring}
                  />
                </Box>
              </>
            )}
          </Box>

          <Stack direction="row" spacing="3" mt="3">
            <Slider
              css={css`
                flex: 1;
              `}
              label="Dim smaller items"
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

            <Slider
              css={css`
                flex: 1;
              `}
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
          </Stack>
        </Box>

        <Box mb="5">
          <Heading size="md" mt="0" mb="3">
            Background
          </Heading>

          <ColorPicker
            value={chroma(bgStyle.fill.color.color).alpha(1).hex()}
            onChange={(hex) => {
              bgStyle.fill.color.color = chroma(hex).hex()
              store.editor?.setBgColor(bgStyle.fill.color)
            }}
          />
        </Box>

        <Box mb="5">
          <Heading size="md" mt="0" mb="3">
            Background Items
          </Heading>

          <Box flex="1">
            <Button
              px="2"
              py="1"
              size="sm"
              variantColor={
                bgStyle.items.coloring.kind === 'gradient'
                  ? 'primary'
                  : undefined
              }
              onClick={() => {
                bgStyle.items.coloring.kind = 'gradient'
                updateBgItemsColoring()
              }}
            >
              Gradient
            </Button>

            <Button
              px="2"
              py="1"
              mr="0"
              size="sm"
              variantColor={
                bgStyle.items.coloring.kind === 'color' ? 'primary' : undefined
              }
              onClick={() => {
                bgStyle.items.coloring.kind = 'color'
                updateBgItemsColoring()
              }}
            >
              Color
            </Button>
          </Box>

          <Box mt="3">
            {bgStyle.items.coloring.kind === 'color' && (
              <ColorPicker
                disableAlpha
                value={bgStyle.items.coloring.color.color}
                onChange={(hex) => {
                  bgStyle.items.coloring.color.color = hex
                }}
                onAfterChange={updateBgItemsColoring}
              />
            )}
            {bgStyle.items.coloring.kind === 'gradient' && (
              <>
                <Box mr="1" display="inline-block">
                  <ColorPicker
                    disableAlpha
                    value={bgStyle.items.coloring.gradient.gradient.from}
                    onChange={(hex) => {
                      bgStyle.items.coloring.gradient.gradient.from = hex
                    }}
                    onAfterChange={updateBgItemsColoring}
                  />
                </Box>
                <Box mr="1" display="inline-block">
                  <ColorPicker
                    disableAlpha
                    value={shapeStyle.items.coloring.gradient.gradient.to}
                    onChange={(hex) => {
                      shapeStyle.items.coloring.gradient.gradient.to = hex
                    }}
                    onAfterChange={updateBgItemsColoring}
                  />
                </Box>
              </>
            )}
          </Box>

          <Stack direction="row" spacing="3" mt="3">
            <Slider
              css={css`
                flex: 1;
              `}
              label="Dim smaller items"
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

            <Slider
              css={css`
                flex: 1;
              `}
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
          </Stack>
        </Box>
      </>
    )
  }
)
