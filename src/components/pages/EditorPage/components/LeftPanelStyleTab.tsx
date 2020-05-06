import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { ChromePicker } from 'react-color'
import { runInAction } from 'mobx'
import chroma from 'chroma-js'
import { useState } from 'react'
import styled from '@emotion/styled'
import Slider from 'react-rangeslider'
import { Checkbox } from 'components/shared/Checkbox'

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
    const { getSelectedShape } = editorPageStore
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
              style.bgColor = hex
              editorPageStore.editor?.updateItemsColor(
                props.type,
                editorPageStore.getItemColoring(props.type)
              )
            }}
          />
        </div>

        <div>
          Items:
          <Checkbox
            id="gradient"
            label="Gradient"
            value={style.itemsColorKind === 'gradient'}
            onChange={(value) => {
              style.itemsColorKind = value ? 'gradient' : 'color'
            }}
          />
          {style.itemsColorKind === 'color' && (
            <ColorPicker
              value={style.itemsColor}
              onChange={(hex) => {
                style.itemsColor = hex
                editorPageStore.editor?.updateItemsColor(
                  props.type,
                  editorPageStore.getItemColoring(props.type)
                )
              }}
            />
          )}
          {style.itemsColorKind === 'gradient' && (
            <>
              <ColorPicker
                value={style.itemsColorGradient.from}
                onChange={(hex) => {
                  style.itemsColorGradient.from = hex
                  editorPageStore.editor?.updateItemsColor(
                    props.type,
                    editorPageStore.getItemColoring(props.type)
                  )
                }}
              />
              <ColorPicker
                value={style.itemsColorGradient.to}
                onChange={(hex) => {
                  style.itemsColorGradient.to = hex
                  editorPageStore.editor?.updateItemsColor(
                    props.type,
                    editorPageStore.getItemColoring(props.type)
                  )
                }}
              />
            </>
          )}
        </div>

        <Checkbox
          id="fit-shape"
          label="Fit within shape?"
          value={style.fitWithinShape}
          onChange={(value) => {
            style.fitWithinShape = value
          }}
        />

        <div>
          Angles:
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
          Dim smaller items:
          <Slider
            value={style.dimSmallerItems}
            onChange={(value) => {
              const val = (value as any) as number
              style.dimSmallerItems = val
            }}
            min={0}
            max={100}
            step={20}
          />
          {style.fitWithinShape && (
            <>
              Shape padding:
              <Slider
                value={style.shapePadding}
                onChange={(value) => {
                  const val = (value as any) as number
                  style.shapePadding = val
                }}
                min={0}
                max={50}
                step={1}
              />
            </>
          )}
          Item padding:
          <Slider
            value={style.itemPadding}
            onChange={(value) => {
              const val = (value as any) as number
              style.itemPadding = val
            }}
            min={0}
            max={100}
            step={1}
          />
          Item size MIN:
          <Slider
            value={style.itemScaleMin}
            onChange={(value) => {
              const val = (value as any) as number
              style.itemScaleMin = val
            }}
            min={0.005}
            max={1}
            step={0.001}
          />
          Item size MAX:
          <Slider
            value={style.itemScaleMax}
            onChange={(value) => {
              const val = (value as any) as number
              style.itemScaleMax = val
            }}
            min={0.2}
            max={3}
            step={0.1}
          />
        </div>
      </>
    )
  }
)
