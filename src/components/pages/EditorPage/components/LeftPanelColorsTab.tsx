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
          <Label mb={2}>Words & Icons</Label>
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
            secondary={style.itemsColorKind === 'shape'}
            outline={style.itemsColorKind !== 'shape'}
            onClick={() => {
              style.itemsColorKind = 'shape'
              updateColoring()
            }}
          >
            Shape
          </Button>
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
                }}
                onAfterChange={updateColoring}
              />
            )}
            {style.itemsColorKind === 'gradient' && (
              <>
                <ColorPicker
                  value={style.itemsColorGradient.from}
                  onChange={(hex) => {
                    style.itemsColorGradient.from = hex
                  }}
                  onAfterChange={updateColoring}
                />
                <ColorPicker
                  value={style.itemsColorGradient.to}
                  onChange={(hex) => {
                    style.itemsColorGradient.to = hex
                  }}
                  onAfterChange={updateColoring}
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
            }}
            onAfterChange={updateColoring}
            min={0}
            max={100}
            step={1}
          />
        </Box>

        <Box mt={4}>
          <Label>Shape</Label>
          <Box>
            <Button
              px={2}
              py={1}
              mr={0}
              borderRadius="none"
              secondary={style.bgColorKind === 'color-map'}
              outline={style.bgColorKind !== 'color-map'}
              onClick={() => {
                style.bgColorKind = 'color-map'
                editorPageStore.editor?.updateShapeColoring()
                if (style.itemsColorKind === 'shape') {
                  editorPageStore.editor?.setItemsColor(
                    'shape',
                    editorPageStore.getItemColoring('shape')
                  )
                }
              }}
            >
              Shape colors
            </Button>
            <Button
              px={2}
              py={1}
              mr={0}
              borderRadius="none"
              secondary={style.bgColorKind === 'single-color'}
              outline={style.bgColorKind !== 'single-color'}
              onClick={() => {
                style.bgColorKind = 'single-color'
                editorPageStore.editor?.updateShapeColoring()
                if (style.itemsColorKind === 'shape') {
                  editorPageStore.editor?.setItemsColor(
                    'shape',
                    editorPageStore.getItemColoring('shape')
                  )
                }
              }}
            >
              Single color
            </Button>
          </Box>

          {style.bgColorKind === 'single-color' && (
            <ColorPicker
              disableAlpha
              value={chroma(style.bgColor).alpha(1).hex()}
              onChange={(hex) => {
                style.bgColor = chroma(hex).hex()
              }}
              onAfterChange={() => {
                editorPageStore.editor?.updateShapeColoring()
                if (style.itemsColorKind === 'shape') {
                  editorPageStore.editor?.setItemsColor(
                    'shape',
                    editorPageStore.getItemColoring('shape')
                  )
                }
              }}
            />
          )}

          {style.bgColorKind === 'color-map' &&
            style.bgColorMap.map((color, index) => (
              <ColorPicker
                key={index}
                disableAlpha
                value={chroma(color).alpha(1).hex()}
                onChange={(hex) => {
                  style.bgColorMap[index] = chroma(hex).hex()
                }}
                onAfterChange={() => {
                  editorPageStore.editor?.updateShapeColoring()
                  if (style.itemsColorKind === 'shape') {
                    editorPageStore.editor?.setItemsColor(
                      'shape',
                      editorPageStore.getItemColoring('shape')
                    )
                  }
                }}
              />
            ))}
          <Box>
            <Slider
              label="Opacity"
              value={100 * style.bgOpacity}
              onChange={(value) => {
                style.bgOpacity = value / 100
              }}
              onAfterChange={(value) => {
                editorPageStore.editor?.setShapeFillOpacity(value / 100)
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
            value={backgroundStyle.bgColorMap[0]}
            onChange={(hex) => {
              backgroundStyle.bgColorMap[0] = hex
            }}
            onAfterChange={() => {
              editorPageStore.editor?.setBackgroundColor(
                backgroundStyle.bgColorMap[0]
              )
            }}
          />
        </Box>
      </>
    )
  }
)
