import {
  Box,
  Checkbox,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/core'
import { ChevronLeftIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { SmileBeam } from '@styled-icons/fa-solid/SmileBeam'
import { IconPicker } from 'components/Editor/components/IconPicker'
import { ShapeThumbnailBtn } from 'components/Editor/components/ShapeSelector'
import { LeftPanelTargetLayerDropdown } from 'components/Editor/components/TargetLayerDropdown'
import { TargetKind } from 'components/Editor/lib/editor'
import {
  mkBgStyleConfFromOptions,
  mkShapeStyleConfFromOptions,
} from 'components/Editor/style'
import { Button } from 'components/shared/Button'
import { DeleteButton } from 'components/shared/DeleteButton'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { Slider } from 'components/shared/Slider'
import { Tooltip } from 'components/shared/Tooltip'
import { uniqBy } from 'lodash'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useCallback } from 'react'
import { FaCog } from 'react-icons/fa'
import { useStore } from 'services/root-store'
import { CustomizeIconPopover } from './CustomizeIcon'
import { SectionLabel } from './shared'
import { useEditorStore } from 'components/Editor/editor-store'

export type LeftPanelIconsTabProps = {
  target: TargetKind
}

const IconsList = styled(Box)``

const state = observable({
  isAdding: false,
  isReplacingIconIndex: null as number | null,
})

export const LeftPanelIconsTab: React.FC<LeftPanelIconsTabProps> = observer(
  ({ target }) => {
    const store = useEditorStore()!
    const style = store.styleOptions[target]
    const shapeStyle = store.styleOptions.shape
    const bgStyle = store.styleOptions.bg
    const icons = style.items.icons.iconList

    const isShowingSelector =
      state.isAdding || state.isReplacingIconIndex != null

    let customizeTrigger = (
      <IconCustomizeButton
        size="sm"
        variant="solid"
        onClick={(e: any) => {
          e.stopPropagation()
        }}
        css={css`
          svg {
            width: 16px;
            height: 16px;
          }
        `}
      >
        <FaCog />
      </IconCustomizeButton>
    )

    const handleIconColorChange = useCallback(() => {
      if (target === 'shape') {
        store.editor?.setShapeItemsStyle(
          mkShapeStyleConfFromOptions(shapeStyle).items
        )
      } else {
        store.editor?.setBgItemsStyle(mkBgStyleConfFromOptions(bgStyle).items)
      }
    }, [])

    return (
      <Box
        px="5"
        py="6"
        display="flex"
        flexDirection="column"
        height="100%"
        overflowY="auto"
      >
        {!isShowingSelector && <LeftPanelTargetLayerDropdown />}

        {isShowingSelector && (
          <>
            <SectionLabel>Choose an icon</SectionLabel>

            <Box>
              <Button
                leftIcon={<ChevronLeftIcon />}
                variant="outline"
                onClick={() => {
                  state.isAdding = false
                  state.isReplacingIconIndex = null
                }}
              >
                Cancel
              </Button>
            </Box>

            <Box
              mt="3"
              display="flex"
              flex="1"
              height="calc(100vh - 300px)"
              flexDirection="column"
            >
              <IconPicker
                selectedIconId={
                  state.isReplacingIconIndex != null
                    ? style.items.icons.iconList[state.isReplacingIconIndex]
                        ?.shapeId
                    : undefined
                }
                onSelected={async (shapeConfig) => {
                  if (state.isAdding) {
                    style.items.icons.iconList = uniqBy(
                      [
                        ...style.items.icons.iconList,
                        { shapeId: shapeConfig.id },
                      ],
                      'shapeId'
                    )
                  } else if (state.isReplacingIconIndex != null) {
                    style.items.icons.iconList[
                      state.isReplacingIconIndex
                    ].shapeId = shapeConfig.id
                  }
                  state.isAdding = false
                  state.isReplacingIconIndex = null
                  store.animateVisualize(false)
                }}
              />
            </Box>
          </>
        )}

        {!isShowingSelector && icons.length > 0 && (
          <Box display="flex" alignItems="center">
            <Button
              mr="3"
              colorScheme="primary"
              onClick={() => {
                state.isAdding = true
              }}
            >
              <evaicons.PlusOutline size="20" /> Add Icon
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                style.items.icons.iconList = []
                store.animateVisualize(false)
              }}
            >
              Clear
            </Button>
          </Box>
        )}

        {!isShowingSelector && icons.length === 0 && <EmptyStateShapesUi />}

        {!isShowingSelector && icons.length > 0 && (
          <>
            <IconsList mt="6" flexWrap="wrap" display="flex">
              {icons.map((icon, index) => {
                const iconCustomizeControl = (
                  <CustomizeIconPopover
                    trigger={customizeTrigger}
                    icon={icon}
                    onAfterColorChange={handleIconColorChange}
                  />
                )

                return (
                  <Popover
                    trigger="hover"
                    placement="bottom"
                    key={icon.shapeId}
                  >
                    <PopoverTrigger>
                      <IconThumbnailContainer
                        css={css`
                          width: 106px;
                          height: 106px;
                          /* position: relative; */
                        `}
                      >
                        <ShapeThumbnailBtn
                          onClick={() => {
                            state.isReplacingIconIndex = index
                          }}
                          backgroundColor="white"
                          css={css`
                            svg {
                              fill: red;
                              stroke: red;
                            }
                          `}
                          url={
                            store.getIconShapeConfById(icon.shapeId)!
                              .thumbnailUrl
                          }
                        />
                      </IconThumbnailContainer>
                    </PopoverTrigger>
                    <Portal>
                      <PopoverContent width="120px">
                        <PopoverArrow />
                        <Stack direction="row" spacing="3" p="4">
                          <Tooltip label="Delete">
                            <IconDeleteButton
                              variant="solid"
                              size="sm"
                              css={css`
                                /* position: absolute;
                                top: 4px;
                                right: 4px; */
                                font-size: 20px;

                                svg {
                                  width: 16px;
                                  height: 16px;
                                }
                              `}
                              onClick={(e: any) => {
                                style.items.icons.iconList = style.items.icons.iconList.filter(
                                  (i) => i.shapeId !== icon.shapeId
                                )
                                store.animateVisualize(false)
                              }}
                            />
                          </Tooltip>
                          {iconCustomizeControl}
                        </Stack>
                      </PopoverContent>
                    </Portal>
                  </Popover>
                )
              })}
            </IconsList>

            {style.items.icons.iconList.length > 0 && (
              <Box mt="3.5rem">
                <SectionLabel>Icons Settings</SectionLabel>

                <Box mb="2rem">
                  <Slider
                    label="Size"
                    afterLabel="%"
                    value={style.items.placement.iconsMaxSize}
                    onChange={(value) => {
                      const val = (value as any) as number
                      style.items.placement.iconsMaxSize = val
                    }}
                    onAfterChange={() => {
                      store.animateVisualize(false)
                    }}
                    resetValue={30}
                    min={20}
                    max={100}
                    step={1}
                  />
                </Box>

                <Slider
                  label={
                    <>
                      Amount
                      <HelpTooltipIcon
                        label="How many icons compared to words will be placed. For example, 30%
                          means 30% icons, 70% words"
                      />
                    </>
                  }
                  afterLabel="%"
                  value={style.items.placement.iconsProportion}
                  onChange={(value) => {
                    const val = (value as any) as number
                    style.items.placement.iconsProportion = val
                  }}
                  onAfterChange={() => {
                    store.animateVisualize(false)
                  }}
                  resetValue={30}
                  min={0}
                  max={100}
                  step={1}
                />

                <Checkbox
                  mt="5"
                  isChecked={style.items.placement.iconsRandomAngle}
                  onChange={(e) => {
                    style.items.placement.iconsRandomAngle = e.target.checked
                    store.animateVisualize(false)
                  }}
                >
                  Rotate icons by random angles
                </Checkbox>
              </Box>
            )}
          </>
        )}
      </Box>
    )
  }
)

const IconDeleteButton = styled(DeleteButton)``
const IconCustomizeButton = styled(Button)``

const IconThumbnailContainer = styled(Box)`
  ${IconDeleteButton}, ${IconCustomizeButton} {
    opacity: 0;
  }

  &:hover {
    ${IconDeleteButton}, ${IconCustomizeButton} {
      opacity: 1;
    }
  }
`

const EmptyStateShapesUi = () => (
  <Box
    mt="2rem"
    display="flex"
    alignItems="center"
    flexDirection="column"
    boxShadow="sm"
    borderColor="gray.100"
    borderWidth="1px"
    p="6"
  >
    <Box
      mb="1rem"
      bg="primary.50"
      color="primary.400"
      width="90px"
      height="90px"
      borderRadius="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <SmileBeam size={60} />
    </Box>

    <Text fontSize="xl" flex={1} textAlign="center" color="gray.600" mb="0">
      When words aren't enough
    </Text>

    <Text mt="4" fontSize="md" flex={1} textAlign="center" color="gray.500">
      Combine icons and words in your designs, or go with just icons!
    </Text>

    <Button
      mr="3"
      mt="6"
      // flex="1"
      size="lg"
      colorScheme="primary"
      onClick={() => {
        state.isAdding = true
      }}
    >
      <evaicons.PlusOutline size="20" /> Add Icons
    </Button>
  </Box>
)
