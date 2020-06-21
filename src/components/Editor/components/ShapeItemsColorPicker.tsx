import {
  Box,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Button,
  Text,
  Collapse,
  ButtonProps,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ChoiceButtons } from 'components/Editor/components/ChoiceButtons'
import { ShapeStyleOptions } from 'components/Editor/style-options'
import { ColorPicker } from 'components/shared/ColorPicker'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { observer, Observer } from 'mobx-react'
import React, { useRef, useState } from 'react'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'

export const ShapeItemsColorPickerSwatch = React.forwardRef<
  HTMLElement,
  {
    shapeStyle: ShapeStyleOptions
  } & Partial<ButtonProps>
>(({ shapeStyle, ...props }, ref) => {
  return (
    // @ts-ignore
    <Observer>
      {/* 
      // @ts-ignore
       */}
      {() => {
        let trigger: React.ReactNode = <span>open</span>
        if (shapeStyle.items.coloring.kind === 'color') {
          trigger = (
            <ColorSwatchButton
              css={css`
                width: 80px;
              `}
              borderRadius="none"
              color={shapeStyle.items.coloring.color.color}
              kind="color"
              ref={ref}
              {...props}
            />
          )
        } else if (shapeStyle.items.coloring.kind === 'gradient') {
          trigger = (
            <ColorSwatchButton
              css={css`
                width: 80px;
              `}
              borderRadius="none"
              colors={[
                shapeStyle.items.coloring.gradient.gradient.from,
                shapeStyle.items.coloring.gradient.gradient.to,
              ]}
              kind="gradient"
              ref={ref}
              {...props}
            />
          )
        } else if (shapeStyle.items.coloring.kind === 'shape') {
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

export const ShapeItemsColorPicker: React.FC<{
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
        <Box>
          <Box mb="2">
            <ChoiceButtons
              choices={[
                { title: 'Shape Colors', value: 'shape' },
                { title: 'Gradient', value: 'gradient' },
                { title: 'Color', value: 'color' },
              ]}
              value={shapeStyle.items.coloring.kind}
              onChange={(value) => {
                if (value === 'shape') {
                  shapeStyle.items.coloring.kind = 'shape'
                } else if (value === 'gradient') {
                  shapeStyle.items.coloring.kind = 'gradient'
                } else if (value === 'color') {
                  shapeStyle.items.coloring.kind = 'color'
                }
                onUpdate()
              }}
            />
          </Box>

          {shapeStyle.items.coloring.kind === 'color' && (
            <ColorPicker
              disableAlpha
              value={shapeStyle.items.coloring.color.color}
              onChange={(hex) => {
                shapeStyle.items.coloring.color.color = hex
              }}
              onAfterChange={onUpdate}
            />
          )}
          {shapeStyle.items.coloring.kind === 'gradient' && (
            <>
              <Box mt="2">
                {[
                  shapeStyle.items.coloring.gradient.gradient.from,
                  shapeStyle.items.coloring.gradient.gradient.to,
                ].map((color, index) => (
                  <Box mr="1" key={index} display="inline-block">
                    <ColorSwatchButton
                      kind="color"
                      color={
                        index === 0
                          ? shapeStyle.items.coloring.gradient.gradient.from
                          : shapeStyle.items.coloring.gradient.gradient.to
                      }
                      onClick={() => setMulticolorIndex(index)}
                    />
                  </Box>
                ))}

                <Box mt="3">
                  <ColorPicker
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
                  />
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>
      {children}
    </>
  )
})

export const ShapeItemsColorPickerInline: React.FC<{
  shapeStyle: ShapeStyleOptions
  label: string
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ label, shapeStyle, onUpdate, children }) => {
  const [openShapeColors, setOpenShapeColors] = useState(false)

  return (
    <Box>
      <Box display="flex" alignItems="center">
        <Text
          mr="3"
          my="0"
          css={css`
            font-weight: 600;
          `}
        >
          {label}
        </Text>

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
            {shapeStyle.items.coloring.kind === 'shape' && 'Same as shape'}
            {shapeStyle.items.coloring.kind === 'color' && 'Custom colors'}
            {shapeStyle.items.coloring.kind === 'gradient' && 'Color gradient'}
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
      </Box>

      <ShapeItemsColorPickerInlineImpl
        shapeStyle={shapeStyle}
        children={children}
        onUpdate={onUpdate}
      />
    </Box>
  )
})

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
        <Box>
          {shapeStyle.items.coloring.kind === 'color' && (
            <ColorPickerPopover
              disableAlpha
              value={shapeStyle.items.coloring.color.color}
              onChange={(hex) => {
                shapeStyle.items.coloring.color.color = hex
              }}
              onAfterChange={onUpdate}
            />
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

export const ShapeItemsColorPickerCollapse: React.FC<{
  shapeStyle: ShapeStyleOptions
  label: string
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ label, shapeStyle, onUpdate, children }) => {
  const [openShapeColors, setOpenShapeColors] = useState(false)

  return (
    <Box>
      <Box display="flex" alignItems="center">
        <Text
          mr="3"
          my="0"
          css={css`
            font-weight: 600;
          `}
        >
          {label}
        </Text>
        <Button
          rightIcon={openShapeColors ? 'chevron-up' : 'chevron-down'}
          variant="ghost"
          onClick={() => setOpenShapeColors(!openShapeColors)}
        >
          <ShapeItemsColorPickerSwatch as="span" shapeStyle={shapeStyle} />
        </Button>
      </Box>

      <ShapeItemsColorPicker
        shapeStyle={shapeStyle}
        children={children}
        onUpdate={onUpdate}
      />
    </Box>
  )
})

export const ShapeItemsColorPickerPopover: React.FC<{
  shapeStyle: ShapeStyleOptions
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ shapeStyle, onUpdate, children, ...props }) => {
  const initialFocusRef = useRef(null)

  const trigger = <ShapeItemsColorPickerSwatch shapeStyle={shapeStyle} />

  return (
    <>
      <Popover
        initialFocusRef={initialFocusRef}
        placement="bottom"
        closeOnBlur
        closeOnEsc
        usePortal
      >
        <PopoverTrigger>
          <Box>{trigger}</Box>
        </PopoverTrigger>

        <PopoverContent
          zIndex={4000}
          css={css`
            /* width: 250px; */
          `}
        >
          <PopoverArrow />
          <PopoverBody
            p={2}
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <ShapeItemsColorPicker
              shapeStyle={shapeStyle}
              children={children}
              onUpdate={onUpdate}
            />
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  )
})
