import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuTransition,
  Portal,
  Stack,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import { ShapeColorPicker } from 'components/Editor/components/ShapeColorPicker'
import { ShapeSelector } from 'components/Editor/components/ShapeSelector'
import { SectionLabel } from 'components/Editor/components/shared'
import { useEditorStore } from 'components/Editor/editor-store'
import { ShapeClipartConf } from 'components/Editor/shape-config'
import { mkShapeStyleConfFromOptions } from 'components/Editor/style'
import { Button } from 'components/shared/Button'
import { SearchInput } from 'components/shared/SearchInput'
import { Slider } from 'components/shared/Slider'
import { shapeCategories } from 'data/shapes'
import { AnimatePresence, motion } from 'framer-motion'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect, useState } from 'react'
import { FaCog } from 'react-icons/fa'
import { useDebouncedCallback } from 'use-debounce/lib'
import { BigShapeThumbnail, ShapeTransformLeftPanelSection } from './components'

type TabMode = 'home' | 'customize shape'
const initialState = {
  mode: 'home' as TabMode,
  isShowingCustomizeImage: false,
}

const state = observable<typeof initialState>({ ...initialState })

export type LeftPanelShapesTabProps = {}

const ShapeOpacitySlider = observer(({ style, onAfterChange }: any) => (
  <Slider
    label="Opacity"
    afterLabel="%"
    value={style.opacity}
    onChange={(value) => {
      style.opacity = value
    }}
    onAfterChange={onAfterChange}
    min={0}
    max={100}
    step={1}
  />
))

export const ClipArtShapePicker: React.FC<{}> = observer(() => {
  const store = useEditorStore()!
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()

  const {
    // @ts-ignore
    renderKey, // eslint-disable-line
  } = store

  const allCategoryOptions = shapeCategories.map(({ category, title }) => ({
    value: category,
    label: title,
  }))
  const allClipArtShapes = store.availableImageShapes

  const shapesPerCategoryCounts = allCategoryOptions.map(
    ({ value }) =>
      allClipArtShapes.filter((s) => (s.categories || []).includes(value))
        .length
  )

  const [selectedCategory, setSelectedCategory] = useState<{
    value: string
    label: string
  } | null>(null)

  const [query, setQuery] = useState('')

  const matchingShapes = allClipArtShapes.filter(
    (s) =>
      (!query ||
        (query && s.title.toLowerCase().includes(query.toLowerCase())) ||
        (s.keywords || []).find((keyword) => keyword.includes(query)) !=
          null) &&
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
      await store.editor?.updateShapeColors(shape.config, true)
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

  return (
    <>
      <Box>
        <>
          <Box display="flex" alignItems="flex-start" mb="3">
            {shape &&
              (shape.kind === 'clipart:raster' ||
                shape.kind === 'clipart:svg') && (
                <BigShapeThumbnail url={shape.config.processedThumbnailUrl!} />
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
                <ShapeOpacitySlider
                  style={shapeStyle}
                  onAfterChange={(value: number) => {
                    store.editor?.setShapeOpacity(value / 100)
                  }}
                />
              </Box>

              <Flex marginTop="65px" width="100%">
                {state.mode === 'home' && (
                  <Button
                    display="flex"
                    flex="1"
                    onClick={() => {
                      state.mode = 'customize shape'
                    }}
                  >
                    <FaCog style={{ marginRight: '5px' }} />
                    Customize
                  </Button>
                )}

                {state.mode === 'customize shape' && (
                  <Button
                    flex="1"
                    colorScheme="accent"
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

          <Box position="relative" width="100%" height="calc(100vh - 350px)">
            <AnimatePresence initial={false}>
              {state.mode === 'home' && (
                <motion.div
                  key="main"
                  transition={{ ease: 'easeInOut', duration: 0.2 }}
                  initial={{ x: -400, y: 0, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  exit={{ x: -400, y: 0, opacity: 0 }}
                >
                  <Box
                    position="absolute"
                    width="100%"
                    height="100%"
                    display="flex"
                    flexDirection="column"
                  >
                    <Flex align="center" mt="2" mb="4">
                      <Box mr="3">
                        <Menu isLazy>
                          <MenuButton
                            colorScheme={
                              selectedCategory ? 'accent' : undefined
                            }
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            size="sm"
                            py="2"
                            px="3"
                          >
                            {selectedCategory
                              ? selectedCategory.label
                              : 'All categories'}
                          </MenuButton>
                          <MenuTransition>
                            {(styles) => (
                              <Portal>
                                <MenuList
                                  // @ts-ignore
                                  css={css`
                                    ${styles}
                                    max-height: 300px;
                                    width: 260px;
                                    overflow: auto;
                                  `}
                                >
                                  <MenuItem
                                    onClick={() => setSelectedCategory(null)}
                                  >
                                    Show all (
                                    {store.availableImageShapes.length})
                                  </MenuItem>
                                  <MenuDivider />
                                  {allCategoryOptions.map((item, index) => (
                                    <MenuItem
                                      key={item.value}
                                      onClick={() => setSelectedCategory(item)}
                                    >
                                      {item.label} (
                                      {shapesPerCategoryCounts[index]})
                                    </MenuItem>
                                  ))}
                                </MenuList>
                              </Portal>
                            )}
                          </MenuTransition>
                        </Menu>
                      </Box>

                      <SearchInput
                        placeholder="Search..."
                        value={query}
                        onChange={setQuery}
                      />
                    </Flex>

                    <ShapeSelector
                      shapes={matchingShapes}
                      onSelected={async (shapeConfig) => {
                        if (
                          store.shapesPanel.image.selected !==
                          (shapeConfig as ShapeClipartConf).id
                        ) {
                          store.shapesPanel.image.selected = (shapeConfig as ShapeClipartConf).id
                          await store.selectShapeAndSaveUndo(shapeConfig)
                        }
                        store.animateVisualize(false)
                      }}
                      selectedShapeId={store.shapesPanel.image.selected}
                    />
                  </Box>
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
                  <Stack mb="4" mt="5" position="absolute" width="100%">
                    <SectionLabel>Colors</SectionLabel>
                    <ShapeColorPicker onUpdate={updateShapeColoring} />

                    <Box mt="6">
                      <ShapeTransformLeftPanelSection />
                    </Box>
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </>
      </Box>
    </>
  )
})
