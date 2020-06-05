import {
  Box,
  Button,
  Heading,
  Flex,
  Text,
  Stack,
  Divider,
} from '@chakra-ui/core'
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
        {/* <shape-color> */}
        <Box mb="6">
          <Flex direction="column">
            <Text fontSize="xl">Shape</Text>
            <Box mb="3">
              <Slider
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
            </Box>

            {shape?.kind === 'text' && (
              <Box mb="5">
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
              </Box>
            )}

            {/* <svg-shape */}
            {shape?.kind === 'svg' && (
              <>
                {/* <svg-color-options> */}
                <Box
                  mb="2"
                  display="flex"
                  flexDirection="row"
                  alignItems="flex-start"
                >
                  <Text fontSize="md" mr="3" width="65px">
                    Fill:
                  </Text>

                  <Box>
                    <Flex direction="row">
                      <Button
                        px="2"
                        py="1"
                        mr="0"
                        size="sm"
                        variant={
                          shape.config.processing.colors.kind === 'original'
                            ? 'solid'
                            : 'outline'
                        }
                        variantColor={
                          shape.config.processing.colors.kind === 'original'
                            ? 'secondary'
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
                        variant={
                          shape.config.processing.colors.kind === 'color-map'
                            ? 'solid'
                            : 'outline'
                        }
                        variantColor={
                          shape.config.processing.colors.kind === 'color-map'
                            ? 'secondary'
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
                        Multicolor
                      </Button>

                      <Button
                        px="2"
                        py="1"
                        mr="0"
                        size="sm"
                        variant={
                          shape.config.processing.colors.kind === 'single-color'
                            ? 'solid'
                            : 'outline'
                        }
                        variantColor={
                          shape.config.processing.colors.kind === 'single-color'
                            ? 'secondary'
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
                    </Flex>

                    {shape.config.processing.colors.kind === 'single-color' && (
                      <Box mb="4" mt="2">
                        <ColorPicker
                          disableAlpha
                          value={chroma(shape.config.processing.colors.color)
                            .alpha(1)
                            .hex()}
                          onChange={(hex) => {
                            if (
                              shape.config.processing.colors.kind ===
                              'single-color'
                            ) {
                              shape.config.processing.colors.color = chroma(
                                hex
                              ).hex()
                            }
                          }}
                          onAfterChange={() => {
                            updateShapeColoring()
                          }}
                        />
                      </Box>
                    )}

                    {shape.config.processing.colors.kind === 'color-map' && (
                      <Box mb="4" mt="2">
                        {shape.config.processing.colors.colors.map(
                          (color, index) => (
                            <Box mr="1" key={index} display="inline-block">
                              <ColorPicker
                                disableAlpha
                                value={chroma(color).alpha(1).hex()}
                                onChange={(hex) => {
                                  if (
                                    shape.config.processing.colors.kind ===
                                    'color-map'
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
                          )
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
                {/* <svg-color-options> */}
              </>
            )}
            {/* </svg-shape> */}
          </Flex>
        </Box>
        {/* </shape-color> */}

        {/* <shape-items> */}
        <Box mb="6" mt="35px">
          <Box
            mb="2"
            display="flex"
            flexDirection="row"
            alignItems="flex-start"
          >
            <Text fontSize="md" mr="3" width="65px">
              Items:
            </Text>

            <Box>
              <Flex direction="row">
                <Button
                  px="2"
                  py="1"
                  mr="0"
                  size="sm"
                  variant={
                    shapeStyle.items.coloring.kind === 'shape'
                      ? 'solid'
                      : 'outline'
                  }
                  variantColor={
                    shapeStyle.items.coloring.kind === 'shape'
                      ? 'secondary'
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
                  variant={
                    shapeStyle.items.coloring.kind === 'gradient'
                      ? 'solid'
                      : 'outline'
                  }
                  variantColor={
                    shapeStyle.items.coloring.kind === 'gradient'
                      ? 'secondary'
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
                      ? 'secondary'
                      : undefined
                  }
                  variant={
                    shapeStyle.items.coloring.kind === 'color'
                      ? 'solid'
                      : 'outline'
                  }
                  onClick={() => {
                    shapeStyle.items.coloring.kind = 'color'
                    updateShapeItemsColoring()
                  }}
                >
                  Color
                </Button>
              </Flex>

              <Box mt="2">
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
            </Box>
          </Box>

          <Stack direction="column" spacing="3" mt="3">
            <Slider
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

            <Slider
              css={css`
                flex: 1;
              `}
              horizontal
              label="Emphasize size"
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
          </Stack>
        </Box>
        {/* </shape-items> */}

        <Divider />

        {/* <background> */}

        <Box>
          <Text fontSize="xl">Background</Text>
          <Stack direction="row" spacing="3">
            <Box
              mb="6"
              display="flex"
              alignItems="flex-start"
              flex="1"
              justifyContent="flex-start"
            >
              <Text fontSize="md" mr="3">
                Items:
              </Text>

              <Box>
                <Box flex="1" width="130px">
                  <Button
                    px="2"
                    py="1"
                    size="sm"
                    variant={
                      bgStyle.items.coloring.kind === 'gradient'
                        ? 'solid'
                        : 'outline'
                    }
                    variantColor={
                      bgStyle.items.coloring.kind === 'gradient'
                        ? 'secondary'
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
                    variant={
                      bgStyle.items.coloring.kind === 'color'
                        ? 'solid'
                        : 'outline'
                    }
                    variantColor={
                      bgStyle.items.coloring.kind === 'color'
                        ? 'secondary'
                        : undefined
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
              </Box>
            </Box>

            <Box mb="6" display="flex" alignItems="flex-start">
              <Text fontSize="md" mr="3">
                Fill:
              </Text>

              <ColorPicker
                value={chroma(bgStyle.fill.color.color).alpha(1).hex()}
                onChange={(hex) => {
                  bgStyle.fill.color.color = chroma(hex).hex()
                  store.editor?.setBgColor(bgStyle.fill.color)
                }}
              />
            </Box>
          </Stack>

          <Stack direction="column" spacing="3">
            <Slider
              css={css`
                flex: 1;
              `}
              horizontal
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

            <Slider
              css={css`
                flex: 1;
              `}
              horizontal
              label="Emphasize size"
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
          </Stack>
        </Box>
        {/* </background> */}
      </>
    )
  }
)
