import { Box, Checkbox, Flex, Alert } from '@chakra-ui/core'
import { AddIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import styled from '@emotion/styled'
import { SectionLabel } from 'components/Editor/components/shared'
import { LeftPanelTargetLayerDropdown } from 'components/Editor/components/TargetLayerDropdown'
import { useEditorStore } from 'components/Editor/editor-store'
import { TargetKind } from 'components/Editor/lib/editor'
import { WordAnglesPresetKind } from 'components/Editor/style-options'
import { Button } from 'components/shared/Button'
import { DeleteButton } from 'components/shared/DeleteButton'
import { Slider } from 'components/shared/Slider'
import { observer } from 'mobx-react'
import { useCallback, useMemo } from 'react'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
// @ts-ignore
import CustomImg from './img/custom.svg'
// @ts-ignore
import DiagDownImg from './img/diag-down.svg'
// @ts-ignore
import DiagUpImg from './img/diag-up.svg'
// @ts-ignore
import DiagImg from './img/diag.svg'
// @ts-ignore
import HorVerDiagImg from './img/hor-ver-diag.svg'
// @ts-ignore
import HorVerImg from './img/hor-ver.svg'
// @ts-ignore
import HorImg from './img/hor.svg'
// @ts-ignore
import RandomImg from './img/random.svg'
// @ts-ignore
import SlopeDownImg from './img/slope-down.svg'
// @ts-ignore
import SlopeUpImg from './img/slope-up.svg'
// @ts-ignore
import SlopeImg from './img/slope.svg'
// @ts-ignore
import VerImg from './img/ver.svg'

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
  display: flex;
  flex-wrap: wrap;
`

const PresetBtn = styled(Box)<{ active: boolean; theme: any }>`
  cursor: pointer;
  user-select: none;
  display: inline-block;
  width: 83px;
  height: 83px;
  margin: 0;
  border: 1px solid #dedede;
  padding: 6px;

  transition: transform 0.2s;

  &:hover {
    background: #eaeaea;
  }

  position: relative;
  z-index: 8;

  ${(p) =>
    p.active &&
    `
    z-index: 10;
  outline: 3px solid ${p.theme.colors.accent['500']};
  background: hsla(358, 80%, 65%, 0.14);
  `}
`

export type LeftPanelLayoutTabProps = {
  target: TargetKind
}

export const LeftPanelLayoutTab: React.FC<LeftPanelLayoutTabProps> = observer(
  ({ target }) => {
    const store = useEditorStore()!
    const style = store.styleOptions[target]

    const animateVisualize = useCallback((debounce = false) => {
      store.animateVisualize(debounce)
    }, [])

    const itemsCount = useMemo(() => {
      if (!store.editor) {
        return
      }
      const itemsParent = store.editor.items[target]
      if (!itemsParent) {
        return undefined
      }
      return itemsParent.items.length
    }, [store.renderKey, target])

    const handleMaxItemsCountChange = useCallback(
      (value: number) => {
        store.setMaxItemsCount(target, value)
      },
      [target, itemsCount]
    )

    const handleAfterMaxItemsCountChange = useCallback(() => {
      if (
        itemsCount != null &&
        style.items.placement.itemsMaxCount > itemsCount
      ) {
        animateVisualize(true)
      }
    }, [style, itemsCount])

    return (
      <Box px="5" py="6">
        <LeftPanelTargetLayerDropdown />

        <Box mb="2.5rem">
          <SectionLabel>Placement</SectionLabel>
          {style.items.placement.itemsMaxCount !== 'auto' && (
            <Box mb="4">
              <Slider
                horizontal
                label={
                  <>
                    Max. count
                    <HelpTooltipIcon
                      label={`Max. number of items to place. The algorithm may place less items, e.g. if there's not enough space.`}
                      ml="3"
                    />
                  </>
                }
                value={style.items.placement.itemsMaxCount}
                onChange={handleMaxItemsCountChange}
                onAfterChange={handleAfterMaxItemsCountChange}
                resetValue={300}
                min={1}
                max={700}
                step={1}
              />
            </Box>
          )}

          {/* {itemsCount != null &&
            style.items.placement.itemsMaxCount > itemsCount && (
              <Text color="gray.500" fontSize="sm">
                Re-visualization required
              </Text>
            )} */}

          <Box mb="4">
            <Slider
              horizontal
              label={
                <>
                  Density
                  <HelpTooltipIcon
                    label={`How close to each other the items should be placed. The higher density is, the closer together they are. The lower, the more apart.`}
                    ml="3"
                  />
                </>
              }
              afterLabel="%"
              value={style.items.placement.itemDensity}
              onChange={(value) => {
                const val = (value as any) as number
                style.items.placement.itemDensity = val
              }}
              onAfterChange={animateVisualize}
              resetValue={95}
              min={0}
              max={100}
              step={1}
            />
          </Box>

          <Box mb="4">
            <Slider
              horizontal
              label={
                <>
                  Padding
                  <HelpTooltipIcon
                    label={`Add some padding between the shape and placed items.`}
                    ml="3"
                  />
                </>
              }
              afterLabel="%"
              value={style.items.placement.shapePadding}
              onChange={(value) => {
                const val = (value as any) as number
                style.items.placement.shapePadding = val
              }}
              onAfterChange={animateVisualize}
              resetValue={10}
              min={0}
              max={100}
              step={1}
            />
          </Box>
        </Box>

        {style.items.words.wordList.length +
          style.items.icons.iconList.length ===
          0 && (
          <Alert status="info">
            The layer is empty. Please add some words or icons, then click
            "Visualize".
          </Alert>
        )}

        {style.items.words.wordList.length > 0 && (
          <>
            <Box mb="2.5rem">
              <SectionLabel>Words</SectionLabel>

              <Box mb="4">
                <Slider
                  horizontal
                  label={
                    <>
                      Max. size
                      <HelpTooltipIcon
                        label={`Size of the largest placed word. You can use this slider to make all words larger or smaller.`}
                        ml="3"
                      />
                    </>
                  }
                  afterLabel="%"
                  value={style.items.placement.wordsMaxSize}
                  onChange={(value) => {
                    const val = (value as any) as number
                    style.items.placement.wordsMaxSize = val
                  }}
                  onAfterChange={animateVisualize}
                  resetValue={90}
                  min={20}
                  max={100}
                  step={1}
                />
              </Box>

              <PresetBtns>
                {anglePresets.map((preset) => (
                  <PresetBtn
                    key={preset.kind}
                    active={preset.kind === style.items.words.anglesPreset}
                    onClick={() => {
                      style.items.words.anglesPreset = preset.kind
                      animateVisualize()
                    }}
                  >
                    {preset.Svg && <preset.Svg width="100%" height="100%" />}
                  </PresetBtn>
                ))}
              </PresetBtns>
              {style.items.words.anglesPreset === 'custom' && (
                <>
                  <Box mt="4">
                    <Button
                      mr="1"
                      colorScheme="secondary"
                      isDisabled={style.items.words.customAngles.length >= 8}
                      size="sm"
                      leftIcon={<AddIcon />}
                      onClick={() => {
                        style.items.words.customAngles.push(
                          Math.round(-90 + Math.random() * 180)
                        )
                        animateVisualize()
                      }}
                    >
                      Add angle
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        style.items.words.customAngles = [0]
                        animateVisualize()
                      }}
                    >
                      Reset
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        style.items.words.customAngles = style.items.words.customAngles.map(
                          () => -90 + Math.round(Math.random() * 180)
                        )
                        animateVisualize()
                      }}
                    >
                      Randomize
                    </Button>
                  </Box>

                  <Box mt="2" pl="20px">
                    {style.items.words.customAngles.map((angle, index) => (
                      <Flex direction="row" key={index}>
                        <Slider
                          css={css`
                            flex: 1;
                          `}
                          horizontal
                          value={angle}
                          onChange={(value) => {
                            const val = (value as any) as number
                            style.items.words.customAngles[index] = val
                          }}
                          onAfterChange={animateVisualize}
                          resetValue={0}
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
                                animateVisualize()
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

            <Box mb="4">
              <Slider
                horizontal
                label={
                  <>
                    Max. size
                    <HelpTooltipIcon
                      label={`Max. size the placed icons can be. You can use this slider to make all icons larger or smaller.`}
                      ml="3"
                    />
                  </>
                }
                afterLabel="%"
                value={style.items.placement.iconsMaxSize}
                onChange={(value) => {
                  const val = (value as any) as number
                  style.items.placement.iconsMaxSize = val
                }}
                onAfterChange={animateVisualize}
                resetValue={30}
                min={20}
                max={100}
                step={1}
              />
            </Box>

            <Box mb="4">
              <Slider
                horizontal
                label={
                  <>
                    Icons amount
                    <HelpTooltipIcon
                      label="How many icons compared to words will be placed. For example, 30%
                          means 30% icons, 70% words"
                      ml="3"
                    />
                  </>
                }
                afterLabel="%"
                value={style.items.placement.iconsProportion}
                onChange={(value) => {
                  const val = (value as any) as number
                  style.items.placement.iconsProportion = val
                }}
                onAfterChange={animateVisualize}
                resetValue={50}
                min={0}
                max={100}
                step={1}
              />
            </Box>

            <Checkbox
              mt="5"
              isChecked={style.items.placement.iconsRandomAngle}
              onChange={(e) => {
                style.items.placement.iconsRandomAngle = e.target.checked
              }}
            >
              Rotate icons by random angles
            </Checkbox>
          </Box>
        )}
      </Box>
    )
  }
)
