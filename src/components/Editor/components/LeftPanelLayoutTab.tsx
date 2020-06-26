import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import { Slider } from 'components/shared/Slider'
import { Button } from 'components/shared/Button'
import { DeleteButton } from 'components/shared/DeleteButton'
import { SectionLabel } from 'components/Editor/components/shared'
import { useCallback } from 'react'
import { TargetKind } from 'components/Editor/lib/editor'
import { Text, Box, Heading, Flex, Icon, Divider } from '@chakra-ui/core'
import { WordAnglesPresetKind } from 'components/Editor/style-options'
// @ts-ignore
import VerImg from './img/ver.svg'
// @ts-ignore
import HorImg from './img/hor.svg'
// @ts-ignore
import HorVerImg from './img/hor-ver.svg'
// @ts-ignore
import HorVerDiagImg from './img/hor-ver-diag.svg'
// @ts-ignore
import DiagImg from './img/diag.svg'
// @ts-ignore
import DiagUpImg from './img/diag-up.svg'
// @ts-ignore
import DiagDownImg from './img/diag-down.svg'
// @ts-ignore
import SlopeImg from './img/slope.svg'
// @ts-ignore
import SlopeUpImg from './img/slope-up.svg'
// @ts-ignore
import SlopeDownImg from './img/slope-down.svg'
// @ts-ignore
import CustomImg from './img/custom.svg'
// @ts-ignore
import RandomImg from './img/random.svg'
import styled from '@emotion/styled'
import css from '@emotion/css'
import { animateElement } from 'utils/animation'

const anglePresets: {
  kind: WordAnglesPresetKind
  title: string
  Svg?: React.ComponentType<any>
}[] = [
  { kind: 'horizontal', title: 'Horizontal', Svg: HorImg },
  { kind: 'vertical', title: 'Vertical', Svg: VerImg },
  {
    kind: 'hor-ver',
    title: 'Horizontal / Vertical',
    Svg: HorVerImg,
  },
  {
    kind: 'hor-ver-diagonal',
    title: 'Horizontal / Vertical / Diagonal',
    Svg: HorVerDiagImg,
  },
  {
    kind: 'diagonal',
    title: 'Diagonal',
    Svg: DiagImg,
  },
  { kind: 'diagonal up', title: 'Diagonal Up', Svg: DiagUpImg },
  { kind: 'diagonal down', title: 'Diagonal Down', Svg: DiagDownImg },
  {
    kind: 'random',
    title: 'Random',
    Svg: RandomImg,
  },
  { kind: '15 up', title: 'Sloping Up', Svg: SlopeUpImg },
  { kind: '15 down', title: 'Sloping Down', Svg: SlopeDownImg },
  { kind: '15', title: 'Sloping', Svg: SlopeImg },
  {
    kind: 'custom',
    title: 'Custom',
    Svg: CustomImg,
  },
]

const PresetBtns = styled(Box)`
  margin: 0 -2px;
`

const PresetBtn = styled(Box)<{ active: boolean; theme: any }>`
  cursor: pointer;
  user-select: none;
  display: inline-block;
  width: 78px;
  height: 78px;
  margin: 2px;
  border: 1px solid #dedede;
  padding: 6px;
  box-shadow: 0 0 4px 0 #00000015;

  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  ${(p) =>
    p.active &&
    `
  outline: 3px solid ${p.theme.colors.accent['500']};
  background: hsla(358, 80%, 65%, 0.14);
  `}
`

export type LeftPanelLayoutTabProps = {
  target: TargetKind
}

export const LeftPanelLayoutTab: React.FC<LeftPanelLayoutTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]

    const animateVisualize = useCallback(() => {
      store.animateVisualize(false)
    }, [])

    return (
      <Box px="5" py="6">
        <Box mb="2.5rem">
          <SectionLabel>Placement</SectionLabel>
          <Slider
            horizontal
            label="Density"
            afterLabel="%"
            value={style.items.placement.itemDensity}
            onChange={(value) => {
              const val = (value as any) as number
              style.items.placement.itemDensity = val
            }}
            onAfterChange={animateVisualize}
            min={0}
            max={100}
            step={1}
          />

          <Slider
            horizontal
            label="Shape Offset"
            afterLabel="%"
            value={style.items.placement.shapePadding}
            onChange={(value) => {
              const val = (value as any) as number
              style.items.placement.shapePadding = val
            }}
            onAfterChange={animateVisualize}
            min={0}
            max={100}
            step={1}
          />
        </Box>

        {style.items.words.wordList.length > 0 && (
          <>
            <Box mb="2.5rem">
              <SectionLabel>Words</SectionLabel>

              <Box mb="4">
                <Slider
                  horizontal
                  label="Size"
                  afterLabel="%"
                  value={style.items.placement.wordsMaxSize}
                  onChange={(value) => {
                    const val = (value as any) as number
                    style.items.placement.wordsMaxSize = val
                  }}
                  onAfterChange={animateVisualize}
                  min={20}
                  max={100}
                  step={1}
                />
              </Box>

              <PresetBtns>
                {anglePresets.map((preset) => (
                  <>
                    <PresetBtn
                      active={preset.kind === style.items.words.anglesPreset}
                      onClick={() => {
                        style.items.words.anglesPreset = preset.kind
                        animateVisualize()
                      }}
                    >
                      {preset.Svg && <preset.Svg width="100%" height="100%" />}
                    </PresetBtn>
                  </>
                ))}
              </PresetBtns>
              {style.items.words.anglesPreset === 'custom' && (
                <>
                  <Box mt="3">
                    <Button
                      mr="1"
                      variantColor="secondary"
                      isDisabled={style.items.words.customAngles.length >= 8}
                      size="sm"
                      leftIcon="add"
                      onClick={() => {
                        style.items.words.customAngles.push(
                          Math.round(-90 + Math.random() * 180)
                        )
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        style.items.words.customAngles = [0]
                      }}
                    >
                      Reset
                    </Button>
                  </Box>

                  <Box mt="4" pl="20px">
                    {style.items.words.customAngles.map((angle, index) => (
                      <Flex direction="row" key={index}>
                        <Slider
                          css={css`
                            flex: 1;
                          `}
                          label={`Angle #${index + 1}`}
                          horizontal
                          value={angle}
                          onChange={(value) => {
                            const val = (value as any) as number
                            style.items.words.customAngles[index] = val
                          }}
                          onAfterChange={animateVisualize}
                          min={-90}
                          max={90}
                          step={1}
                          afterLabel="°"
                        />
                        <Box width="30px" ml="4">
                          {style.items.words.customAngles.length > 1 && (
                            <DeleteButton
                              onClick={() => {
                                style.items.words.customAngles.splice(index, 1)
                              }}
                            />
                          )}
                        </Box>
                      </Flex>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </>
        )}

        {style.items.icons.iconList.length > 0 && (
          <Box mb="4">
            <SectionLabel>Icons</SectionLabel>

            <Slider
              horizontal
              label="Size"
              afterLabel="%"
              value={style.items.placement.iconsMaxSize}
              onChange={(value) => {
                const val = (value as any) as number
                style.items.placement.iconsMaxSize = val
              }}
              onAfterChange={animateVisualize}
              min={20}
              max={100}
              step={1}
            />
            <Slider
              horizontal
              label="Icons amount"
              afterLabel="%"
              value={style.items.placement.iconsProportion}
              onChange={(value) => {
                const val = (value as any) as number
                style.items.placement.iconsProportion = val
              }}
              onAfterChange={animateVisualize}
              min={0}
              max={100}
              step={1}
            />
          </Box>
        )}
      </Box>
    )
  }
)
