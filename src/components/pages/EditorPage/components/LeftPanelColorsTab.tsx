import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { Checkbox } from 'components/shared/Checkbox'
import { ColorPicker } from 'components/shared/ColorPicker'
import styled from '@emotion/styled'
import { useDebouncedCallback } from 'use-debounce'
import { Box } from 'components/shared/Box'
import { Button } from 'components/shared/Button'
import { Label } from './shared'
import { Slider } from 'components/shared/Slider'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'

export type LeftPanelColorsTabProps = {}

export const LeftPanelColorsTab: React.FC<LeftPanelColorsTabProps> = observer(
  (props) => {
    const { editorPageStore } = useStore()
    const { shapeStyle: style, backgroundStyle } = editorPageStore

    const updateColoring = useThrottleCallback(
      () => {
        editorPageStore.editor?.setItemsColor(
          'shape',
          editorPageStore.getItemColoring('shape')
        )
      },
      20,
      true
    )

    return (
      <>
        <Box>
          <Label mb={2}>Words</Label>
          {/* <Checkbox
            id="gradient"
            label="Gradient"
            value={style.itemsColorKind === 'gradient'}
            onChange={(value) => {
              style.itemsColorKind = value ? 'gradient' : 'color'
            }}
          /> */}
          <Button
            px={2}
            py={1}
            mr={0}
            borderRadius="none"
            secondary={style.itemsColorKind === 'color'}
            outline={style.itemsColorKind !== 'color'}
            onClick={() => {
              style.itemsColorKind = 'color'
              updateColoring()
            }}
          >
            Color
          </Button>
          <Button
            px={2}
            py={1}
            borderRadius="none"
            secondary={style.itemsColorKind === 'gradient'}
            outline={style.itemsColorKind !== 'gradient'}
            onClick={() => {
              style.itemsColorKind = 'gradient'
              updateColoring()
            }}
          >
            Gradient
          </Button>

          <Box mt={2}>
            {style.itemsColorKind === 'color' && (
              <ColorPicker
                value={style.itemsColor}
                onChange={(hex) => {
                  style.itemsColor = hex
                  updateColoring()
                }}
              />
            )}
            {style.itemsColorKind === 'gradient' && (
              <>
                <ColorPicker
                  value={style.itemsColorGradient.from}
                  onChange={(hex) => {
                    style.itemsColorGradient.from = hex
                    updateColoring()
                  }}
                />
                <ColorPicker
                  value={style.itemsColorGradient.to}
                  onChange={(hex) => {
                    style.itemsColorGradient.to = hex
                    updateColoring()
                  }}
                />
              </>
            )}
          </Box>
        </Box>

        <Box mt={2}>
          <Slider
            label="Emphasize larger words"
            value={style.dimSmallerItems}
            onChange={(value) => {
              const val = (value as any) as number
              style.dimSmallerItems = val
              updateColoring()
            }}
            min={0}
            max={100}
            step={1}
          />
        </Box>

        <Box mt={4}>
          <Label>Shape</Label>
          <ColorPicker
            disableAlpha
            value={chroma(style.bgColor).alpha(1).hex()}
            onChange={(hex) => {
              const a = chroma(style.bgColor).alpha()
              const color = chroma(hex).alpha(a).hex()
              style.bgColor = color
              editorPageStore.editor?.setShapeFillColor(color)
            }}
          />
          <Box>
            <Slider
              label="Transparency"
              value={chroma(style.bgColor).alpha() * 100}
              onChange={(value) => {
                const color = chroma(style.bgColor)
                  .alpha(value / 100)
                  .hex()
                style.bgColor = color
                editorPageStore.editor?.setShapeFillColor(color)
              }}
              min={0}
              max={100}
              step={1}
            />
          </Box>
        </Box>

        <Box mt={4}>
          <Label>Background</Label>
          <ColorPicker
            value={backgroundStyle.bgColor}
            onChange={(hex) => {
              backgroundStyle.bgColor = hex
              editorPageStore.editor?.setBackgroundColor(hex)
            }}
          />
        </Box>
      </>
    )
  }
)
