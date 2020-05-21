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
  MenuItem,
  MenuList,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  MenuGroup,
  MenuDivider,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import {
  ShapeSelector,
  ShapeThumbnailBtn,
} from 'components/Editor/components/ShapeSelector'
import { Label } from 'components/Editor/components/shared'
import { getItemsColoring } from 'components/Editor/lib/editor'
import { ColorPicker } from 'components/shared/ColorPicker'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useCallback, useState } from 'react'
import { useStore } from 'services/root-store'

export type LeftPanelShapesTabProps = {}

const state = observable({
  isShowingColors: false,
  isShowingAdjust: false,
})

export const LeftPanelShapesTab: React.FC<LeftPanelShapesTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    const shapeStyle = editorPageStore.styles.shape

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

                <Flex>
                  <Tooltip
                    label="Customize colors, size and position"
                    isDisabled={state.isShowingColors}
                  >
                    <Button
                      size="sm"
                      mr="2"
                      variant={state.isShowingColors ? 'solid' : 'solid'}
                      variantColor={
                        state.isShowingColors ? 'primary' : undefined
                      }
                      onClick={() => {
                        state.isShowingColors = !state.isShowingColors
                      }}
                    >
                      Customize
                    </Button>
                  </Tooltip>
                </Flex>
              </Box>
            </Box>

            <Box>
              {state.isShowingColors && (
                <>
                  <Stack mb="4" p="2">
                    <Heading size="md" m="0">
                      Shape colors
                    </Heading>
                    {shapeStyle.fill.colorMap.length > 1 && (
                      <Box>
                        <Tabs
                          variantColor="gray"
                          index={shapeStyle.fill.kind == 'color-map' ? 0 : 1}
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
                              <ColorPicker
                                disableAlpha
                                value={chroma(shapeStyle.fill.color)
                                  .alpha(1)
                                  .hex()}
                                onChange={(hex) => {
                                  shapeStyle.fill.color = chroma(hex).hex()
                                }}
                                onAfterChange={() => {
                                  updateShapeColoring()
                                }}
                              />
                            </TabPanel>
                          </TabPanels>
                        </Tabs>
                      </Box>
                    )}
                    {shapeStyle.fill.colorMap.length === 1 && (
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
                    {shapeStyle.processing.invert.enabled && (
                      <ColorPicker
                        value={shapeStyle.processing.invert.color}
                        onChange={(color) => {
                          shapeStyle.processing.invert.color = chroma(
                            color
                          ).hex()
                          visualize()
                        }}
                      />
                    )}

                    <Box mt="5">
                      <Heading size="md" m="0">
                        Size and position
                      </Heading>
                    </Box>

                    <Flex mt="4">
                      <Button
                        variantColor="green"
                        onClick={() => {
                          state.isShowingColors = false
                        }}
                      >
                        Done
                      </Button>
                    </Flex>
                  </Stack>
                </>
              )}

              {!state.isShowingColors && !state.isShowingAdjust && (
                <>
                  <Flex mt="5">
                    <Tooltip label="Add custom image...">
                      <Button
                        leftIcon="add"
                        variantColor="green"
                        size="sm"
                        mr="2"
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
                            top: 40px;
                            z-index: 10;
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
                    height="calc(100vh - 350px)"
                    overflowY="auto"
                    shapes={matchingShapes}
                    onSelected={(shape) => {
                      editorPageStore.selectShape(shape.id)
                    }}
                    selectedShapeId={editorPageStore.getSelectedShape().id}
                  />
                </>
              )}
            </Box>
          </>
        </Box>
      </>
    )
  }
)
