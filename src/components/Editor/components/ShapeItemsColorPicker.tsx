import {
  Box,
  Button,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import chroma from 'chroma-js'
import {
  BgStyleOptions,
  ShapeStyleOptions,
} from 'components/Editor/style-options'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'

export const ShapeItemsColorPickerKindDropdown: React.FC<{
  shapeStyle: ShapeStyleOptions
  onUpdate: () => void
}> = observer(({ shapeStyle, onUpdate }) => {
  return (
    <Menu>
      <MenuButton
        // @ts-ignore
        variant="outline"
        as={Button}
        rightIcon="chevron-down"
        py="2"
        px="3"
      >
        {shapeStyle.items.coloring.kind === 'shape' && 'Color: Same as shape'}
        {shapeStyle.items.coloring.kind === 'color' && 'Color: Custom'}
        {shapeStyle.items.coloring.kind === 'gradient' && 'Color: Gradient'}
      </MenuButton>
      <MenuList
        as="div"
        placement="bottom-start"
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
        <MenuItem
          onClick={() => {
            shapeStyle.items.coloring.kind = 'shape'
            onUpdate()
          }}
        >
          Same as shape
        </MenuItem>
        <MenuItem
          onClick={() => {
            shapeStyle.items.coloring.kind = 'color'
            onUpdate()
          }}
        >
          Custom colors
        </MenuItem>
        <MenuItem
          onClick={() => {
            shapeStyle.items.coloring.kind = 'gradient'
            onUpdate()
          }}
        >
          Color gradient
        </MenuItem>
      </MenuList>
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
      .saturate(isDarkBg ? 0.3 : 0.4)
      .hex()

  return (
    <Box>
      <Box display="flex" alignItems="center">
        {shapeStyle.items.coloring.kind === 'color' && (
          <Box>
            <Button
              isDisabled={shapeStyle.items.coloring.color.colors.length >= 8}
              variant="outline"
              leftIcon="add"
              onClick={() => {
                shapeStyle.items.coloring.color.colors.push(getRandomColor())
                onUpdate()
              }}
              size="sm"
            >
              Add
            </Button>

            <Button
              variant="outline"
              isDisabled={shapeStyle.items.coloring.color.colors.length === 0}
              onClick={() => {
                shapeStyle.items.coloring.color.colors = shapeStyle.items.coloring.color.colors.map(
                  () => getRandomColor()
                )
                onUpdate()
              }}
              size="sm"
              ml="1"
            >
              <FiRefreshCw style={{ marginRight: '5px' }} />
              Random
            </Button>

            <Menu>
              <MenuButton
                ml="1"
                as={Button}
                size="sm"
                outline="none"
                aria-label="menu"
                color="black"
                // @ts-ignore
                variant="ghost"
                display="inline-flex"
              >
                <DotsThreeVertical size={18} />
              </MenuButton>
              <MenuList placement="bottom" zIndex={1000}>
                <MenuItem
                  onClick={() => {
                    shapeStyle.items.coloring.color.colors.length = 1
                    onUpdate()
                  }}
                >
                  <Icon
                    name="small-close"
                    size="20px"
                    color="gray.500"
                    mr="2"
                  />
                  Clear all
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>
        )}
      </Box>

      {shapeStyle.items.coloring.kind !== 'shape' && (
        <Box mb="2" display="flex" flexDirection="row" alignItems="flex-start">
          {shapeStyle.items.coloring.kind === 'color' && (
            <Box mt="4" display="flex" flexWrap="wrap">
              {shapeStyle.items.coloring.color.colors.map((color, index) => (
                <Box
                  mb="2"
                  key={index}
                  display="inline-flex"
                  alignItems="center"
                >
                  <ColorPickerPopover
                    css={css`
                      width: 48px;
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
                    <IconButton
                      isRound
                      aria-label="Delete"
                      variant="outline"
                      ml="2px"
                      mr="2"
                      icon="close"
                      size="xs"
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
              <Box mt="0" display="flex" alignItems="center">
                {[
                  shapeStyle.items.coloring.gradient.gradient.from,
                  shapeStyle.items.coloring.gradient.gradient.to,
                ].map((color, index) => (
                  <React.Fragment key={index}>
                    <Box mr="2">{index === 1 ? 'To:' : 'From:'}</Box>
                    <Box mr="3">
                      <ColorPickerPopover
                        disableAlpha
                        value={chroma(
                          multicolorIndex === 0
                            ? shapeStyle.items.coloring.gradient.gradient.from
                            : shapeStyle.items.coloring.gradient.gradient.to
                        )
                          .alpha(1)
                          .hex()}
                        onChange={(hex) => {
                          const color = chroma(hex).hex()
                          if (multicolorIndex === 0) {
                            shapeStyle.items.coloring.gradient.gradient.from = color
                          } else {
                            shapeStyle.items.coloring.gradient.gradient.to = color
                          }
                        }}
                        onAfterChange={() => {
                          onUpdate()
                        }}
                        color={
                          index === 0
                            ? shapeStyle.items.coloring.gradient.gradient.from
                            : shapeStyle.items.coloring.gradient.gradient.to
                        }
                        onClick={() => setMulticolorIndex(index)}
                      />
                    </Box>
                  </React.Fragment>
                ))}
                {shapeStyle.items.coloring.kind === 'gradient' && (
                  <Box>
                    <Button
                      variant="outline"
                      onClick={() => {
                        shapeStyle.items.coloring.gradient.gradient = {
                          from: getRandomColor(),
                          to: getRandomColor(),
                          assignBy: 'random',
                        }
                        onUpdate()
                      }}
                      size="sm"
                      ml="1"
                    >
                      <FiRefreshCw style={{ marginRight: '5px' }} />
                      Random
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
