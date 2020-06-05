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
  ThemePreset,
} from 'components/Editor/style'
import { ColorPicker } from 'components/shared/ColorPicker'
import { Slider } from 'components/shared/Slider'
import { observer, useLocalStore } from 'mobx-react'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce/lib'
import css from '@emotion/css'
import { themePresets } from 'components/Editor/theme-presets'
import styled from '@emotion/styled'

export type LeftPanelColorsTabProps = {
  target: TargetKind
}

export const ThemePresetThumbnail: React.FC<{ theme: ThemePreset }> = ({
  theme,
}) => {
  let shapeItemsColor = 'black'
  if (theme.shapeItemsColoring.kind === 'color') {
    shapeItemsColor = theme.shapeItemsColoring.color
  } else if (theme.shapeItemsColoring.kind === 'gradient') {
    shapeItemsColor = theme.shapeItemsColoring.gradient.from
  } else if (theme.shapeItemsColoring.kind === 'shape') {
    shapeItemsColor = theme.shapeFill
  }

  let bgItemsColor = 'black'
  if (theme.bgItemsColoring.kind === 'color') {
    bgItemsColor = theme.bgItemsColoring.color
  } else if (theme.bgItemsColoring.kind === 'gradient') {
    bgItemsColor = theme.bgItemsColoring.gradient.from
  }

  return (
    <svg
      width="100px"
      height="76px"
      viewBox="0 0 319 240"
      version="1.1"
      style={{ border: '1px solid #888' }}
    >
      <g
        id="Page-1"
        stroke="none"
        stroke-width="1"
        fill="none"
        fill-rule="evenodd"
      >
        <g id="Group-2">
          <rect
            id="Rectangle"
            fill={theme.bgFill}
            x="0"
            y="0"
            width="319"
            height="240"
          ></rect>
          <g id="Group" transform="translate(50.000000, 51.000000)">
            <rect
              id="Rectangle"
              fill={theme.shapeFill}
              opacity={theme.shapeOpacity}
              x="0"
              y="0"
              width="218"
              height="140"
              rx="29"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="16"
              y="29"
              width="112"
              height="21"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="68"
              y="67"
              width="84"
              height="17"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="56"
              y="99"
              width="72"
              height="22"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="152"
              y="33"
              width="54"
              height="17"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="168"
              y="80"
              width="23"
              height="39"
            ></rect>
            <rect
              id="Rectangle"
              fill={shapeItemsColor}
              x="17"
              y="65"
              width="23"
              height="39"
            ></rect>
          </g>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="149"
            y="15"
            width="83"
            height="18"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="66"
            y="204"
            width="83"
            height="18"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="16"
            y="20"
            width="23"
            height="59"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="14"
            y="185"
            width="25"
            height="38"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="279"
            y="32"
            width="25"
            height="38"
          ></rect>
          <rect
            id="Rectangle"
            fill={bgItemsColor}
            x="279"
            y="147"
            width="25"
            height="77"
          ></rect>
        </g>
      </g>
    </svg>
  )
}

const ThemePresetThumbnailContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;

  transition: 0.2s transform;
  &:hover {
    transform: scale(1.05);
  }
`

const ThemePresetThumbnails = styled(Box)`
  > * {
    margin-right: 10px;
  }

  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
`

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
        <Box mb="6">
          <Text fontSize="xl">Themes</Text>
          <ThemePresetThumbnails display="flex" flexDirection="row">
            {themePresets.map((theme) => (
              <ThemePresetThumbnailContainer
                aria-role="button"
                key={theme.title}
                onClick={() => {
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
                  } else if (shape?.kind === 'text') {
                    shape.config.textStyle.color = theme.shapeFill
                  }

                  // Shape items coloring
                  shapeStyle.items.coloring.kind = theme.shapeItemsColoring.kind
                  if (theme.shapeItemsColoring.kind === 'color') {
                    shapeStyle.items.coloring.color = theme.shapeItemsColoring
                  } else if (theme.shapeItemsColoring.kind === 'gradient') {
                    shapeStyle.items.coloring.gradient =
                      theme.shapeItemsColoring
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

                  // <apply-update>
                  updateShapeColoring()
                  updateShapeItemsColoring()
                  updateBgItemsColoring()
                  store.editor?.setBgColor(bgStyle.fill.color)
                  // </apply-update>
                }}
              >
                <ThemePresetThumbnail theme={theme} />
                {theme.title}
              </ThemePresetThumbnailContainer>
            ))}
          </ThemePresetThumbnails>
        </Box>

        <Divider />

        {/* <shape-color> */}
        <Box mb="0">
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
        <Box mb="6">
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
