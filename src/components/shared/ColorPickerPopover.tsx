import {
  ButtonProps,
  Portal,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  PopoverProps,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { useRef } from 'react'
import { SketchPicker } from 'react-color'

export type ColorPickerPopoverProps = {
  value: string
  colorSwatchOpacity?: number
  disableAlpha?: boolean
  onChange?: (hex: string) => void
  onAfterChange?: (hex: string) => void
  usePortal?: boolean
  children?: React.ReactNode
  placement?: PopoverProps['placement']
} & Omit<ButtonProps, 'children' | 'onChange'>

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  value,
  disableAlpha,
  onAfterChange,
  onChange,
  children,
  colorSwatchOpacity = 1,
  usePortal = true,
  placement = 'bottom',
  ...props
}) => {
  const initialFocusRef = useRef(null)

  const content = (
    <PopoverContent
      outline="none"
      zIndex={4000}
      css={css`
        width: 250px;
      `}
    >
      <PopoverArrow />
      <PopoverBody p={2}>
        <SketchPicker
          css={css`
            box-shadow: none !important;
            padding: 0 !important;
          `}
          width="230px"
          color={value}
          disableAlpha={disableAlpha}
          onChange={(color) => {
            const hex = chroma(
              color.rgb.r,
              color.rgb.g,
              color.rgb.b,
              color.rgb.a || 1
            ).hex()
            if (onChange) {
              onChange(hex)
            }
          }}
          onChangeComplete={(color) => {
            const hex = chroma(
              color.rgb.r,
              color.rgb.g,
              color.rgb.b,
              color.rgb.a || 1
            ).hex()
            if (onAfterChange) {
              onAfterChange(hex)
            }
          }}
        />
        {children}
      </PopoverBody>
    </PopoverContent>
  )

  return (
    <>
      <Popover
        initialFocusRef={initialFocusRef}
        placement={placement}
        closeOnBlur
        closeOnEsc
      >
        <PopoverTrigger>
          <ColorSwatchButton
            kind="color"
            color={value}
            {...props}
            opacity={colorSwatchOpacity}
          />
        </PopoverTrigger>
        {usePortal ? <Portal>{content}</Portal> : content}
      </Popover>
    </>
  )
}
