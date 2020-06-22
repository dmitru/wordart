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
  Text,
  Textarea,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import { AddCustomImageModal } from 'components/Editor/components/AddCustomImageModal'
import { CustomizeRasterImageModal } from 'components/Editor/components/CustomizeRasterImageModal'
import {
  ShapeSelector,
  ShapeThumbnailBtn,
} from 'components/Editor/components/ShapeSelector'
import { SvgShapeColorPickerCollapse } from 'components/Editor/components/SvgShapeColorPicker'
import {
  applyTransformToObj,
  createMultilineFabricTextGroup,
} from 'components/Editor/lib/fabric-utils'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { fabric } from 'fabric'
import { AnimatePresence, motion } from 'framer-motion'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { isEqual } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect, useState } from 'react'
import { MatrixSerialized } from 'services/api/persisted/v1'
import { useStore } from 'services/root-store'
import { FaCog } from 'react-icons/fa'
import { useDebouncedCallback } from 'use-debounce/lib'
import { FontPicker } from 'components/Editor/components/FontPicker'
import { SectionLabel } from 'components/Editor/components/shared'

export type LeftPanelShapesTabProps = {}

type TabMode = 'home' | 'customize shape' | 'add text shape'

const initialState = {
  mode: 'home' as TabMode,
  isShowingAddCustomImage: false,
  isShowingCustomizeImage: false,
  textShape: {
    thumbnailPreview: '',
    text: '',
    // TODO: font id
    color: {
      kind: 'single',
      invert: false,
      color: 'black',
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
const state = observable<typeof initialState>({ ...initialState })

const ShapeOpacitySlider = observer(({ style, onAfterChange }: any) => (
  <Slider
    label="Opacity"
    afterLabel="%"
    value={100 * style.opacity}
    onChange={(value) => {
      style.opacity = value / 100
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
    const shapeStyle = store.styleOptions.shape
    const shape = store.getShape()

    const {
      // @ts-ignore
      renderKey, // eslint-disable-line
    } = store

    const allCategoryOptions = [
      ['animals', 'Animals & Pets'],
      ['icons', 'Icons'],
      ['geo', 'Countries & Earth'],
      ['other', 'Others'],
      // 'Baby',
      // 'Birthday',
      // 'Christmas',
      // 'Clouds',
      // 'Geometric Shapes',
      // 'Emoji',
      // 'Icons',
      // 'Love & Wedding',
      // 'Nature',
      // 'Music',
      // 'Money & Business',
      // 'People',
      // 'Education & School',
      // 'Sports',
      // 'Transport',
      // 'Other',
    ].map(([value, label]) => ({ value, label }))

    const shapesPerCategoryCounts = allCategoryOptions.map(
      ({ value }) =>
        store
          .getAvailableShapes()
          .filter((s) => (s.categories || []).includes(value)).length
    )

    const [selectedCategory, setSelectedCategory] = useState<{
      value: string
      label: string
    } | null>(null)

    const fonts = store.getAvailableFonts()
    const [selectedFontId, setSelectedFontId] = useState(fonts[0].style.fontId)
    const [query, setQuery] = useState('')
    const matchingShapes = store
      .getAvailableShapes()
      .filter(
        (s) =>
          (!query ||
            (query && s.title.toLowerCase().includes(query.toLowerCase()))) &&
          (!selectedCategory ||
            (selectedCategory &&
              (s.categories || []).includes(selectedCategory.value)))
      )

    const [updateShapeColoring] = useDebouncedCallback(
      async () => {
        if (!shape) {
          return
        }
        const style = mkShapeStyleConfFromOptions(shapeStyle)
        await store.editor?.updateShapeColors(shape.config)
        store.updateShapeThumbnail()
        if (style.items.coloring.kind === 'shape') {
          store.editor?.setShapeItemsStyle(style.items)
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
        if (store.leftTabIsTransformingShape) {
          store.editor?.deselectShape()
        }
        Object.assign(state, initialState)
        store.leftTabIsTransformingShape = false
      }
    }, [])

    const updateTextThumbnailPreview = async () => {
      const fontInfo = store.getFontById(selectedFontId)
      if (!fontInfo) {
        return
      }
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

    useEffect(() => {
      updateTextThumbnailPreview()
    }, [selectedFontId])

    const resetTransformBtn =
      shape && !isEqual(shape.originalTransform, shape.transform) ? (
        <Tooltip
          label="Center shape and restore its original size"
          isDisabled={isEqual(shape.originalTransform, shape.transform)}
        >
          <Button
            ml="3"
            onClick={() => {
              store.editor?.clearItems('shape')
              store.editor?.clearItems('bg')
              applyTransformToObj(shape.obj, shape.originalTransform)
              shape.transform = [...shape.originalTransform] as MatrixSerialized
              store.renderKey++
            }}
          >
            Reset original
          </Button>
        </Tooltip>
      ) : null

    return (
      <>
        <Box p="3">
          <>
            <Box display="flex" alignItems="flex-start" mb="3">
              {shape && (
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
                      : shape.config.processedThumbnailUrl)!
                  }
                />
              )}
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
                        store.editor?.setShapeOpacity(value / 100)
                      }}
                    />
                  )}
                </Box>

                <Flex marginTop="70px" width="100%">
                  {state.mode === 'home' && (
                    <Tooltip
                      label="Customize colors, size and position"
                      isDisabled={(state.mode as TabMode) === 'customize shape'}
                    >
                      <Button
                        mr="2"
                        variant="solid"
                        display="flex"
                        flex="1"
                        onClick={() => {
                          state.mode = 'customize shape'
                        }}
                      >
                        <FaCog style={{ marginRight: '5px' }} />
                        Customize
                      </Button>
                    </Tooltip>
                  )}

                  {state.mode === 'customize shape' && (
                    <Button
                      flex="1"
                      variantColor="green"
                      onClick={() => {
                        state.mode = 'home'
                        if (store.leftTabIsTransformingShape) {
                          store.leftTabIsTransformingShape = false
                          store.editor?.deselectShape()
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
                      {/* <Heading size="md" m="0" mb="3" display="flex">
                        Add Text Shape
                      </Heading> */}
                      <SectionLabel>Add Text Shape</SectionLabel>

                      <Textarea
                        autoFocus
                        value={state.textShape.text}
                        onChange={(e: any) => {
                          state.textShape.text = e.target.value
                          updateTextThumbnailPreview()
                        }}
                        placeholder="Type text here..."
                      />

                      <Box display="flex">
                        <Text my="0" mr="3">
                          Color:
                        </Text>
                        <ColorPickerPopover
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
                      </Box>

                      <Box
                        display="flex"
                        flexDirection="column"
                        css={css`
                          min-height: 300px;
                          height: calc(100vh - 520px);
                        `}
                      >
                        <FontPicker
                          selectedFontId={selectedFontId}
                          onHighlighted={(font, style) =>
                            setSelectedFontId(style.fontId)
                          }
                        />
                      </Box>

                      <Box mt="3" display="flex">
                        <Button
                          flex="1"
                          mr="3"
                          onClick={() => {
                            state.mode = 'home'
                          }}
                        >
                          Cancel
                        </Button>

                        <Button
                          flex="2"
                          variantColor="accent"
                          onClick={async () => {
                            const shapeId = store.addCustomShapeText({
                              kind: 'text',
                              text: state.textShape.text,
                              textStyle: {
                                color:
                                  state.textShape.color.kind === 'single'
                                    ? state.textShape.color.color
                                    : 'red',
                                fontId: selectedFontId,
                              },
                              title: 'Custom text',
                              isCustom: true,
                              thumbnailUrl: state.textShape.thumbnailPreview,
                              processedThumbnailUrl:
                                state.textShape.thumbnailPreview,
                            })
                            state.mode = 'home'
                            await store.selectShapeAndSaveUndo(shapeId)
                            store.updateShapeThumbnail()
                          }}
                        >
                          Done
                        </Button>
                      </Box>
                    </Stack>
                  </motion.div>
                )}

                {shape && state.mode === 'customize shape' && (
                  <motion.div
                    key="customize"
                    initial={{ x: 355, y: 0, opacity: 0 }}
                    transition={{ ease: 'easeInOut', duration: 0.2 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    exit={{ x: 355, y: 0, opacity: 0 }}
                  >
                    <Stack mb="4" p="2" position="absolute" width="100%">
                      {shape.kind === 'text' && (
                        <>
                          <Stack mb="4" width="100%">
                            <Heading size="md" m="0" mb="3" display="flex">
                              Customize Text
                            </Heading>
                            <Textarea
                              autoFocus
                              value={shape.config.text}
                              onChange={async (e: any) => {
                                shape.config.text = e.target.value
                                await store.updateShape()
                                store.updateShapeThumbnail()
                                store.animateVisualize()
                              }}
                              placeholder="Type text here..."
                            />
                          </Stack>

                          <Stack mb="2">
                            <Heading size="md" m="0" mb="3">
                              Colors
                            </Heading>
                            <ColorPickerPopover
                              value={shape.config.textStyle.color}
                              onChange={async (color) => {
                                shape.config.textStyle.color = color
                                updateShapeColoring()
                              }}
                            />
                          </Stack>

                          <Box
                            display="flex"
                            flexDirection="column"
                            css={css`
                              min-height: 300px;
                              height: calc(100vh - 720px);
                            `}
                          >
                            <FontPicker
                              selectedFontId={selectedFontId}
                              onHighlighted={async (font, style) => {
                                shape.config.textStyle.fontId = style.fontId
                                await store.updateShape()
                                store.updateShapeThumbnail()
                                store.animateVisualize()
                              }}
                            />
                          </Box>
                        </>
                      )}

                      {shape.kind === 'svg' && (
                        <>
                          <SvgShapeColorPickerCollapse
                            shape={shape}
                            label="Customize color"
                            onUpdate={updateShapeColoring}
                          />
                        </>
                      )}
                      {/* {shapeConf.kind === 'svg' &&
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
                        )} */}
                      {shape.kind === 'raster' && (
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
                        </Heading>
                        {!store.leftTabIsTransformingShape && (
                          <>
                            <Stack direction="row" mt="3" spacing="3">
                              <Button
                                variantColor="accent"
                                onClick={() => {
                                  if (!store.editor) {
                                    return
                                  }
                                  const totalItemsCount =
                                    (store.editor.items.shape.items.length ||
                                      0) +
                                    (store.editor.items.bg.items.length || 0)
                                  if (
                                    totalItemsCount > 0 &&
                                    !window.confirm(
                                      'All unlocked words will be removed. Do you want to continue?'
                                    )
                                  ) {
                                    return
                                  }
                                  store.leftTabIsTransformingShape = true
                                  store.editor.selectShape()
                                }}
                              >
                                Transform shape
                              </Button>
                              {resetTransformBtn}
                            </Stack>
                          </>
                        )}

                        {store.leftTabIsTransformingShape && (
                          <>
                            <Text mt="2">
                              Drag the shape to move or rotate it.
                            </Text>
                            <Stack direction="row" mt="3" spacing="3">
                              <Button
                                variantColor="accent"
                                onClick={() => {
                                  store.leftTabIsTransformingShape = false
                                  store.editor?.deselectShape()
                                  store.editor?.clearItems('shape')
                                  store.editor?.clearItems('bg')
                                  store.animateVisualize(false)
                                }}
                              >
                                Apply
                              </Button>
                              {resetTransformBtn}
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
                            variantColor="teal"
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
                            variantColor="teal"
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
                            placeholder="Search shapes..."
                            value={query}
                            onChange={(e: any) => setQuery(e.target.value)}
                          />
                          {!!query && (
                            <InputRightElement
                              onClick={() => setQuery('')}
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
                        <Box flex={1}>
                          <Menu>
                            <MenuButton
                              // @ts-ignore
                              variant="outline"
                              variantColor={
                                selectedCategory ? 'accent' : undefined
                              }
                              as={Button}
                              rightIcon="chevron-down"
                              py="2"
                              px="3"
                            >
                              {'Category: '}
                              {selectedCategory
                                ? selectedCategory.label
                                : 'All'}
                            </MenuButton>
                            <MenuList
                              as="div"
                              placement="bottom-start"
                              css={css`
                                background: white;
                                position: absolute;
                                top: 0px !important;
                                left: 10px;
                                margin-top: 0 !important;
                                z-index: 5000 !important;
                                max-height: 300px;
                                overflow: auto;
                              `}
                            >
                              <MenuItem
                                onClick={() => setSelectedCategory(null)}
                              >
                                Show all ({store.getAvailableShapes().length})
                              </MenuItem>
                              <MenuDivider />
                              {allCategoryOptions.map((item, index) => (
                                <MenuItem
                                  key={item.value}
                                  onClick={() => setSelectedCategory(item)}
                                >
                                  {item.label} ({shapesPerCategoryCounts[index]}
                                  )
                                </MenuItem>
                              ))}
                            </MenuList>
                          </Menu>
                        </Box>

                        {!!selectedCategory && (
                          <Button
                            ml="3"
                            variant="link"
                            onClick={() => {
                              setSelectedCategory(null)
                            }}
                          >
                            Show all
                          </Button>
                        )}
                      </Flex>

                      <ShapeSelector
                        height="calc(100vh - 370px)"
                        showProcessedThumbnails
                        width="345px"
                        overflowY="scroll"
                        shapes={matchingShapes}
                        onSelected={async (shapeConfig) => {
                          if (store.selectedShapeId !== shapeConfig.id) {
                            await store.selectShapeAndSaveUndo(shapeConfig.id)
                          }
                          store.animateVisualize(false)
                        }}
                        selectedShapeId={store.getSelectedShapeConf().id}
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </>
        </Box>

        {shape && shape.kind === 'raster' && (
          <CustomizeRasterImageModal
            isOpen={state.isShowingCustomizeImage}
            key={shape.id}
            value={{
              invert: shape.config.processing?.invert != null,
              invertColor: shape.config.processing?.invert?.color || 'black',
              removeLightBackground:
                shape.config.processing?.removeLightBackground?.threshold || 0,
              originalUrl: shape.url,
            }}
            onClose={() => {
              state.isShowingCustomizeImage = false
            }}
            onSubmit={async (thumbnailUrl, value) => {
              shape.config.processedThumbnailUrl = thumbnailUrl
              shape.config.processing = {
                invert: value.invert
                  ? {
                      color: value.invertColor,
                    }
                  : undefined,
                removeLightBackground: value.removeLightBackground
                  ? {
                      threshold: value.removeLightBackground,
                    }
                  : undefined,
              }
              await store.updateShape()
              store.updateShapeThumbnail()
            }}
          />
        )}

        <AddCustomImageModal
          isOpen={state.isShowingAddCustomImage}
          onClose={() => {
            state.isShowingAddCustomImage = false
          }}
          onSubmit={({ thumbnailUrl, state }) => {
            const customImgId = store.addCustomShapeImg({
              kind: 'raster',
              title: 'Custom',
              url: state.originalUrl!,
              thumbnailUrl,
              processedThumbnailUrl: thumbnailUrl,
              isCustom: true,
              processing: {
                invert: state.invert
                  ? {
                      color: state.invertColor,
                    }
                  : undefined,
                removeLightBackground: {
                  threshold: state.removeLightBackground,
                },
              },
            })
            store.selectShapeAndSaveUndo(customImgId)
          }}
        />
      </>
    )
  }
)
