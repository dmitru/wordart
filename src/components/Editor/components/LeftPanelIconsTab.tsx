import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { SectionLabel } from './shared'
import { ShapeThumbnailBtn } from 'components/Editor/components/ShapeSelector'
import { LeftPanelTargetLayerDropdown } from 'components/Editor/components/TargetLayerDropdown'
import { observable } from 'mobx'
import { uniqBy } from 'lodash'
import { TargetKind } from 'components/Editor/lib/editor'
import {
  Box,
  Text,
  Checkbox,
  Popover,
  PopoverTrigger,
  Portal,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Flex,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  FormLabel,
} from '@chakra-ui/core'
import { Slider } from 'components/shared/Slider'
import { Button } from 'components/shared/Button'
import { Tooltip } from 'components/shared/Tooltip'
import { SmileBeam } from '@styled-icons/fa-solid/SmileBeam'
import { FaQuestionCircle, FaCog } from 'react-icons/fa'
import { ChevronLeftIcon } from '@chakra-ui/icons'
import { IconPicker } from 'components/Editor/components/IconPicker'
import { DeleteButton } from 'components/shared/DeleteButton'
import css from '@emotion/css'
import { ChoiceButtons } from 'components/Editor/components/ChoiceButtons'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { useCallback } from 'react'
import {
  mkShapeStyleConfFromOptions,
  mkBgStyleConfFromOptions,
} from 'components/Editor/style'

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
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const shapeStyle = store.styleOptions.shape
    const bgStyle = store.styleOptions.bg
    const icons = style.items.icons.iconList

    const shapes = store.availableIconShapes

    const isShowingSelector =
      state.isAdding || state.isReplacingIconIndex != null

    let customizeTrigger = (
      // <Tooltip label="Customize">
      <IconCustomizeButton
        size="sm"
        variant="solid"
        onClick={(e) => {
          e.stopPropagation()
        }}
        css={css`
          position: absolute;
          right: 4px;
          bottom: 4px;
          svg {
            width: 16px;
            height: 16px;
          }
        `}
      >
        <FaCog />
      </IconCustomizeButton>
      // </Tooltip>
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
                let repeatValue = 'repeat'
                if (icon.repeats === 1) {
                  repeatValue = 'once'
                } else if ((icon.repeats ?? -1) > 1) {
                  repeatValue = 'custom'
                }

                const iconCustomizeControl = (
                  <Popover
                    closeOnBlur
                    closeOnEsc
                    placement="right"
                    autoFocus={false}
                  >
                    <PopoverTrigger>{customizeTrigger}</PopoverTrigger>
                    <Portal>
                      <PopoverContent zIndex={4000} width="280px">
                        <PopoverArrow />
                        <PopoverBody p={5}>
                          {/* REPEAT WORD */}
                          <Flex direction="column">
                            <ChoiceButtons
                              size="sm"
                              mt="3"
                              choices={[
                                { title: 'Repeat icon', value: 'repeat' },
                                { title: 'Once', value: 'once' },
                                { title: 'Custom', value: 'custom' },
                              ]}
                              value={repeatValue}
                              onChange={(value) => {
                                if (value === 'repeat') {
                                  icon.repeats = -1
                                } else if (value === 'once') {
                                  icon.repeats = 1
                                } else if (value === 'custom') {
                                  icon.repeats = 2
                                }
                              }}
                            />

                            {repeatValue === 'custom' && (
                              <Box mt="3" mb="4">
                                <NumberInput
                                  size="sm"
                                  maxWidth="70px"
                                  value={icon.repeats}
                                  min={2}
                                  max={50}
                                  step={1}
                                  onChange={(v) => {
                                    if (v > 0) {
                                      icon.repeats = v
                                    }
                                  }}
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </Box>
                            )}
                          </Flex>

                          {/* CUSTOM COLOR */}
                          <Flex align="center" mt="4">
                            <Switch
                              id={`${icon.id}-custom-color`}
                              isChecked={icon.color != null ? true : false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  icon.color = 'black'
                                } else {
                                  icon.color = undefined
                                }
                                handleIconColorChange()
                              }}
                            />

                            <FormLabel
                              htmlFor={`${icon.id}-custom-color`}
                              my="0"
                              ml="2"
                            >
                              Custom color
                            </FormLabel>

                            <Box
                              ml="3"
                              css={
                                !icon.color &&
                                css`
                                  visibility: hidden;
                                `
                              }
                            >
                              <ColorPickerPopover
                                placement="left"
                                usePortal={false}
                                css={css`
                                  height: 30px;
                                `}
                                value={icon.color || 'black'}
                                onChange={(color) => {
                                  icon.color = color
                                }}
                                onAfterChange={handleIconColorChange}
                              />
                            </Box>
                          </Flex>
                        </PopoverBody>
                      </PopoverContent>
                    </Portal>
                  </Popover>
                )

                return (
                  <IconThumbnailContainer
                    key={icon.shapeId}
                    css={css`
                      width: 106px;
                      position: relative;
                    `}
                  >
                    <ShapeThumbnailBtn
                      onClick={() => {
                        state.isReplacingIconIndex = index
                      }}
                      backgroundColor="white"
                      url={
                        store.getIconShapeConfById(icon.shapeId)!.thumbnailUrl
                      }
                    />

                    <Tooltip label="Delete">
                      <IconDeleteButton
                        variant="solid"
                        size="sm"
                        css={css`
                          position: absolute;
                          top: 4px;
                          right: 4px;
                          font-size: 20px;

                          svg {
                            width: 16px;
                            height: 16px;
                          }
                        `}
                        onClick={(e) => {
                          style.items.icons.iconList = style.items.icons.iconList.filter(
                            (i) => i.shapeId !== icon.shapeId
                          )
                          store.animateVisualize(false)
                        }}
                      />
                    </Tooltip>
                    {iconCustomizeControl}
                  </IconThumbnailContainer>
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
                    min={20}
                    max={100}
                    step={1}
                  />
                </Box>

                <Slider
                  label={
                    <>
                      <Box display="flex" alignItems="center">
                        Amount{' '}
                        <Tooltip
                          label="How many icons compared to words will be placed. E.g. 30%
                          means 30% icons, 70% words"
                          zIndex={100}
                          showDelay={200}
                        >
                          <Text
                            my="0"
                            cursor="help"
                            ml="2"
                            fontSize="lg"
                            color="gray.400"
                          >
                            <FaQuestionCircle />
                          </Text>
                        </Tooltip>
                      </Box>
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
                  min={0}
                  max={100}
                  step={1}
                />

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
