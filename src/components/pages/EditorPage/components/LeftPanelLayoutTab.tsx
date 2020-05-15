import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { Slider } from 'components/shared/Slider'
import { Label } from 'components/pages/EditorPage/components/shared'
import { Box } from 'components/shared/Box'
import { useCallback } from 'react'
import { TargetKind } from 'components/pages/EditorPage/editor'

export type LeftPanelLayoutTabProps = {
  target: TargetKind
}

export const LeftPanelLayoutTab: React.FC<LeftPanelLayoutTabProps> = observer(
  ({ target }) => {
    const { editorPageStore } = useStore()
    const style = editorPageStore.styles[target]

    const visualize = useCallback(() => {
      // editorPageStore.editor?.generateShapeItems({ style })
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
            value={style.layout.itemDensity}
            onChange={(value) => {
              const val = (value as any) as number
              style.layout.itemDensity = val
            }}
            onAfterChange={visualize}
            min={0}
            max={100}
            step={1}
          />
          {style.layout.fitWithinShape && (
            <>
              <Slider
                label="Shape Offset"
                value={style.layout.shapePadding}
                onChange={(value) => {
                  const val = (value as any) as number
                  style.layout.shapePadding = val
                }}
                onAfterChange={visualize}
                min={0}
                max={100}
                step={1}
              />
            </>
          )}
        </Box>

        {style.words.wordList.length > 0 && (
          <Box mb={4}>
            <Label>Words</Label>

            <Slider
              label="Angle"
              value={style.words.angles.angles[0]}
              onChange={(value) => {
                const val = (value as any) as number
                style.words.angles.angles = [val]
              }}
              onAfterChange={visualize}
              min={-90}
              max={90}
              step={1}
            />

            <Slider
              label="Size"
              value={style.layout.wordsMaxSize}
              onChange={(value) => {
                const val = (value as any) as number
                style.layout.wordsMaxSize = val
              }}
              onAfterChange={visualize}
              min={20}
              max={100}
              step={1}
            />
          </Box>
        )}

        {style.icons.iconList.length > 0 && (
          <Box mb={4}>
            <Label>Icons</Label>
            <Slider
              label="Size"
              value={style.layout.iconsMaxSize}
              onChange={(value) => {
                const val = (value as any) as number
                style.layout.iconsMaxSize = val
              }}
              onAfterChange={visualize}
              min={20}
              max={100}
              step={1}
            />
            <Slider
              label="Amount"
              value={style.layout.iconsProportion}
              onChange={(value) => {
                const val = (value as any) as number
                style.layout.iconsProportion = val
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
