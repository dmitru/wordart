import styled from '@emotion/styled'
import { useState } from 'react'
import { ChromePicker } from 'react-color'
import chroma from 'chroma-js'
import { lighten } from 'polished'
import { Button } from 'components/shared/Button'

export type ColorPickerProps = {
  value: string
  onChange?: (hex: string) => void
  onAfterChange?: (hex: string) => void
}

const ColorSwatch = styled(Button)<{ color: string }>`
  border: 1px solid #333;
  cursor: pointer;
  outline: none;
  padding: 0;
  margin: 0;
  display: inline-block;
  width: 80px;
  height: 30px;
  background: ${(p) => p.color};

  transition: 0.15s background;

  &:hover {
    background: ${(p) => lighten(0.1, p.color)};
  }
`

export const ColorPicker: React.FC<ColorPickerProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <ColorSwatch onClick={() => setIsOpen(!isOpen)} color={props.value} />
      {isOpen && (
        <ChromePicker
          color={props.value}
          onChange={(color) => {
            const hex = chroma(
              color.rgb.r,
              color.rgb.g,
              color.rgb.b,
              color.rgb.a || 1
            ).hex()
            if (props.onChange) {
              props.onChange(hex)
            }
          }}
        />
      )}
    </>
  )
}
