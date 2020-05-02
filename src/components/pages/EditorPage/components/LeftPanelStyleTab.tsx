import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { ChromePicker } from 'react-color'
import { runInAction } from 'mobx'
import chroma from 'chroma-js'
import { useState } from 'react'
import styled from 'styled-components'
import Slider from 'react-rangeslider'

export type ColorPickerProps = {
  value: string
  onChange?: (hex: string) => void
  onAfterChange?: (hex: string) => void
}

const ColorSwatch = styled.button<{ color: string }>`
  outline: none;
  padding: 0;
  margin: 0;
  display: inline-block;
  width: 80px;
  height: 30px;
  background: ${(p) => p.color};
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

export type LeftPanelStyleTabProps = {
  type: 'shape' | 'background'
}

export const LeftPanelStyleTab: React.FC<LeftPanelStyleTabProps> = observer(
  (props) => {
    const { editorPageStore } = useStore()
    const style =
      props.type === 'shape'
        ? editorPageStore.shapeStyle
        : editorPageStore.backgroundStyle

    return (
      <>
        <div>
          BG:
          <ColorPicker
            value={style.bgColor}
            onChange={(hex) => {
              runInAction(() => {
                style.bgColor = hex
                if (editorPageStore.editor) {
                  if (props.type === 'shape') {
                    editorPageStore.editor.setBgShapeColor(hex)
                  } else {
                    editorPageStore.editor.setBackgroundColor(hex)
                  }
                }
              })
            }}
          />
        </div>

        <div>
          Items:
          <ColorPicker
            value={style.itemsColor}
            onChange={(hex) => {
              runInAction(() => {
                style.itemsColor = hex
                if (editorPageStore.editor) {
                  if (props.type === 'shape') {
                    editorPageStore.editor.setShapeItemsColor(hex)
                  } else {
                    editorPageStore.editor.setBgItemsColor(hex)
                  }
                }
              })
            }}
          />
        </div>

        <div>
          <Slider
            value={style.angles[0]}
            onChange={(value) => {
              const val = (value as any) as number
              style.angles = [val]
            }}
            min={-90}
            max={90}
            step={1}
          />
        </div>
      </>
    )
  }
)
