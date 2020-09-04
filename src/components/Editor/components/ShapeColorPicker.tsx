import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  IconButton,
  MenuList,
  Text,
  MenuTransition,
  Portal,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import {
  ColorPickerPopover,
  ColorPickerPopoverProps,
} from 'components/shared/ColorPickerPopover'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { Button } from 'components/shared/Button'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { Tooltip } from 'components/shared/Tooltip'
import { DeleteButton } from 'components/shared/DeleteButton'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import {
  ShapeTextConf,
  ShapeRandomBlobConf,
  ShapeFullCanvasConf,
  ShapeIconConf,
  ShapeCustomImageConf,
} from 'components/Editor/shape-config'
import { noop, isEqual } from 'lodash'
import { FiRefreshCw } from 'react-icons/fi'
import { ShapeClipartSvg, ShapeCustomImageSvg } from 'components/Editor/shape'
import { useEditorStore } from 'components/Editor/editor-store'

export const ShapeColorPicker: React.FC<{
  onUpdate: () => void
}> = observer(({ onUpdate }) => {
  const store = useEditorStore()!
  const shape = store.getShape()
  if (!shape) {
    return <></>
  }

  if (shape.kind === 'clipart:svg' || shape.kind === 'custom:svg') {
    return <SvgShapeColorPicker onAfterChange={onUpdate} shape={shape} />
  }

  if (shape.kind === 'custom:raster') {
    return (
      <CustomRasterShapeColorPicker
        onAfterChange={onUpdate}
        shapeConf={shape.config}
      />
    )
  }

  if (shape.kind === 'text') {
    return (
      <TextShapeColorPicker onAfterChange={onUpdate} shapeConf={shape.config} />
    )
  } else if (shape.kind === 'blob') {
    return (
      <BlobShapeColorPicker onAfterChange={onUpdate} shapeConf={shape.config} />
    )
  } else if (shape.kind === 'full-canvas') {
    return (
      <FullCanvasShapeColorPicker
        onAfterChange={onUpdate}
        shapeConf={shape.config}
      />
    )
  } else if (shape.kind === 'icon') {
    return (
      <IconShapeColorPicker onAfterChange={onUpdate} shapeConf={shape.config} />
    )
  }

  return <></>
})

export const SvgShapeColorPicker: React.FC<{
  shape: ShapeClipartSvg | ShapeCustomImageSvg
  onAfterChange?: () => void
  onChange?: () => void
}> = observer(({ shape, onAfterChange = noop, onChange = noop }) => {
  const store = useEditorStore()!
  const shapeConfig = shape.config
  const colorsCount = shape.originalColors.length
  const colorsKind = shapeConfig.processing.colors.kind

  let selectedOption = colorsKind
  if (colorsKind === 'original') {
    selectedOption = colorsCount > 1 ? 'color-map' : 'single-color'
  }

  const singleColor =
    shapeConfig.processing.colors.kind === 'single-color'
      ? store.shapesPanel.image.singleColor
      : shape.originalColors[0]
  const multiColors =
    shapeConfig.processing.colors.kind === 'color-map'
      ? shapeConfig.processing.colors.colors
      : shape.originalColors

  const areMultiColorsDifferent = !isEqual(multiColors, shape.originalColors)

  const resetDefaultColorsBtn = (
    <Tooltip label="Reset default colors">
      <IconButton
        ml="2"
        aria-label="Reset default"
        icon={<FiRefreshCw />}
        variant="ghost"
        size="sm"
        color="gray.500"
        onClick={() => {
          shapeConfig.processing.colors = {
            kind: 'original',
          }
          shape.customColors = [...shape.originalColors]
          onAfterChange()
        }}
      />
    </Tooltip>
  )

  return (
    <>
      <Box mt="2" mb="4" display="flex" alignItems="center">
        {/* Show the only option - Single color */}
        {colorsCount === 1 && (
          <Flex alignItems="center">
            <Text my="0" mr="3" fontWeight="medium" color="gray.500">
              Shape color
            </Text>
            <ColorPickerPopover
              disableAlpha
              value={chroma(singleColor).alpha(1).hex()}
              onChange={(color) => {
                store.shapesPanel.image.singleColor = color
                shapeConfig.processing.colors = {
                  kind: 'single-color',
                  color,
                }
                onChange()
              }}
              onAfterChange={onAfterChange}
            />
            {shapeConfig.processing.colors.kind === 'single-color' && (
              <Tooltip label="Reset default color">
                <IconButton
                  aria-label="Reset default"
                  icon={<FiRefreshCw />}
                  variant="ghost"
                  size="sm"
                  color="gray.500"
                  ml="2"
                  onClick={() => {
                    shapeConfig.processing.colors.kind = 'original'
                    onAfterChange()
                  }}
                />
              </Tooltip>
            )}
          </Flex>
        )}

        {colorsCount > 1 && (
          <>
            {selectedOption === 'single-color' && (
              <Box display="flex" alignItems="flex-start" flexWrap="wrap">
                <SvgShapeColorKindDropdown
                  shape={shape}
                  onAfterChange={onAfterChange}
                />
                <Box ml="3">
                  <ColorPickerPopover
                    disableAlpha
                    value={chroma(singleColor).alpha(1).hex()}
                    onChange={(color) => {
                      store.shapesPanel.image.singleColor = color
                      shapeConfig.processing.colors = {
                        kind: 'single-color',
                        color,
                      }
                      onChange()
                    }}
                    onAfterChange={onAfterChange}
                  />
                </Box>

                {resetDefaultColorsBtn}
              </Box>
            )}

            {selectedOption === 'color-map' && (
              <Box>
                <SvgShapeColorKindDropdown
                  shape={shape}
                  onAfterChange={onAfterChange}
                />

                <Box mt="3">
                  {multiColors.map((color, index) => (
                    <Box mr="1" mb="2" key={index} display="inline-block">
                      <ColorPickerPopover
                        disableAlpha
                        value={chroma(multiColors[index]).alpha(1).hex()}
                        onChange={(hex) => {
                          const newColors = [...multiColors]
                          newColors[index] = hex

                          shapeConfig.processing.colors = {
                            kind: 'color-map',
                            colors: newColors,
                          }
                          onChange()
                        }}
                        onAfterChange={onAfterChange}
                      />
                    </Box>
                  ))}

                  {areMultiColorsDifferent && resetDefaultColorsBtn}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  )
})

export const SvgShapeColorKindDropdown: React.FC<{
  shape: ShapeClipartSvg | ShapeCustomImageSvg
  onAfterChange: () => void
}> = observer(({ shape, onAfterChange: onUpdate }) => {
  const store = useEditorStore()!
  const shapeConfig = shape.config
  const colorsCount = shape.originalColors.length
  const colorsKind = shapeConfig.processing.colors.kind

  let selectedOption = colorsKind
  if (colorsKind === 'original') {
    selectedOption = colorsCount > 1 ? 'color-map' : 'single-color'
  }

  return (
    <Menu isLazy>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />} py="2" px="3">
        {selectedOption === 'color-map' && 'Shape color: Multicolor'}
        {selectedOption === 'single-color' && 'Shape color: Single'}
      </MenuButton>
      <MenuTransition>
        {(styles) => (
          <Portal>
            <MenuList
              // @ts-ignore
              css={css`
                ${styles}
                max-height: 300px;
                overflow: auto;
              `}
            >
              {shape.colorMap.length > 1 && (
                <MenuItemWithDescription
                  title="Multicolor"
                  description="Customize individual colors of the shape"
                  onClick={() => {
                    shapeConfig.processing.colors = {
                      kind: 'color-map',
                      colors: shape.customColors,
                    }
                    onUpdate()
                  }}
                />
              )}

              <MenuItemWithDescription
                title="Single color"
                onClick={() => {
                  shapeConfig.processing.colors = {
                    kind: 'single-color',
                    color: store.shapesPanel.image.singleColor,
                  }
                  onUpdate()
                }}
                description="Choose one color to fill the entire shape"
              />
            </MenuList>
          </Portal>
        )}
      </MenuTransition>
    </Menu>
  )
})

export const TextShapeColorPicker: React.FC<{
  onAfterChange?: () => void
  onChange?: () => void
  shapeConf: ShapeTextConf
  placement?: ColorPickerPopoverProps['placement']
}> = observer(
  ({ placement, shapeConf, onAfterChange = noop, onChange = noop }) => {
    const store = useEditorStore()!

    return (
      <Box display="flex" alignItems="center">
        <Text my="0" mr="3" fontWeight="medium" color="gray.500">
          Color
        </Text>
        <ColorPickerPopover
          value={store.shapesPanel.text.color}
          onChange={(color) => {
            shapeConf.textStyle.color = color
            store.updateColorForAllShapeTypes(color)
            onChange()
          }}
          onAfterChange={onAfterChange}
          placement={placement}
        />
      </Box>
    )
  }
)

export const BlobShapeColorPicker: React.FC<{
  onAfterChange?: () => void
  onChange?: () => void
  shapeConf: ShapeRandomBlobConf
}> = observer(({ shapeConf, onAfterChange = noop, onChange = noop }) => {
  const store = useEditorStore()!

  return (
    <Box display="flex" alignItems="center">
      <Text my="0" mr="3" fontWeight="medium" color="gray.500">
        Color
      </Text>
      <ColorPickerPopover
        value={store.shapesPanel.blob.color}
        onChange={(color) => {
          shapeConf.color = color
          store.updateColorForAllShapeTypes(color)
          onChange()
        }}
        onAfterChange={onAfterChange}
      />
    </Box>
  )
})

export const FullCanvasShapeColorPicker: React.FC<{
  onAfterChange?: () => void
  onChange?: () => void
  shapeConf: ShapeFullCanvasConf
}> = observer(({ shapeConf, onAfterChange = noop, onChange = noop }) => {
  const store = useEditorStore()!

  return (
    <Box display="flex" alignItems="center">
      <Text my="0" mr="3" fontWeight="medium" color="gray.500">
        Color
      </Text>
      <ColorPickerPopover
        value={store.shapesPanel.fullCanvas.color}
        onChange={(color) => {
          shapeConf.color = color
          store.updateColorForAllShapeTypes(color)
          onChange()
        }}
        onAfterChange={onAfterChange}
      />
    </Box>
  )
})

export const IconShapeColorPicker: React.FC<{
  onAfterChange?: () => void
  onChange?: () => void
  shapeConf: ShapeIconConf
}> = observer(({ shapeConf, onAfterChange = noop, onChange = noop }) => {
  const store = useEditorStore()!

  return (
    <Box display="flex" alignItems="center">
      <Text my="0" mr="3" fontWeight="medium" color="gray.500">
        Color
      </Text>
      <ColorPickerPopover
        value={store.shapesPanel.icon.color}
        onChange={(color) => {
          store.shapesPanel.icon.color = color
          shapeConf.color = color
          store.updateColorForAllShapeTypes(color)
          onChange()
        }}
        onAfterChange={onAfterChange}
      />
    </Box>
  )
})

export const CustomRasterShapeColorPicker: React.FC<{
  onAfterChange?: () => void
  onChange?: () => void
  shapeConf: ShapeCustomImageConf
}> = observer(({ shapeConf, onAfterChange = noop, onChange = noop }) => {
  const store = useEditorStore()!

  if (shapeConf.kind !== 'custom:raster') {
    return null
  }

  if (!shapeConf.processing.fill && !shapeConf.processing.invert) {
    return null
  }

  return (
    <Box display="flex" alignItems="center">
      <Text my="0" mr="3" fontWeight="medium" color="gray.500">
        Color
      </Text>
      <ColorPickerPopover
        value={store.shapesPanel.customImage.fillColor}
        onChange={(color) => {
          store.shapesPanel.customImage.fillColor = color
          if (shapeConf.processing.fill) {
            shapeConf.processing.fill = { color }
          } else if (shapeConf.processing.invert) {
            shapeConf.processing.invert = { color }
          }
          store.updateColorForAllShapeTypes(color)
          onChange()
        }}
        onAfterChange={onAfterChange}
      />
    </Box>
  )
})
