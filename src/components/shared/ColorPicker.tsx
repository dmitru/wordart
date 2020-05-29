import {
  Button,
  ButtonProps,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/core'
import css from '@emotion/css'
import styled from '@emotion/styled'
import chroma from 'chroma-js'
import { lighten } from 'polished'
import { useRef, useState } from 'react'
import { SketchPicker } from 'react-color'

export type ColorPickerProps = {
  value: string
  disableAlpha?: boolean
  onChange?: (hex: string) => void
  onAfterChange?: (hex: string) => void
  children?: React.ReactNode
} & Omit<ButtonProps, 'children' | 'onChange'>

const ColorSwatch = styled(Button)<{ color: string; theme: any }>`
  border: 1px solid ${(p) => p.theme.colors.dark4};
  cursor: pointer;
  outline: none;
  padding: 0;
  margin: 0;
  display: inline-block;
  width: 60px;
  background: ${(p) => p.color};

  transition: 0.15s background;

  &:hover {
    background: ${(p) => lighten(0.1, p.color)};
  }
`

ColorSwatch.defaultProps = {
  mb: '3',
  mr: '2',
  height: '30px',
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  disableAlpha,
  onAfterChange,
  onChange,
  children,
  ...props
}) => {
  const initialFocusRef = useRef(null)
  const ref = useRef(null)
  const [isOpen, setIsOpen] = useState()

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
          <ColorSwatch borderRadius="none" color={value} ref={ref} {...props}>
            {null}
          </ColorSwatch>
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
