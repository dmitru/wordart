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
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
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

export type LeftPanelShapesTabProps = {}

const state = observable({
  isShowingCustomize: false,
  isShowingAddCustomImage: false,
  isTransforming: false,
})

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
        state.isShowingCustomize = false
        state.isTransforming = false
        state.isShowingAddCustomImage = false
      }
    }, [])

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
                shape={store.getSelectedShape()}
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
                  <ShapeOpacitySlider
                    style={shapeStyle}
                    onAfterChange={(value: number) => {
                      store.editor?.setShapeFillOpacity(value / 100)
                    }}
                  />
                </Box>

                <Flex marginTop="70px">
                  {!state.isShowingCustomize && (
                    <Tooltip
                      label="Customize colors, size and position"
                      isDisabled={state.isShowingCustomize}
                    >
                      <Button
                        mr="2"
                        variant="solid"
                        onClick={() => {
                          state.isShowingCustomize = true
                        }}
                      >
                        Customize
                      </Button>
                    </Tooltip>
                  )}

                  {state.isShowingCustomize && (
                    <Button
                      variantColor="green"
                      onClick={() => {
                        state.isShowingCustomize = false
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
                {state.isShowingCustomize && (
                  <motion.div
                    key="customize"
                    initial={{ x: 355, y: 0, opacity: 0 }}
                    transition={{ ease: 'easeInOut', duration: 0.2 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    exit={{ x: 355, y: 0, opacity: 0 }}
                  >
                    <Stack mb="4" p="2" position="absolute" width="100%">
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
                      {shape.kind === 'img' && (
                        <>
                          <Box height="30px" display="flex">
                            <Checkbox
                              display="flex"
                              height="34px"
                              isChecked={shape.processing?.invert.enabled}
                              onChange={(e) => {
                                shape.processing!.invert.enabled =
                                  e.target.checked
                              }}
                            >
                              Invert colors?
                            </Checkbox>
                            {shape.processing?.invert.enabled && (
                              <Box ml="3">
                                <ColorPicker
                                  value={shape.processing.invert.color}
                                  onChange={(color) => {
                                    shape.processing!.invert.color = chroma(
                                      color
                                    ).hex()
                                  }}
                                />
                              </Box>
                            )}
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

                {!state.isShowingCustomize && (
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
