import {
  Box,
  Flex,
  Menu,
  MenuButton,
  Portal,
  MenuTransition,
  MenuDivider,
  MenuItem,
  MenuList,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import { ShapeSelector } from 'components/Editor/components/ShapeSelector'
import { ShapeIconConf, ShapeId } from 'components/Editor/shape-config'
import { Button } from 'components/shared/Button'
import { SearchInput } from 'components/shared/SearchInput'
import { iconsCategories } from 'data/icon-categories'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { useMemo } from 'react'
import { useStore } from 'services/root-store'
import { useDebounce } from 'use-debounce'
import { useEditorStore } from 'components/Editor/editor-store'

const state = observable({
  query: '',
  selectedCategory: null as null | string,
})

export type IconPickerProps = {
  selectedIconId?: ShapeId
  onSelected: (shapeConfig: ShapeIconConf) => void
}

export const IconPicker: React.FC<IconPickerProps> = observer(
  ({ selectedIconId, onSelected }) => {
    const store = useEditorStore()!

    const allCategoryOptions = iconsCategories

    const allItems = store.availableIconShapes

    const { query, selectedCategory } = state
    const [debouncedQuery] = useDebounce(query, 300)

    const matchingItems = useMemo(() => {
      const query = debouncedQuery.trim().toLowerCase()
      return allItems.filter(
        (s) =>
          (!query ||
            (query && s.title.toLowerCase().includes(query)) ||
            (s.keywords || []).find((keyword) => keyword.includes(query)) !=
              null) &&
          (!selectedCategory ||
            (selectedCategory &&
              (s.categories || []).includes(selectedCategory)))
      )
    }, [debouncedQuery, selectedCategory])

    return (
      <>
        <Flex align="center" mt="5" mb="4">
          <Box mr="3">
            <Menu isLazy>
              <MenuButton
                colorScheme={selectedCategory ? 'accent' : undefined}
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="sm"
                py="2"
                px="3"
              >
                {selectedCategory || 'All categories'}
              </MenuButton>
              <Portal>
                <MenuTransition>
                  {(styles) => (
                    <MenuList
                      // @ts-ignore
                      css={css`
                        ${styles}
                        max-height: 300px;
                        overflow: auto;
                      `}
                    >
                      <MenuItem
                        onClick={() => {
                          state.selectedCategory = null
                        }}
                      >
                        Show all ({allItems.length})
                      </MenuItem>
                      <MenuDivider />
                      {allCategoryOptions.map((item, index) => (
                        <MenuItem
                          key={item.label}
                          onClick={() => {
                            state.selectedCategory = item.label
                          }}
                        >
                          {item.label} ({item.count})
                        </MenuItem>
                      ))}
                    </MenuList>
                  )}
                </MenuTransition>
              </Portal>
            </Menu>
          </Box>

          <SearchInput
            autoFocus
            placeholder="Search..."
            value={query}
            onChange={(value) => {
              state.query = value
            }}
          />
        </Flex>

        <ShapeSelector
          columns={6}
          showProcessedThumbnails={false}
          overscanCount={3}
          shapes={matchingItems}
          onSelected={(shapeConfig) => {
            if (shapeConfig.kind !== 'icon') {
              return
            }
            onSelected(shapeConfig)
          }}
          selectedShapeId={selectedIconId}
        />
      </>
    )
  }
)
