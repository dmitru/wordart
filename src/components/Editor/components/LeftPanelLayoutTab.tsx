import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { Slider } from 'components/shared/Slider'
import { Label } from 'components/Editor/components/shared'
import { useCallback } from 'react'
import { TargetKind } from 'components/Editor/lib/editor'
import { Button, Heading } from '@chakra-ui/core'
import { WordAnglesPresetKind } from 'components/Editor/style-options'

const anglePresets: {
  kind: WordAnglesPresetKind
  title: string
  getAngles: () => number[]
}[] = [
  { kind: 'horizontal', title: 'Horizontal', getAngles: () => [0] },
  { kind: 'vertical', title: 'Vertical', getAngles: () => [-90] },
  {
    kind: 'hor-ver',
    title: 'Horizontal / Vertical',
    getAngles: () => [0, -90],
  },
  {
    kind: 'hor-ver-diagonal',
    title: 'Horizontal / Vertical / Diagonal',
    getAngles: () => [0, -90, -45, 45],
  },
  { kind: 'diagonal', title: 'Diagonal', getAngles: () => [45, -45] },
  { kind: 'diagonal up', title: 'Diagonal Up', getAngles: () => [-45] },
  { kind: 'diagonal down', title: 'Diagonal Down', getAngles: () => [45] },
  { kind: '15 up', title: 'Sloping Up', getAngles: () => [-15] },
  { kind: '15 down', title: 'Sloping Down', getAngles: () => [15] },
  { kind: '15', title: 'Sloping', getAngles: () => [15, -15] },
  {
    kind: 'random',
    title: 'Random',
    getAngles: () =>
      Array(8)
        .fill(null)
        .map((a) => -90 + Math.round(180 * Math.random())),
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

    return null

    // return (
    //   <>
    //     {style.words.wordList.length > 0 && (
    //       <Box mb="5">
    //         <Heading size="md" mt="2" mb="3">
    //           Words
    //         </Heading>

    //         <Box mb="3">
    //           <Slider
    //             label="Size"
    //             value={style.placement.wordsMaxSize}
    //             onChange={(value) => {
    //               const val = (value as any) as number
    //               style.placement.wordsMaxSize = val
    //             }}
    //             onAfterChange={visualize}
    //             min={20}
    //             max={100}
    //             step={1}
    //           />
    //         </Box>

    //         <Box>
    //           {anglePresets.map((preset) => (
    //             <Button
    //               key={preset.kind}
    //               onClick={() => {
    //                 style.words.angles.preset = preset.kind
    //                 style.words.angles.angles = preset.getAngles()
    //               }}
    //               variantColor={
    //                 preset.kind === style.words.angles.preset
    //                   ? 'primary'
    //                   : undefined
    //               }
    //             >
    //               {preset.title}
    //             </Button>
    //           ))}
    //         </Box>
    //         {style.words.angles.preset === 'custom' && (
    //           <Slider
    //             label="Angle"
    //             value={style.words.angles.angles[0]}
    //             onChange={(value) => {
    //               const val = (value as any) as number
    //               style.words.angles.angles = [val]
    //             }}
    //             onAfterChange={visualize}
    //             min={-90}
    //             max={90}
    //             step={1}
    //           />
    //         )}
    //       </Box>
    //     )}

    //     {style.icons.iconList.length > 0 && (
    //       <Box mb="4">
    //         <Label>Icons</Label>
    //         <Slider
    //           label="Size"
    //           value={style.placement.iconsMaxSize}
    //           onChange={(value) => {
    //             const val = (value as any) as number
    //             style.placement.iconsMaxSize = val
    //           }}
    //           onAfterChange={visualize}
    //           min={20}
    //           max={100}
    //           step={1}
    //         />
    //         <Slider
    //           label="Amount"
    //           value={style.placement.iconsProportion}
    //           onChange={(value) => {
    //             const val = (value as any) as number
    //             style.placement.iconsProportion = val
    //           }}
    //           onAfterChange={visualize}
    //           min={0}
    //           max={100}
    //           step={1}
    //         />
    //       </Box>
    //     )}

    //     <Box mb="4">
    //       <Heading size="md" mb="3" mt="2">
    //         Placement
    //       </Heading>
    //       {/* <Checkbox
    //         id="fit-shape"
    //         label="Allow words to go beyond shape"
    //         value={!style.fitWithinShape}
    //         onChange={(value) => {
    //           style.fitWithinShape = !value
    //         }}
    //         mb="3"
    //       /> */}
    //       <Slider
    //         label="Density"
    //         value={style.placement.itemDensity}
    //         onChange={(value) => {
    //           const val = (value as any) as number
    //           style.placement.itemDensity = val
    //         }}
    //         onAfterChange={visualize}
    //         min={0}
    //         max={100}
    //         step={1}
    //       />
    //       {style.placement.fitWithinShape && (
    //         <>
    //           <Slider
    //             label="Shape Offset"
    //             value={style.placement.shapePadding}
    //             onChange={(value) => {
    //               const val = (value as any) as number
    //               style.placement.shapePadding = val
    //             }}
    //             onAfterChange={visualize}
    //             min={0}
    //             max={100}
    //             step={1}
    //           />
    //         </>
    //       )}
    //     </Box>
    //   </>
    // )
  }
)
