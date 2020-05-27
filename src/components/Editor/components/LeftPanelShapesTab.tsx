import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Checkbox,
  Textarea,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import paper from 'paper'
import { AddCustomImageModal } from 'components/Editor/components/AddCustomImageModal'
import {
  ShapeSelector,
  ShapeThumbnailBtn,
} from 'components/Editor/components/ShapeSelector'
import { Label } from 'components/Editor/components/shared'
import { getItemsColoring } from 'components/Editor/lib/editor'
import { ColorPicker } from 'components/shared/ColorPicker'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { AnimatePresence, motion } from 'framer-motion'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useCallback, useEffect, useState } from 'react'
import { useStore } from 'services/root-store'
import { useDebouncedCallback } from 'use-debounce/lib'
import { CustomizeRasterImageModal } from 'components/Editor/components/CustomizeRasterImageModal'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { fabric } from 'fabric'
import { createMultilineFabricTextGroup } from 'components/Editor/lib/fabric-utils'

export type LeftPanelShapesTabProps = {}

type TabMode = 'home' | 'customize shape' | 'add text shape'

const initialState = {
  mode: 'home' as TabMode,
  isShowingAddCustomImage: false,
  isShowingCustomizeImage: false,
  isTransforming: false,
  textShape: {
    thumbnailPreview: '',
    text: '',
    // TODO: font id
    color: {
      kind: 'single',
      invert: false,
      color: 'red',
    } as
      | {
          kind: 'single'
          invert: boolean
          color: string
        }
      | {
          kind: 'letters'
          colors: string[]
        },
  },
}
const state = observable({ ...initialState })

const ShapeOpacitySlider = observer(({ style, onAfterChange }: any) => (
  <Slider
    label="Opacity"
    value={100 * style.fill.opacity}
    onChange={(value) => {
      style.fill.opacity = value / 100
    }}
    onAfterChange={onAfterChange}
    min={0}
    max={100}
    step={1}
  />
))

export const LeftPanelShapesTab: React.FC<LeftPanelShapesTabProps> = observer(
  () => {
    const { editorPageStore: store } = useStore()
    const shapeStyle = store.styles.shape
    const shape = store.getSelectedShape()

    const [term, setTerm] = useState('')
    const allOptions = [
      'Animals',
      'Baby',
      'Birthday',
      'Christmas',
      'Clouds',
      'Geometric Shapes',
      'Emoji',
      'Icons',
      'Love & Wedding',
      'Nature',
      'Music',
      'Money & Business',
      'People',
      'Education & School',
      'Sports',
      'Transport',
      'Other',
    ].map((value) => ({ value, label: value }))

    const [options, setOptions] = useState(allOptions)
    const [selectedOption, setSelectedOption] = useState<{
      value: string
    } | null>(null)

    const visualize = useCallback(() => {
      store.editor?.generateShapeItems({
        style: shapeStyle,
      })
    }, [])

    const [query, setQuery] = useState('')
    const matchingShapes = store
      .getAvailableShapes()
      .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))

    const [updateShapeColoring] = useDebouncedCallback(
      async () => {
        await store.editor?.setShapeFillColors(shapeStyle.fill)
        store.updateShapeThumbnail()
        if (shapeStyle.itemsColoring.kind === 'shape') {
          store.editor?.setItemsColor('shape', getItemsColoring(shapeStyle))
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
        if (state.isTransforming) {
          store.editor?.deselectShape()
        }
        Object.assign(state, initialState)
      }
    }, [])

    const updateTextThumbnailPreview = async () => {
      const fontInfo = store.getAvailableFonts()[4]
      const font = await store.fetchFontById(fontInfo.style.fontId)
      if (!font) {
        return
      }

      const canvasSize = 400
      const pad = 10
      const fontSize = 100

      const canvas = createCanvas({ w: canvasSize, h: canvasSize })
      const c = new fabric.StaticCanvas(canvas)

      const text = state.textShape.text || 'Preview'
      const group = createMultilineFabricTextGroup(
        text,
        font,
        fontSize,
        state.textShape.color.kind === 'single'
          ? state.textShape.color.color
          : state.textShape.color.colors[0]
      )
      if (group.height! > group.width!) {
        group.scaleToHeight(canvasSize - 2 * pad)
      } else {
        group.scaleToWidth(canvasSize - 2 * pad)
      }
      group.setPositionByOrigin(
        new fabric.Point(canvasSize / 2, canvasSize / 2),
        'center',
        'center'
      )
      c.add(group)

      c.renderAll()
      state.textShape.thumbnailPreview = c.toDataURL()
      c.dispose()
    }

    return (
      <>
        <Box>
          <>
            <Box display="flex" alignItems="flex-start" mb="3">
              <ShapeThumbnailBtn
                css={css`
                  width: 180px;
                  height: 180px;
                  min-width: 180px;

                  img {
                    width: 175px;
                    height: 175px;
                  }
                `}
                backgroundColor="white"
                url={
                  (state.mode === 'add text shape'
                    ? state.textShape.thumbnailPreview
                    : shape.thumbnailUrl || shape.url)!
                }
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
                  {state.mode !== 'add text shape' && (
                    <ShapeOpacitySlider
                      style={shapeStyle}
                      onAfterChange={(value: number) => {
                        store.editor?.setShapeFillOpacity(value / 100)
                      }}
                    />
                  )}
                </Box>

                <Flex marginTop="70px">
                  {state.mode === 'home' && (
                    <Tooltip
                      label="Customize colors, size and position"
                      isDisabled={state.mode === 'customize shape'}
                    >
                      <Button
                        mr="2"
                        variant="solid"
                        onClick={() => {
                          state.mode = 'customize shape'
                        }}
                      >
                        Customize
                      </Button>
                    </Tooltip>
                  )}

                  {state.mode === 'customize shape' && (
                    <Button
                      variantColor="green"
                      onClick={() => {
                        state.mode = 'home'
                        if (state.isTransforming) {
                          state.isTransforming = false
                          store.editor?.deselectShape()
                          store.editor?.generateShapeItems({
                            style: store.styles.shape,
                          })
                        }
                      }}
                    >
                      Done
                    </Button>
                  )}
                </Flex>
              </Box>
            </Box>

            <Box
              position="relative"
              overflow="auto"
              overflowX="hidden"
              width="100%"
              height="calc(100vh - 255px)"
            >
              <AnimatePresence initial={false}>
                {state.mode === 'add text shape' && (
                  <motion.div
                    key="customize"
                    initial={{ x: 355, y: 0, opacity: 0 }}
                    transition={{ ease: 'easeInOut', duration: 0.2 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    exit={{ x: 355, y: 0, opacity: 0 }}
                  >
                    <Stack mb="4" p="2" position="absolute" width="100%">
                      <Heading size="md" m="0" mb="3" display="flex">
                        Add Text Shape
                      </Heading>
                      <Textarea
                        autoFocus
                        value={state.textShape.text}
                        onChange={(e) => {
                          state.textShape.text = e.target.value
                          updateTextThumbnailPreview()
                        }}
                        placeholder="Type text here..."
                      />
                      <ColorPicker
                        value={
                          state.textShape.color.kind === 'single'
                            ? state.textShape.color.color
                            : state.textShape.color.colors[0]
                        }
                        onChange={(color) => {
                          state.textShape.color = {
                            kind: 'single',
                            color,
                            invert: false,
                          }
                          updateTextThumbnailPreview()
                        }}
                      />

                      <Box mt="3">
                        <Button
                          variantColor="accent"
                          size="lg"
                          onClick={async () => {
                            const shapeId = store.addCustomShapeText({
                              kind: 'text',
                              text: state.textShape.text,
                              // @ts-ignore
                              color: state.textShape.color.color,
                              fontId: store.getAvailableFonts()[2].style.fontId,
                              title: 'Custom text',
                              fillConfig: {
                                kind: 'original',
                                color: 'black',
                                colorMap: [],
                                defaultColorMap: [],
                                opacity: 1,
                              },
                              isCustom: true,
                            })
                            state.mode = 'home'
                            await store.selectShape(shapeId)
                            store.updateShapeThumbnail()
                          }}
                        >
                          Done
                        </Button>
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={() => {
                            state.mode = 'home'
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Stack>
                  </motion.div>
                )}

                {state.mode === 'customize shape' && (
                  <motion.div
                    key="customize"
                    initial={{ x: 355, y: 0, opacity: 0 }}
                    transition={{ ease: 'easeInOut', duration: 0.2 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    exit={{ x: 355, y: 0, opacity: 0 }}
                  >
                    <Stack mb="4" p="2" position="absolute" width="100%">
                      {shape.kind === 'svg' && (
                        <Heading size="md" m="0" mb="3" display="flex">
                          Customize Colors
                          <Button
                            variant="ghost"
                            variantColor="blue"
                            size="sm"
                            marginLeft="auto"
                          >
                            Reset
                          </Button>
                        </Heading>
                      )}
                      {shape.kind === 'svg' &&
                        shapeStyle.fill.colorMap.length > 1 && (
                          <Box mt="3">
                            <Tabs
                              variantColor="primary"
                              index={
                                shapeStyle.fill.kind == 'color-map' ? 0 : 1
                              }
                              variant="solid-rounded"
                              size="sm"
                              onChange={(index) => {
                                if (index === 0) {
                                  shapeStyle.fill.kind = 'color-map'
                                  updateShapeColoring()
                                } else {
                                  shapeStyle.fill.kind = 'single-color'
                                  updateShapeColoring()
                                }
                              }}
                            >
                              <TabList mb="1em">
                                <Tab>Multiple</Tab>
                                <Tab>Single</Tab>
                              </TabList>
                              <TabPanels>
                                <TabPanel>
                                  <Box>
                                    {shapeStyle.fill.colorMap.map(
                                      (color, index) => (
                                        <Box
                                          mr="1"
                                          mb="2"
                                          key={index}
                                          display="inline-block"
                                        >
                                          <ColorPicker
                                            disableAlpha
                                            value={chroma(color).alpha(1).hex()}
                                            onChange={(hex) => {
                                              shapeStyle.fill.colorMap[
                                                index
                                              ] = chroma(hex).hex()
                                            }}
                                            onAfterChange={() => {
                                              updateShapeColoring()
                                            }}
                                          />
                                        </Box>
                                      )
                                    )}
                                  </Box>
                                </TabPanel>
                                <TabPanel>
                                  <Box mr="1" mb="2">
                                    <ColorPicker
                                      disableAlpha
                                      value={chroma(shapeStyle.fill.color)
                                        .alpha(1)
                                        .hex()}
                                      onChange={(hex) => {
                                        shapeStyle.fill.color = chroma(
                                          hex
                                        ).hex()
                                      }}
                                      onAfterChange={() => {
                                        updateShapeColoring()
                                      }}
                                    />
                                  </Box>
                                </TabPanel>
                              </TabPanels>
                            </Tabs>
                          </Box>
                        )}
                      {shape.kind === 'svg' &&
                        shapeStyle.fill.colorMap.length === 1 && (
                          <ColorPicker
                            disableAlpha
                            value={chroma(shapeStyle.fill.color).alpha(1).hex()}
                            onChange={(hex) => {
                              shapeStyle.fill.kind = 'single-color'
                              shapeStyle.fill.color = chroma(hex).hex()
                            }}
                            onAfterChange={() => {
                              updateShapeColoring()
                            }}
                          />
                        )}
                      {shape.kind === 'img' && shape.processing && (
                        <>
                          <Heading size="md" m="0" mb="3" display="flex">
                            Image
                          </Heading>

                          <Box>
                            <Button
                              variantColor="accent"
                              onClick={() => {
                                state.isShowingCustomizeImage = true
                              }}
                            >
                              Customize Image
                            </Button>
                          </Box>
                        </>
                      )}

                      <Box mt="6">
                        <Heading size="md" m="0" display="flex">
                          Resize, rotate, transform
                          <Button
                            variant="ghost"
                            variantColor="blue"
                            size="sm"
                            marginLeft="auto"
                          >
                            Reset
                          </Button>
                        </Heading>
                        {!state.isTransforming && (
                          <>
                            <Text mt="2">
                              All unlocked words will be re-visualized.
                            </Text>
                            <Button
                              variantColor="accent"
                              onClick={() => {
                                state.isTransforming = true
                                store.editor?.selectShape()
                              }}
                            >
                              Transform shape
                            </Button>
                          </>
                        )}

                        {state.isTransforming && (
                          <>
                            <Text mt="2">
                              Drag the shape to move or rotate it.
                            </Text>
                            <Stack direction="row" mt="3" spacing="3">
                              <Button
                                variantColor="accent"
                                onClick={() => {
                                  state.isTransforming = false
                                  store.editor?.deselectShape()
                                  store.editor?.generateShapeItems({
                                    style: store.styles.shape,
                                  })
                                }}
                              >
                                Apply
                              </Button>
                              <Tooltip label="Center shape and restore its original size">
                                <Button ml="3">Reset original</Button>
                              </Tooltip>
                            </Stack>
                          </>
                        )}
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
                    <Box position="absolute" width="100%" height="100%">
                      <Flex mt="5">
                        <Tooltip label="Add custom image...">
                          <Button
                            leftIcon="add"
                            variantColor="green"
                            size="sm"
                            mr="2"
                            onClick={() => {
                              state.isShowingAddCustomImage = true
                            }}
                          >
                            Image
                          </Button>
                        </Tooltip>

                        <Tooltip label="Use text as a shape...">
                          <Button
                            leftIcon="add"
                            variantColor="green"
                            size="sm"
                            mr="2"
                            onClick={() => {
                              state.mode = 'add text shape'
                              updateTextThumbnailPreview()
                            }}
                          >
                            Text
                          </Button>
                        </Tooltip>

                        <InputGroup size="sm">
                          <InputLeftElement children={<Icon name="search" />} />
                          <Input
                            _placeholder={{
                              color: 'red',
                            }}
                            placeholder="Search shapes..."
                            value={term}
                            onChange={(e: any) => setTerm(e.target.value)}
                          />
                          {!!term && (
                            <InputRightElement
                              onClick={() => setTerm('')}
                              children={
                                <IconButton
                                  aria-label="Clear"
                                  icon="close"
                                  color="gray"
                                  isRound
                                  variant="ghost"
                                  size="sm"
                                />
                              }
                            />
                          )}
                        </InputGroup>
                      </Flex>

                      <Flex align="center" mt="2" mb="1">
                        <Label mr="2">Category:</Label>

                        <Box flex={1}>
                          <Menu>
                            <MenuButton
                              variant="link"
                              variantColor="primary"
                              as={Button}
                              rightIcon="chevron-down"
                              py="2"
                              px="3"
                            >
                              {selectedOption ? selectedOption.value : 'All'}
                            </MenuButton>
                            <MenuList
                              as="div"
                              css={css`
                                background: white;
                                position: absolute;
                                top: 0px !important;
                                margin-top: 0 !important;
                                z-index: 5000 !important;
                                max-height: 300px;
                                overflow: auto;
                              `}
                            >
                              <MenuItem onClick={() => setSelectedOption(null)}>
                                Show all
                              </MenuItem>
                              <MenuDivider />
                              {options.map((item, index) => (
                                <MenuItem
                                  key={item.value}
                                  onClick={() => setSelectedOption(item)}
                                >
                                  {item.value}
                                </MenuItem>
                              ))}
                            </MenuList>
                          </Menu>
                        </Box>

                        {!!selectedOption && (
                          <Button
                            ml="3"
                            variant="link"
                            onClick={() => {
                              setSelectedOption(null)
                            }}
                          >
                            Show all
                          </Button>
                        )}
                      </Flex>

                      <ShapeSelector
                        height="calc(100vh - 370px)"
                        width="345px"
                        overflowY="scroll"
                        shapes={matchingShapes}
                        onSelected={(shape) => {
                          store.selectShape(shape.id)
                        }}
                        selectedShapeId={store.getSelectedShape().id}
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </>
        </Box>

        <CustomizeRasterImageModal
          isOpen={state.isShowingCustomizeImage}
          value={{
            invert: shape.processing?.invert.enabled || false,
            invertColor: shape.processing?.invert.color || 'black',
            removeLightBackground:
              shape.processing?.removeLightBackground.threshold || 0,
            originalUrl: shape.url,
          }}
          onClose={() => {
            state.isShowingCustomizeImage = false
          }}
          onSubmit={async (thumbnailUrl, value) => {
            shape.thumbnailUrl = thumbnailUrl
            shape.processing = {
              invert: {
                enabled: value.invert,
                color: value.invertColor,
              },
              removeLightBackground: {
                enabled: true,
                threshold: value.removeLightBackground,
              },
              edges: {
                enabled: false,
                amount: 0,
              },
            }
            await store.updateShape()
            store.updateShapeThumbnail()
          }}
        />

        <AddCustomImageModal
          isOpen={state.isShowingAddCustomImage}
          onClose={() => {
            state.isShowingAddCustomImage = false
          }}
          onSubmit={({ thumbnailUrl, state }) => {
            const customImgId = store.addCustomShapeImg({
              kind: 'img',
              title: 'Custom',
              url: state.originalUrl!,
              thumbnailUrl,
              isCustom: true,
              processing: {
                edges: {
                  enabled: false,
                  amount: 0,
                },
                invert: {
                  enabled: state.invert,
                  color: state.invertColor,
                },
                removeLightBackground: {
                  enabled: true,
                  threshold: state.removeLightBackground,
                },
              },
            })
            store.selectShape(customImgId)
          }}
        />
      </>
    )
  }
)
