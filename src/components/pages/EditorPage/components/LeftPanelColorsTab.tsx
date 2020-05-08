import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { Checkbox } from 'components/shared/Checkbox'
import { ColorPicker } from 'components/shared/ColorPicker'
import styled from '@emotion/styled'
import { Box } from 'components/shared/Box'
import { Button } from 'components/shared/Button'
import { Label } from './shared'
import { Slider } from 'components/shared/Slider'

export type LeftPanelColorsTabProps = {}

export const LeftPanelColorsTab: React.FC<LeftPanelColorsTabProps> = observer(
  (props) => {
    const { editorPageStore } = useStore()
    const { shapeStyle: style, backgroundStyle } = editorPageStore

    return (
      <>
        <Box>
          <Label>Background</Label>
          <ColorPicker
            value={backgroundStyle.bgColor}
            onChange={(hex) => {
              backgroundStyle.bgColor = hex
              editorPageStore.editor?.setBackgroundColor(hex)
            }}
          />
        </Box>

        <Box mt={3}>
          <Label>Shape</Label>
          <ColorPicker
            value={style.bgColor}
            onChange={(hex) => {
              style.bgColor = hex
              editorPageStore.editor?.setShapeFillColor(hex)
            }}
          />
        </Box>

        <Box mt={3}>
          <Label>Words & Icons</Label>
          {/* <Checkbox
            id="gradient"
            label="Gradient"
            value={style.itemsColorKind === 'gradient'}
            onChange={(value) => {
              style.itemsColorKind = value ? 'gradient' : 'color'
            }}
          /> */}
          <Button
            mr={0}
            primary
            outline={style.itemsColorKind !== 'color'}
            onClick={() => {
              style.itemsColorKind = 'color'
            }}
          >
            Color
          </Button>
          <Button
            primary
            outline={style.itemsColorKind !== 'gradient'}
            onClick={() => {
              style.itemsColorKind = 'gradient'
            }}
          >
            gradient
          </Button>

          <Box mt={2}>
            {style.itemsColorKind === 'color' && (
              <ColorPicker
                value={style.itemsColor}
                onChange={(hex) => {
                  style.itemsColor = hex
                  editorPageStore.editor?.setItemsColor(
                    'shape',
                    editorPageStore.getItemColoring('shape')
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
                    editorPageStore.editor?.setItemsColor(
                      'shape',
                      editorPageStore.getItemColoring('shape')
                    )
                  }}
                />
                <ColorPicker
                  value={style.itemsColorGradient.to}
                  onChange={(hex) => {
                    style.itemsColorGradient.to = hex
                    editorPageStore.editor?.setItemsColor(
                      'shape',
                      editorPageStore.getItemColoring('shape')
                    )
                  }}
                />
              </>
            )}
          </Box>
        </Box>

        <Box mt={3}>
          <Slider
            label="Dim smaller words"
            value={style.dimSmallerItems}
            onChange={(value) => {
              const val = (value as any) as number
              style.dimSmallerItems = val
            }}
            min={0}
            max={100}
            step={1}
          />
        </Box>
      </>
    )
  }
)
