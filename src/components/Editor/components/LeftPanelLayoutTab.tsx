import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { Slider } from 'components/shared/Slider'
import { Label } from 'components/Editor/components/shared'
import { useCallback } from 'react'
import { TargetKind } from 'components/Editor/lib/editor'
import { Button, Box, Heading } from '@chakra-ui/core'
import { WordAnglesPresetKind } from 'components/Editor/style-options'

const anglePresets: {
  kind: WordAnglesPresetKind
  title: string
}[] = [
  { kind: 'horizontal', title: 'Horizontal' },
  { kind: 'vertical', title: 'Vertical' },
  {
    kind: 'hor-ver',
    title: 'Horizontal / Vertical',
  },
  {
    kind: 'hor-ver-diagonal',
    title: 'Horizontal / Vertical / Diagonal',
  },
  { kind: 'diagonal', title: 'Diagonal' },
  { kind: 'diagonal up', title: 'Diagonal Up' },
  { kind: 'diagonal down', title: 'Diagonal Down' },
  { kind: '15 up', title: 'Sloping Up' },
  { kind: '15 down', title: 'Sloping Down' },
  { kind: '15', title: 'Sloping' },
  {
    kind: 'random',
    title: 'Random',
  },
]

export type LeftPanelLayoutTabProps = {
  target: TargetKind
}

export const LeftPanelLayoutTab: React.FC<LeftPanelLayoutTabProps> = observer(
  ({ target }) => {
    const { editorPageStore } = useStore()
    const style = editorPageStore.styleOptions[target]

    const visualize = useCallback(() => {
      // editorPageStore.editor?.generateShapeItems({ style })
    }, [])

    // return null

    return (
      <>
        {style.items.words.wordList.length > 0 && (
          <Box mb="5">
            <Heading size="md" mt="2" mb="3">
              Words
            </Heading>

            <Box mb="3">
              <Slider
                label="Size"
                value={style.items.placement.wordsMaxSize}
                onChange={(value) => {
                  const val = (value as any) as number
                  style.items.placement.wordsMaxSize = val
                }}
                onAfterChange={visualize}
                min={20}
                max={100}
                step={1}
              />
            </Box>

            <Heading size="sm" mt="2" mb="3">
              Angles
            </Heading>

            <Box>
              {anglePresets.map((preset) => (
                <Button
                  key={preset.kind}
                  onClick={() => {
                    style.items.words.anglesPreset = preset.kind
                  }}
                  variantColor={
                    preset.kind === style.items.words.anglesPreset
                      ? 'primary'
                      : undefined
                  }
                >
                  {preset.title}
                </Button>
              ))}
            </Box>
            {style.items.words.anglesPreset === 'custom' && (
              <Slider
                label="Angle"
                value={style.items.words.customAngles[0]}
                onChange={(value) => {
                  const val = (value as any) as number
                  style.items.words.customAngles = [val]
                }}
                onAfterChange={visualize}
                min={-90}
                max={90}
                step={1}
              />
            )}
          </Box>
        )}

        {style.items.icons.iconList.length > 0 && (
          <Box mb="4">
            <Label>Icons</Label>
            <Slider
              label="Size"
              value={style.items.placement.iconsMaxSize}
              onChange={(value) => {
                const val = (value as any) as number
                style.items.placement.iconsMaxSize = val
              }}
              onAfterChange={visualize}
              min={20}
              max={100}
              step={1}
            />
            <Slider
              label="Amount"
              value={style.items.placement.iconsProportion}
              onChange={(value) => {
                const val = (value as any) as number
                style.items.placement.iconsProportion = val
              }}
              onAfterChange={visualize}
              min={0}
              max={100}
              step={1}
            />
          </Box>
        )}

        <Box mb="4">
          <Heading size="md" mb="3" mt="2">
            Placement
          </Heading>
          {/* <Checkbox
            id="fit-shape"
            label="Allow words to go beyond shape"
            value={!style.fitWithinShape}
            onChange={(value) => {
              style.fitWithinShape = !value
            }}
            mb="3"
          /> */}
          <Slider
            label="Density"
            value={style.items.placement.itemDensity}
            onChange={(value) => {
              const val = (value as any) as number
              style.items.placement.itemDensity = val
            }}
            onAfterChange={visualize}
            min={0}
            max={100}
            step={1}
          />

          <Slider
            label="Shape Offset"
            value={style.items.placement.shapePadding}
            onChange={(value) => {
              const val = (value as any) as number
              style.items.placement.shapePadding = val
            }}
            onAfterChange={visualize}
            min={0}
            max={100}
            step={1}
          />
        </Box>
      </>
    )
  }
)
