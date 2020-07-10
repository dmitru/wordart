import { observer } from 'mobx-react'
import { useStore } from 'services/root-store'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { SectionLabel } from './shared'
import {
  ShapeThumbnails,
  ShapeThumbnailBtn,
  ShapeSelector,
} from 'components/Editor/components/ShapeSelector'
import { LeftPanelTargetLayerDropdown } from 'components/Editor/components/TargetLayerDropdown'
import { observable } from 'mobx'
import { uniqBy } from 'lodash'
import { TargetKind } from 'components/Editor/lib/editor'
import { Box, Text, Checkbox } from '@chakra-ui/core'
import { Slider } from 'components/shared/Slider'
import { Button } from 'components/shared/Button'
import { Tooltip } from 'components/shared/Tooltip'
import { SmileBeam } from '@styled-icons/fa-solid/SmileBeam'
import { FaQuestionCircle } from 'react-icons/fa'
import { ChevronLeftIcon } from '@chakra-ui/icons'
import { IconPicker } from 'components/Editor/components/IconPicker'

export type LeftPanelIconsTabProps = {
  target: TargetKind
}

const IconsList = styled(Box)``

const state = observable({
  isAdding: false,
})

export const LeftPanelIconsTab: React.FC<LeftPanelIconsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styleOptions[target]
    const icons = style.items.icons.iconList

    const shapes = store.availableIconShapes

    return (
      <Box
        px="5"
        py="6"
        display="flex"
        flexDirection="column"
        height="100%"
        overflowY="auto"
      >
        {state.isAdding && (
          <>
            <SectionLabel>Choose an icon</SectionLabel>

            <Box>
              <Button
                leftIcon={<ChevronLeftIcon />}
                variant="outline"
                onClick={() => {
                  state.isAdding = false
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
                onSelected={async (shapeConfig) => {
                  style.items.icons.iconList = uniqBy(
                    [
                      ...style.items.icons.iconList,
                      { shapeId: shapeConfig.id },
                    ],
                    'shapeId'
                  )
                  state.isAdding = false
                  store.animateVisualize(false)
                }}
              />
            </Box>
          </>
        )}

        {!state.isAdding && <LeftPanelTargetLayerDropdown />}

        {!state.isAdding && icons.length > 0 && (
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

        {!state.isAdding && icons.length === 0 && <EmptyStateShapesUi />}

        {!state.isAdding && icons.length > 0 && (
          <>
            <IconsList mt="2">
              <ShapeThumbnails mt="2">
                {icons.map((icon) => (
                  <ShapeThumbnailBtn
                    key={icon.shapeId}
                    onClick={() => {
                      style.items.icons.iconList = style.items.icons.iconList.filter(
                        (i) => i.shapeId !== icon.shapeId
                      )
                      store.animateVisualize(false)
                    }}
                    backgroundColor="white"
                    url={store.getIconShapeConfById(icon.shapeId)!.thumbnailUrl}
                  />
                ))}
              </ShapeThumbnails>
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
