import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { ColorPicker } from 'components/shared/ColorPicker'
import { Box } from 'components/shared/Box'
import { Button } from 'components/shared/Button'
import { Label } from './shared'
import { Slider } from 'components/shared/Slider'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import { getItemsColoring, TargetKind } from 'components/Editor/lib/editor'

export type LeftPanelColorsTabProps = {
  target: TargetKind
}

export const LeftPanelColorsTab: React.FC<LeftPanelColorsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore } = useStore()
    const shape = editorPageStore.getSelectedShape()
    const shapeStyle = editorPageStore.styles.shape
    const bgStyle = editorPageStore.styles.bg
    const style = editorPageStore.styles[target]

    const updateItemsColoring = useThrottleCallback(
      () => {
        editorPageStore.editor?.setItemsColor(target, getItemsColoring(style))
      },
      20,
      true
    )

    const updateShapeColoring = useThrottleCallback(
      () => {
        editorPageStore.editor?.setShapeFillColors(shapeStyle.fill)
        if (shapeStyle.itemsColoring.kind === 'shape') {
          editorPageStore.editor?.setItemsColor(
            'shape',
            getItemsColoring(shapeStyle)
          )
        }
      },
      20,
      true
    )

    return (
      <>
        <Box mb={4}>
          <Box>
            <Label mb={2}>Shape</Label>
          </Box>

          {shape.kind === 'svg' && (
            <>
              <Box>
                <Button
                  px={2}
                  py={1}
                  mr={0}
                  secondary={shapeStyle.fill.kind === 'color-map'}
                  outline={shapeStyle.fill.kind !== 'color-map'}
                  onClick={() => {
                    shapeStyle.fill.kind = 'color-map'
                    updateShapeColoring()
                  }}
                >
                  Shape colors
                </Button>
                <Button
                  px={2}
                  py={1}
                  mr={0}
                  secondary={shapeStyle.fill.kind === 'single-color'}
                  outline={shapeStyle.fill.kind !== 'single-color'}
                  onClick={() => {
                    shapeStyle.fill.kind = 'single-color'
                    updateShapeColoring()
                  }}
                >
                  Color
                </Button>
              </Box>

              <Box mt={2}>
                {shapeStyle.fill.kind === 'single-color' && (
                  <ColorPicker
                    disableAlpha
                    value={chroma(shapeStyle.fill.color).alpha(1).hex()}
                    onChange={(hex) => {
                      shapeStyle.fill.color = chroma(hex).hex()
                    }}
                    onAfterChange={() => {
                      updateShapeColoring()
                    }}
                  />
                )}

                {shapeStyle.fill.kind === 'color-map' &&
                  shapeStyle.fill.colorMap.map((color, index) => (
                    <Box mr={1} key={index} display="inline-block">
                      <ColorPicker
                        disableAlpha
                        value={chroma(color).alpha(1).hex()}
                        onChange={(hex) => {
                          shapeStyle.fill.colorMap[index] = chroma(hex).hex()
                        }}
                        onAfterChange={() => {
                          updateShapeColoring()
                        }}
                      />
                    </Box>
                  ))}
              </Box>
            </>
          )}

          <Box mt={2}>
            <Slider
              label="Opacity"
              value={100 * shapeStyle.fill.opacity}
              onChange={(value) => {
                shapeStyle.fill.opacity = value / 100
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

        <Box mb={2}>
          <Label mb={2}>Words & Icons</Label>
          {/* <Checkbox
            id="gradient"
            label="Gradient"
            value={style.itemsColoring.kind === 'gradient'}
            onChange={(value) => {
              style.itemsColoring.kind = value ? 'gradient' : 'color'
            }}
          /> */}
          <Button
            px={2}
            py={1}
            mr={0}
            secondary={style.itemsColoring.kind === 'shape'}
            outline={style.itemsColoring.kind !== 'shape'}
            onClick={() => {
              style.itemsColoring.kind = 'shape'
              updateItemsColoring()
            }}
          >
            Same as Shape
          </Button>

          <Button
            px={2}
            py={1}
            secondary={style.itemsColoring.kind === 'gradient'}
            outline={style.itemsColoring.kind !== 'gradient'}
            onClick={() => {
              style.itemsColoring.kind = 'gradient'
              updateItemsColoring()
            }}
          >
            Gradient
          </Button>

          <Button
            px={2}
            py={1}
            mr={0}
            secondary={style.itemsColoring.kind === 'color'}
            outline={style.itemsColoring.kind !== 'color'}
            onClick={() => {
              style.itemsColoring.kind = 'color'
              updateItemsColoring()
            }}
          >
            Color
          </Button>

          <Box mt={2}>
            {style.itemsColoring.kind === 'color' && (
              <ColorPicker
                disableAlpha
                value={style.itemsColoring.color}
                onChange={(hex) => {
                  style.itemsColoring.color = hex
                }}
                onAfterChange={updateItemsColoring}
              />
            )}
            {style.itemsColoring.kind === 'gradient' && (
              <>
                <Box mr={1} display="inline-block">
                  <ColorPicker
                    disableAlpha
                    value={style.itemsColoring.gradient.from}
                    onChange={(hex) => {
                      style.itemsColoring.gradient.from = hex
                    }}
                    onAfterChange={updateItemsColoring}
                  />
                </Box>
                <Box mr={1} display="inline-block">
                  <ColorPicker
                    disableAlpha
                    value={style.itemsColoring.gradient.to}
                    onChange={(hex) => {
                      style.itemsColoring.gradient.to = hex
                    }}
                    onAfterChange={updateItemsColoring}
                  />
                </Box>
              </>
            )}
          </Box>
        </Box>

        <Box mb={4}>
          <Slider
            label="Make larger words brighter"
            value={style.itemsColoring.dimSmallerItems}
            onChange={(value) => {
              const val = (value as any) as number
              style.itemsColoring.dimSmallerItems = val
            }}
            onAfterChange={updateItemsColoring}
            min={0}
            max={100}
            step={1}
          />
        </Box>

        <Box mb={4}>
          <Label mb={2}>Background</Label>
          <ColorPicker
            disableAlpha
            value={chroma(bgStyle.fill.color).alpha(1).hex()}
            onChange={(hex) => {
              bgStyle.fill.color = chroma(hex).hex()
            }}
            onAfterChange={() => {
              editorPageStore.editor?.setBgColor(bgStyle.fill)
              if (bgStyle.itemsColoring.kind === 'shape') {
                editorPageStore.editor?.setItemsColor(
                  'bg',
                  getItemsColoring(bgStyle)
                )
              }
            }}
          />
        </Box>
      </>
    )
  }
)
