import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { ColorPicker } from 'components/shared/ColorPicker'
import { Box } from 'components/shared/Box'
import { Button } from 'components/shared/Button'
import { Label } from './shared'
import { Slider } from 'components/shared/Slider'
import { useThrottleCallback } from '@react-hook/throttle'
import chroma from 'chroma-js'
import { getItemsColoring } from 'components/pages/EditorPage/editor'

export type LeftPanelColorsTabProps = {}

export const LeftPanelColorsTab: React.FC<LeftPanelColorsTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    const shapeStyle = editorPageStore.styles.shape
    const bgStyle = editorPageStore.styles.bg

    const updateShapeItemsColoring = useThrottleCallback(
      () => {
        editorPageStore.editor?.setItemsColor(
          'shape',
          getItemsColoring(shapeStyle)
        )
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

        <Box mb={4}>
          <Box>
            <Label mb={2}>Shape</Label>
          </Box>

          <Box>
            <Button
              px={2}
              py={1}
              mr={0}
              primary={shapeStyle.fill.kind === 'color-map'}
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
              primary={shapeStyle.fill.kind === 'single-color'}
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

        <Box>
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
            primary={shapeStyle.itemsColoring.kind === 'shape'}
            outline={shapeStyle.itemsColoring.kind !== 'shape'}
            onClick={() => {
              shapeStyle.itemsColoring.kind = 'shape'
              updateShapeItemsColoring()
            }}
          >
            Same as Shape
          </Button>

          <Button
            px={2}
            py={1}
            primary={shapeStyle.itemsColoring.kind === 'gradient'}
            outline={shapeStyle.itemsColoring.kind !== 'gradient'}
            onClick={() => {
              shapeStyle.itemsColoring.kind = 'gradient'
              updateShapeItemsColoring()
            }}
          >
            Gradient
          </Button>

          <Button
            px={2}
            py={1}
            mr={0}
            primary={shapeStyle.itemsColoring.kind === 'color'}
            outline={shapeStyle.itemsColoring.kind !== 'color'}
            onClick={() => {
              shapeStyle.itemsColoring.kind = 'color'
              updateShapeItemsColoring()
            }}
          >
            Color
          </Button>

          <Box mt={2}>
            {shapeStyle.itemsColoring.kind === 'color' && (
              <ColorPicker
                disableAlpha
                value={shapeStyle.itemsColoring.color}
                onChange={(hex) => {
                  shapeStyle.itemsColoring.color = hex
                }}
                onAfterChange={updateShapeItemsColoring}
              />
            )}
            {shapeStyle.itemsColoring.kind === 'gradient' && (
              <>
                <Box mr={1} display="inline-block">
                  <ColorPicker
                    disableAlpha
                    value={shapeStyle.itemsColoring.gradient.from}
                    onChange={(hex) => {
                      shapeStyle.itemsColoring.gradient.from = hex
                    }}
                    onAfterChange={updateShapeItemsColoring}
                  />
                </Box>
                <Box mr={1} display="inline-block">
                  <ColorPicker
                    disableAlpha
                    value={shapeStyle.itemsColoring.gradient.to}
                    onChange={(hex) => {
                      shapeStyle.itemsColoring.gradient.to = hex
                    }}
                    onAfterChange={updateShapeItemsColoring}
                  />
                </Box>
              </>
            )}
          </Box>
        </Box>

        <Box mt={2}>
          <Slider
            label="Make larger words brighter"
            value={shapeStyle.itemsColoring.dimSmallerItems}
            onChange={(value) => {
              const val = (value as any) as number
              shapeStyle.itemsColoring.dimSmallerItems = val
            }}
            onAfterChange={updateShapeItemsColoring}
            min={0}
            max={100}
            step={1}
          />
        </Box>
      </>
    )
  }
)
