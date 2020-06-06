import { ButtonProps } from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { SketchPicker } from 'react-color'

export type ColorPickerProps = {
  value: string
  disableAlpha?: boolean
  onChange?: (hex: string) => void
  onAfterChange?: (hex: string) => void
  children?: React.ReactNode
} & Omit<ButtonProps, 'children' | 'onChange'>

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  disableAlpha,
  onAfterChange,
  onChange,
  children,
  ...props
}) => {
  return (
    <>
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
    </>
  )
}
