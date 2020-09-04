import {
  Box,
  Menu,
  MenuButton,
  MenuTransition,
  Portal,
  MenuList,
  MenuItem,
} from '@chakra-ui/core'
import { Tooltip } from 'components/shared/Tooltip'
import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import {
  BgStyleOptions,
  ShapeStyleOptions,
} from 'components/Editor/style-options'
import { Button } from 'components/shared/Button'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { DeleteButton } from 'components/shared/DeleteButton'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import { observer } from 'mobx-react'
import React, { useState } from 'react'

export const ShapeItemsColorPickerKindDropdown: React.FC<{
  shapeStyle: ShapeStyleOptions
  onUpdate: () => void
}> = observer(({ shapeStyle, onUpdate }) => {
  return (
    <Menu isLazy placement="bottom-start">
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} py="2" px="3">
        {shapeStyle.items.coloring.kind === 'shape' && 'Same as shape'}
        {shapeStyle.items.coloring.kind === 'color' && 'Custom'}
        {shapeStyle.items.coloring.kind === 'gradient' && 'Gradient'}
      </MenuButton>
      <MenuTransition>
        {(styles) => (
          <Portal>
            <MenuList
              // @ts-ignore
              css={styles}
              bg="white"
              maxHeight="300px"
              overflow="auto"
            >
              <MenuItemWithDescription
                title="Same as shape"
                description="Items will have color of the shape"
                onClick={() => {
                  shapeStyle.items.coloring.kind = 'shape'
                  onUpdate()
                }}
              />
              <MenuItemWithDescription
                title="Custom"
                description="Choose one or more custom colors"
                onClick={() => {
                  shapeStyle.items.coloring.kind = 'color'
                  onUpdate()
                }}
              />

              <MenuItemWithDescription
                title="Color gradient"
                description="Choose 2 colors to use all colors between them"
                onClick={() => {
                  shapeStyle.items.coloring.kind = 'gradient'
                  onUpdate()
                }}
              />
            </MenuList>
          </Portal>
        )}
      </MenuTransition>
    </Menu>
  )
})

export const ShapeItemsColorPickerInline: React.FC<{
  shapeStyle: ShapeStyleOptions
  bgFill: BgStyleOptions['fill']
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ bgFill, shapeStyle, onUpdate, children }) => {
  const [multicolorIndex, setMulticolorIndex] = useState(0)
  const isDarkBg =
    bgFill.kind === 'color' && chroma(bgFill.color.color).luminance() < 0.5

  const getRandomColor = () =>
    chroma
      .random()
      .luminance(isDarkBg ? 0.65 : 0.35)
      .saturate(isDarkBg ? 0.5 : 0.6)
      .hex()

  return (
    <Box>
      <Box display="flex" alignItems="center">
        {shapeStyle.items.coloring.kind === 'color' && (
          <Box>
            <Button
              isDisabled={shapeStyle.items.coloring.color.colors.length >= 8}
              colorScheme="primary"
              variant="ghost"
              leftIcon={<AddIcon />}
              onClick={() => {
                shapeStyle.items.coloring.color.colors.push(getRandomColor())
                onUpdate()
              }}
            >
              Add
            </Button>

            <Tooltip label="Randomize colors">
              <Button
                variant="ghost"
                isDisabled={shapeStyle.items.coloring.color.colors.length === 0}
                onClick={() => {
                  shapeStyle.items.coloring.color.colors = shapeStyle.items.coloring.color.colors.map(
                    () => getRandomColor()
                  )
                  onUpdate()
                }}
              >
                Randomize
              </Button>
            </Tooltip>

            <Button
              variant="ghost"
              isDisabled={shapeStyle.items.coloring.color.colors.length === 0}
              onClick={() => {
                shapeStyle.items.coloring.color.colors.length = 1
                onUpdate()
              }}
            >
              Clear
            </Button>
          </Box>
        )}
      </Box>

      {shapeStyle.items.coloring.kind !== 'shape' && (
        <Box mb="3" display="flex" flexDirection="row" alignItems="flex-start">
          {shapeStyle.items.coloring.kind === 'color' && (
            <Box mt="3" display="flex" flexWrap="wrap">
              {shapeStyle.items.coloring.color.colors.map((color, index) => (
                <Box
                  mb="2"
                  key={index}
                  display="inline-flex"
                  alignItems="center"
                >
                  <ColorPickerPopover
                    css={css`
                      width: 44px;
                    `}
                    disableAlpha
                    value={chroma(shapeStyle.items.coloring.color.colors[index])
                      .alpha(1)
                      .hex()}
                    onChange={(hex) => {
                      const color = chroma(hex).hex()
                      shapeStyle.items.coloring.color.colors[index] = color
                    }}
                    onAfterChange={() => {
                      onUpdate()
                    }}
                    color={shapeStyle.items.coloring.color.colors[index]}
                    onClick={() => setMulticolorIndex(index)}
                  />

                  {shapeStyle.items.coloring.color.colors.length > 1 && (
                    <DeleteButton
                      size="xs"
                      color="gray.400"
                      ml="2px"
                      mr="2"
                      onClick={() => {
                        shapeStyle.items.coloring.color.colors.splice(index, 1)
                        onUpdate()
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          )}
          {shapeStyle.items.coloring.kind === 'gradient' && (
            <>
              <Box mt="3" display="flex" alignItems="center">
                {[
                  shapeStyle.items.coloring.gradient.gradient.from,
                  shapeStyle.items.coloring.gradient.gradient.to,
                ].map((color, index) => (
                  <React.Fragment key={index}>
                    <Box mr="3">
                      <ColorPickerPopover
                        disableAlpha
                        value={chroma(color).alpha(1).hex()}
                        onChange={(hex) => {
                          const color = chroma(hex).hex()
                          if (index === 0) {
                            shapeStyle.items.coloring.gradient.gradient.from = color
                          } else {
                            shapeStyle.items.coloring.gradient.gradient.to = color
                          }
                        }}
                        onAfterChange={() => {
                          onUpdate()
                        }}
                        color={color}
                        onClick={() => setMulticolorIndex(index)}
                      />
                    </Box>
                  </React.Fragment>
                ))}
                {shapeStyle.items.coloring.kind === 'gradient' && (
                  <Box>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        shapeStyle.items.coloring.gradient.gradient = {
                          from: getRandomColor(),
                          to: getRandomColor(),
                          assignBy: 'random',
                        }
                        onUpdate()
                      }}
                    >
                      Randomize
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          )}
          {children}
        </Box>
      )}
    </Box>
  )
})
