import {
  Box,
  Button,
  ButtonProps,
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
import { BgStyleOptions } from 'components/Editor/style-options'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { observer, Observer } from 'mobx-react'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import React, { useState } from 'react'

export const BgItemsColorPickerSwatch = React.forwardRef<
  HTMLElement,
  {
    bgStyle: BgStyleOptions
  } & Partial<ButtonProps>
>(({ bgStyle, ...props }, ref) => {
  return (
    // @ts-ignore
    <Observer>
      {/* 
      // @ts-ignore
       */}
      {() => {
        let trigger: React.ReactNode = <span>open</span>
        if (bgStyle.items.coloring.kind === 'color') {
          trigger = (
            <ColorSwatchButton
              css={css`
                width: 80px;
              `}
              borderRadius="none"
              colors={bgStyle.items.coloring.color.colors}
              kind="colors"
              ref={ref}
              {...props}
            />
          )
        } else if (bgStyle.items.coloring.kind === 'gradient') {
          trigger = (
            <ColorSwatchButton
              css={css`
                width: 80px;
              `}
              borderRadius="none"
              colors={[
                bgStyle.items.coloring.gradient.gradient.from,
                bgStyle.items.coloring.gradient.gradient.to,
              ]}
              kind="gradient"
              ref={ref}
              {...props}
            />
          )
        } else if (bgStyle.items.coloring.kind === 'shape') {
          trigger = (
            <ColorSwatchButton
              css={css`
                width: 80px;
              `}
              borderRadius="none"
              kind="spectrum"
              ref={ref}
              {...props}
            />
          )
        }

        return trigger
      }}
    </Observer>
  )
})

export const BgItemsColorPickerInline: React.FC<{
  bgStyle: BgStyleOptions
  label?: string
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ label, bgStyle, onUpdate, children }) => {
  const [openShapeColors, setOpenShapeColors] = useState(false)

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
            {bgStyle.items.coloring.kind === 'shape' && 'Color: same as shape'}
            {bgStyle.items.coloring.kind === 'color' && 'Color: custom'}
            {bgStyle.items.coloring.kind === 'gradient' && 'Color: gradient'}
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
                bgStyle.items.coloring.kind = 'shape'
                onUpdate()
              }}
            >
              Same as shape
            </MenuItem>
            <MenuItem
              onClick={() => {
                bgStyle.items.coloring.kind = 'color'
                onUpdate()
              }}
            >
              Custom colors
            </MenuItem>
            <MenuItem
              onClick={() => {
                bgStyle.items.coloring.kind = 'gradient'
                onUpdate()
              }}
            >
              Color gradient
            </MenuItem>
          </MenuList>
        </Menu>

        {bgStyle.items.coloring.kind === 'color' && (
          <>
            <Button
              isDisabled={bgStyle.items.coloring.color.colors.length >= 8}
              variantColor="green"
              leftIcon="add"
              onClick={() => {
                const color = chroma.random().hex()
                bgStyle.items.coloring.color.colors.push(color)
                onUpdate()
              }}
              size="sm"
              ml="auto"
            >
              Add
            </Button>

            <Menu>
              <MenuButton
                marginLeft="2"
                as={Button}
                size="sm"
                outline="none"
                aria-label="menu"
                color="black"
                display="inline-flex"
              >
                <DotsThreeVertical size={18} />
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={() => {
                    bgStyle.items.coloring.color.colors.length = 1
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
          </>
        )}
      </Box>

      <BgItemsColorPickerInlineImpl
        bgStyle={bgStyle}
        children={children}
        onUpdate={onUpdate}
      />
    </Box>
  )
})

export const BgItemsColorPickerInlineImpl: React.FC<{
  bgStyle: BgStyleOptions
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ bgStyle, onUpdate, children, ...props }) => {
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
          {bgStyle.items.coloring.kind === 'color' && (
            <>
              {bgStyle.items.coloring.color.colors.map((color, index) => (
                <Box
                  mb="4"
                  key={index}
                  display="inline-flex"
                  alignItems="center"
                >
                  <ColorPickerPopover
                    css={css`
                      width: 52px;
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
                    <IconButton
                      isRound
                      aria-label="Delete"
                      ml="2px"
                      mr="2"
                      icon="close"
                      size="xs"
                      onClick={() => {
                        bgStyle.items.coloring.color.colors.splice(index, 1)
                        onUpdate()
                      }}
                    />
                  )}
                </Box>
              ))}
            </>
          )}
          {bgStyle.items.coloring.kind === 'gradient' && (
            <>
              <Box mt="0">
                {[
                  bgStyle.items.coloring.gradient.gradient.from,
                  bgStyle.items.coloring.gradient.gradient.to,
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
                          ? bgStyle.items.coloring.gradient.gradient.from
                          : bgStyle.items.coloring.gradient.gradient.to
                      )
                        .alpha(1)
                        .hex()}
                      onChange={(hex) => {
                        const color = chroma(hex).hex()
                        if (multicolorIndex === 0) {
                          bgStyle.items.coloring.gradient.gradient.from = color
                        } else {
                          bgStyle.items.coloring.gradient.gradient.to = color
                        }
                      }}
                      onAfterChange={() => {
                        onUpdate()
                      }}
                      color={
                        index === 0
                          ? bgStyle.items.coloring.gradient.gradient.from
                          : bgStyle.items.coloring.gradient.gradient.to
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
