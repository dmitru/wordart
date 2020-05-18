import {
  Box,
  Button,
  Collapse,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import {
  ShapeSelector,
  ShapeThumbnailBtn,
} from 'components/Editor/components/ShapeSelector'
import { getItemsColoring } from 'components/Editor/lib/editor'
import { ColorPicker } from 'components/shared/ColorPicker'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useCallback, useState } from 'react'
import { useStore } from 'services/root-store'

export type LeftPanelShapesTabProps = {}

const state = observable({
  isShowingColors: false,
  isSelectingShape: false,
})

export const LeftPanelShapesTab: React.FC<LeftPanelShapesTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    const shapeStyle = editorPageStore.styles.shape

    const visualize = useCallback(() => {
      editorPageStore.editor?.generateShapeItems({
        style: shapeStyle,
      })
    }, [])

    const [query, setQuery] = useState('')
    const matchingShapes = editorPageStore
      .getAvailableShapes()
      .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))

    const updateShapeColoring = useThrottleCallback(
      () => {
        editorPageStore.editor?.setShapeFillColors(shapeStyle.fill)
        if (shapeStyle.itemsColoring.kind === 'shape') {
          editorPageStore.editor?.setItemsColor(
            'shape',
            getItemsColoring(shapeStyle)
          )
        }
      },
      20,
      true
    )

    return (
      <>
        <Box>
          <>
            <Box display="flex" alignItems="flex-start" mb="3">
              <ShapeThumbnailBtn
                css={css`
                  width: 120px;
                  height: 120px;
                  min-width: 120px;

                  img {
                    width: 115px;
                    height: 115px;
                  }
                `}
                onClick={() => {
                  state.isSelectingShape = true
                }}
                backgroundColor="white"
                active={false}
                shape={editorPageStore.getSelectedShape()}
              />
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
                  <Slider
                    label="Opacity"
                    value={100 * shapeStyle.fill.opacity}
                    onChange={(value) => {
                      shapeStyle.fill.opacity = value / 100
                    }}
                    onAfterChange={(value) => {
                      editorPageStore.editor?.setShapeFillOpacity(value / 100)
                    }}
                    min={0}
                    max={100}
                    step={1}
                  />
                </Box>

                <Tooltip
                  label="Change shape colors"
                  isDisabled={state.isShowingColors}
                >
                  <Button
                    size="sm"
                    leftIcon="settings"
                    variant={state.isShowingColors ? 'solid' : 'solid'}
                    variantColor={state.isShowingColors ? 'primary' : undefined}
                    onClick={() => {
                      state.isShowingColors = !state.isShowingColors
                    }}
                  >
                    Colors
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            <Collapse isOpen={state.isShowingColors}>
              <Stack mb="4" p="2">
                {shapeStyle.fill.colorMap.length > 1 && (
                  <Box>
                    <Button
                      borderTopRightRadius="0"
                      borderBottomRightRadius="0"
                      px="2"
                      py="1"
                      mr="0"
                      size="xs"
                      variantColor="secondary"
                      variant={
                        shapeStyle.fill.kind === 'color-map'
                          ? 'solid'
                          : 'outline'
                      }
                      onClick={() => {
                        shapeStyle.fill.kind = 'color-map'
                        updateShapeColoring()
                      }}
                    >
                      Shape colors
                    </Button>
                    <Button
                      borderBottomLeftRadius="0"
                      borderTopLeftRadius="0"
                      px="2"
                      py="1"
                      mr="0"
                      size="xs"
                      variantColor="secondary"
                      variant={
                        shapeStyle.fill.kind === 'single-color'
                          ? 'solid'
                          : 'outline'
                      }
                      onClick={() => {
                        shapeStyle.fill.kind = 'single-color'
                        updateShapeColoring()
                      }}
                    >
                      Single color
                    </Button>
                  </Box>
                )}

                {shapeStyle.fill.kind === 'single-color' && (
                  <ColorPicker
                    disableAlpha
                    value={chroma(shapeStyle.fill.color).alpha(1).hex()}
                    onChange={(hex) => {
                      shapeStyle.fill.color = chroma(hex).hex()
                    }}
                    onAfterChange={() => {
                      updateShapeColoring()
                    }}
                  />
                )}

                {shapeStyle.fill.kind === 'color-map' && (
                  <Box>
                    {shapeStyle.fill.colorMap.map((color, index) => (
                      <Box mr="1" key={index} display="inline-block">
                        <ColorPicker
                          disableAlpha
                          value={chroma(color).alpha(1).hex()}
                          onChange={(hex) => {
                            shapeStyle.fill.colorMap[index] = chroma(hex).hex()
                          }}
                          onAfterChange={() => {
                            updateShapeColoring()
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Stack>
              {shapeStyle.processing.invert.enabled && (
                <ColorPicker
                  value={shapeStyle.processing.invert.color}
                  onChange={(color) => {
                    shapeStyle.processing.invert.color = chroma(color).hex()
                    visualize()
                  }}
                />
              )}
            </Collapse>

            <Box>
              <Box>
                <InputGroup>
                  <InputLeftElement children={<Icon name="search" />} />
                  <Input
                    placeholder="Search shapes..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </InputGroup>
              </Box>

              <ShapeSelector
                height="calc(100vh - 320px)"
                overflowY="auto"
                shapes={matchingShapes}
                onSelected={(shape) => {
                  editorPageStore.selectShape(shape.id)
                }}
                selectedShapeId={editorPageStore.getSelectedShape().id}
              />
            </Box>
          </>
        </Box>
      </>
    )
  }
)
