import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuTransition,
  Portal,
  MenuItem,
} from '@chakra-ui/core'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { BgStyleOptions } from 'components/Editor/style-options'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { DeleteButton } from 'components/shared/DeleteButton'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'

export const BgItemsColorPickerKindDropdown: React.FC<{
  bgStyle: BgStyleOptions
  onUpdate: () => void
}> = observer(({ bgStyle, onUpdate }) => {
  return (
    <Menu isLazy placement="bottom-start">
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} py="2" px="3">
        {/* {bgStyle.items.coloring.kind === 'shape' && 'Color: Same as shape'} */}
        {bgStyle.items.coloring.kind === 'color' && 'Custom'}
        {bgStyle.items.coloring.kind === 'gradient' && 'Gradient'}
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
              {/* <MenuItemWithDescription
          title="Same as shape"
          description="Items will have color of the shape"
          onClick={() => {
            bgStyle.items.coloring.kind = 'shape'
            onUpdate()
          }}
        /> */}
              <MenuItemWithDescription
                title="Custom"
                description="Choose one or more custom colors"
                onClick={() => {
                  bgStyle.items.coloring.kind = 'color'
                  onUpdate()
                }}
              />

              <MenuItemWithDescription
                title="Color gradient"
                description="Choose 2 colors to use all colors between them"
                onClick={() => {
                  bgStyle.items.coloring.kind = 'gradient'
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

export const BgItemsColorPickerInline: React.FC<{
  bgStyle: BgStyleOptions
  bgFill: BgStyleOptions['fill']
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ bgFill, bgStyle, onUpdate, children }) => {
  const [multicolorIndex, setMulticolorIndex] = useState(0)
  const isDarkBg =
    bgFill.kind === 'color' && chroma(bgFill.color.color).luminance() < 0.5

  const getRandomColor = () =>
    chroma
      .random()
      .luminance(isDarkBg ? 0.65 : 0.35)
      .saturate(isDarkBg ? 0.3 : 0.4)
      .hex()

  return (
    <Box>
      <Box display="flex" alignItems="center">
        {bgStyle.items.coloring.kind === 'color' && (
          <Box mt="2">
            <Button
              isDisabled={bgStyle.items.coloring.color.colors.length >= 8}
              colorScheme="primary"
              variant="ghost"
              leftIcon={<AddIcon />}
              onClick={() => {
                bgStyle.items.coloring.color.colors.push(getRandomColor())
                onUpdate()
              }}
            >
              Add
            </Button>

            <Button
              variant="ghost"
              isDisabled={bgStyle.items.coloring.color.colors.length === 0}
              onClick={() => {
                bgStyle.items.coloring.color.colors = bgStyle.items.coloring.color.colors.map(
                  () => getRandomColor()
                )
                onUpdate()
              }}
            >
              Randomize
            </Button>

            <Button
              variant="ghost"
              isDisabled={bgStyle.items.coloring.color.colors.length === 0}
              onClick={() => {
                bgStyle.items.coloring.color.colors.length = 1
                onUpdate()
              }}
            >
              Clear
            </Button>
          </Box>
        )}
      </Box>

      <Box mb="2" display="flex" flexDirection="row" alignItems="flex-start">
        {bgStyle.items.coloring.kind === 'color' && (
          <Box display="flex" flexWrap="wrap">
            {bgStyle.items.coloring.color.colors.map((color, index) => (
              <Box mt="3" key={index} display="inline-flex" alignItems="center">
                <ColorPickerPopover
                  css={css`
                    width: 44px;
                  `}
                  disableAlpha
                  value={chroma(bgStyle.items.coloring.color.colors[index])
                    .alpha(1)
                    .hex()}
                  onChange={(hex) => {
                    const color = chroma(hex).hex()
                    bgStyle.items.coloring.color.colors[index] = color
                  }}
                  onAfterChange={() => {
                    onUpdate()
                  }}
                  color={bgStyle.items.coloring.color.colors[index]}
                  onClick={() => setMulticolorIndex(index)}
                />

                {bgStyle.items.coloring.color.colors.length > 1 && (
                  <DeleteButton
                    size="xs"
                    color="gray.400"
                    ml="2px"
                    mr="2"
                    onClick={() => {
                      bgStyle.items.coloring.color.colors.splice(index, 1)
                      onUpdate()
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
        {bgStyle.items.coloring.kind === 'gradient' && (
          <>
            <Box mt="3" display="flex" alignItems="center">
              {[
                bgStyle.items.coloring.gradient.gradient.from,
                bgStyle.items.coloring.gradient.gradient.to,
              ].map((color, index) => (
                <React.Fragment key={index}>
                  <Box mr="3">
                    <ColorPickerPopover
                      disableAlpha
                      value={chroma(color).alpha(1).hex()}
                      onChange={(hex) => {
                        const color = chroma(hex).hex()
                        if (index === 0) {
                          bgStyle.items.coloring.gradient.gradient.from = color
                        } else {
                          bgStyle.items.coloring.gradient.gradient.to = color
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
              {bgStyle.items.coloring.kind === 'gradient' && (
                <Box>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      bgStyle.items.coloring.gradient.gradient = {
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
    </Box>
  )
})
