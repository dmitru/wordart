import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { Slider } from 'components/shared/Slider'
import { Label } from 'components/pages/EditorPage/components/shared'
import { Box } from 'components/shared/Box'
import { useCallback } from 'react'

export type LeftPanelLayoutTabProps = {
  type: 'shape' | 'background'
}

export const LeftPanelLayoutTab: React.FC<LeftPanelLayoutTabProps> = observer(
  (props) => {
    const { editorPageStore } = useStore()
    const style =
      props.type === 'shape'
        ? editorPageStore.shapeStyle
        : editorPageStore.backgroundStyle

    const visualize = useCallback(() => {
      editorPageStore.editor?.generateItems('shape')
    }, [])

    return (
      <>
        <Box mb={4}>
          {/* <Checkbox
            id="fit-shape"
            label="Allow words to go beyond shape"
            value={!style.fitWithinShape}
            onChange={(value) => {
              style.fitWithinShape = !value
            }}
            mb={3}
          /> */}
          <Slider
            label="Density"
            value={style.itemDensity}
            onChange={(value) => {
              const val = (value as any) as number
              style.itemDensity = val
            }}
            onAfterChange={visualize}
            min={0}
            max={100}
            step={1}
          />
          {style.fitWithinShape && (
            <>
              <Slider
                label="Shape Offset"
                value={style.shapePadding}
                onChange={(value) => {
                  const val = (value as any) as number
                  style.shapePadding = val
                }}
                onAfterChange={visualize}
                min={0}
                max={100}
                step={1}
              />
            </>
          )}
        </Box>

        {style.words.length > 0 && (
          <Box mb={4}>
            <Label>Words</Label>

            <Slider
              label="Angle"
              value={style.angles[0]}
              onChange={(value) => {
                const val = (value as any) as number
                style.angles = [val]
              }}
              onAfterChange={visualize}
              min={-90}
              max={90}
              step={1}
            />

            <Slider
              label="Size"
              value={style.wordsMaxSize}
              onChange={(value) => {
                const val = (value as any) as number
                style.wordsMaxSize = val
              }}
              onAfterChange={visualize}
              min={20}
              max={100}
              step={1}
            />
          </Box>
        )}

        {style.icons.length > 0 && (
          <Box mb={4}>
            <Label>Icons</Label>
            <Slider
              label="Size"
              value={style.iconsMaxSize}
              onChange={(value) => {
                const val = (value as any) as number
                style.iconsMaxSize = val
              }}
              onAfterChange={visualize}
              min={20}
              max={100}
              step={1}
            />
            <Slider
              label="Amount"
              value={style.iconsProportion}
              onChange={(value) => {
                const val = (value as any) as number
                style.iconsProportion = val
              }}
              onAfterChange={visualize}
              min={0}
              max={100}
              step={1}
            />
          </Box>
        )}
      </>
    )
  }
)
