import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  IconButton,
  Icon,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import {
  ShapeStyleOptions,
  BgStyleOptions,
} from 'components/Editor/style-options'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { observer } from 'mobx-react'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import React, { useState } from 'react'
import { Tooltip } from 'components/shared/Tooltip'
import { FiRefreshCw } from 'react-icons/fi'

export const ShapeItemsColorPickerInline: React.FC<{
  shapeStyle: ShapeStyleOptions
  bgFill: BgStyleOptions['fill']
  label?: string
  onUpdate: () => void
  children?: React.ReactNode
  renderToolbar?: () => React.ReactNode
}> = observer(
  ({
    renderToolbar = () => null,
    bgFill,
    label,
    shapeStyle,
    onUpdate,
    children,
  }) => {
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
          {label && (
            <Text
              mr="3"
              my="0"
              css={css`
                font-weight: 600;
              `}
            >
              {label}
            </Text>
          )}

          <Menu>
            <MenuButton
              // @ts-ignore
              variant="link"
              variantColor="primary"
              as={Button}
              rightIcon="chevron-down"
              py="2"
              px="3"
            >
              {shapeStyle.items.coloring.kind === 'shape' &&
                'Color: same as shape'}
              {shapeStyle.items.coloring.kind === 'color' && 'Color: custom'}
              {shapeStyle.items.coloring.kind === 'gradient' &&
                'Color: gradient'}
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

          {shapeStyle.items.coloring.kind === 'color' && (
            <Box ml="auto">
              <Menu>
                <MenuButton
                  ml="1"
                  as={Button}
                  size="sm"
                  outline="none"
                  aria-label="menu"
                  color="black"
                  // @ts-ignore
                  variant="outline"
                  display="inline-flex"
                >
                  <DotsThreeVertical size={18} />
                </MenuButton>
                <MenuList placement="bottom-end">
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

              {renderToolbar()}

              <Tooltip label="Randomize" placement="top">
                <Button
                  variant="outline"
                  isDisabled={
                    shapeStyle.items.coloring.color.colors.length === 0
                  }
                  onClick={() => {
                    shapeStyle.items.coloring.color.colors = shapeStyle.items.coloring.color.colors.map(
                      () => getRandomColor()
                    )
                    onUpdate()
                  }}
                  size="sm"
                  ml="1"
                >
                  <FiRefreshCw />
                </Button>
              </Tooltip>

              <Button
                isDisabled={shapeStyle.items.coloring.color.colors.length >= 8}
                variantColor="primary"
                leftIcon="add"
                onClick={() => {
                  shapeStyle.items.coloring.color.colors.push(getRandomColor())
                  onUpdate()
                }}
                size="sm"
                ml="1"
              >
                Add
              </Button>
            </Box>
          )}

          {shapeStyle.items.coloring.kind === 'gradient' && (
            <Box ml="auto">
              <Tooltip label="Randomize" placement="top">
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
                  <FiRefreshCw />
                </Button>
              </Tooltip>

              {renderToolbar()}
            </Box>
          )}

          {shapeStyle.items.coloring.kind === 'shape' && (
            <Box ml="auto">{renderToolbar()}</Box>
          )}
        </Box>

        <ShapeItemsColorPickerInlineImpl
          shapeStyle={shapeStyle}
          children={children}
          onUpdate={onUpdate}
        />
      </Box>
    )
  }
)

export const ShapeItemsColorPickerInlineImpl: React.FC<{
  shapeStyle: ShapeStyleOptions
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ shapeStyle, onUpdate, children, ...props }) => {
  const [multicolorIndex, setMulticolorIndex] = useState(0)

  return (
    <>
      <Box
        mb="2"
        mt="2"
        display="flex"
        flexDirection="row"
        alignItems="flex-start"
      >
        <Box display="flex" flexWrap="wrap">
          {shapeStyle.items.coloring.kind === 'color' && (
            <>
              {shapeStyle.items.coloring.color.colors.map((color, index) => (
                <Box
                  mb="2"
                  key={index}
                  display="inline-flex"
                  alignItems="center"
                >
                  <ColorPickerPopover
                    css={css`
                      width: 52px;
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
            </>
          )}
          {shapeStyle.items.coloring.kind === 'gradient' && (
            <>
              <Box mt="0">
                {[
                  shapeStyle.items.coloring.gradient.gradient.from,
                  shapeStyle.items.coloring.gradient.gradient.to,
                ].map((color, index) => (
                  <Box
                    mr="3"
                    key={index}
                    display="inline-flex"
                    alignItems="center"
                  >
                    <Box mr="2">{index === 1 ? 'To:' : 'From:'}</Box>
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
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
      {children}
    </>
  )
})
