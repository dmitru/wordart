import {
  ButtonProps,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { useRef } from 'react'
import { SketchPicker } from 'react-color'

export type ColorPickerPopoverProps = {
  value: string
  disableAlpha?: boolean
  onChange?: (hex: string) => void
  onAfterChange?: (hex: string) => void
  children?: React.ReactNode
} & Omit<ButtonProps, 'children' | 'onChange'>

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  value,
  disableAlpha,
  onAfterChange,
  onChange,
  children,
  ...props
}) => {
  const initialFocusRef = useRef(null)
  const ref = useRef(null)

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
          <ColorSwatchButton kind="color" color={value} ref={ref} {...props}>
            {null}
          </ColorSwatchButton>
        </PopoverTrigger>
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
      </Popover>
    </>
  )
}
