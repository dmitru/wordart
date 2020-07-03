import {
  Box,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { Button } from 'components/shared/Button'
import { ChevronDownIcon } from '@chakra-ui/icons'

export const SvgShapeColorKindDropdown: React.FC<{
  onUpdate: () => void
}> = observer(({ onUpdate }) => {
  const { editorPageStore: store } = useStore()
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()
  if (!shape || shape.kind !== 'svg') {
    return <></>
  }
  return (
    <Menu placement="bottom-start">
      <MenuButton
        variant="outline"
        as={Button}
        rightIcon={<ChevronDownIcon />}
        py="2"
        px="3"
      >
        {shape.config.processing.colors.kind === 'original' && 'Original Color'}
        {shape.config.processing.colors.kind === 'color-map' && 'Multicolor'}
        {shape.config.processing.colors.kind === 'single-color' &&
          'Custom color'}
      </MenuButton>
      <MenuList
        css={css`
          max-height: 300px;
          overflow: auto;
        `}
      >
        <MenuItem
          onClick={() => {
            shape.config.processing.colors = {
              kind: 'original',
            }
            onUpdate()
          }}
        >
          Original color
        </MenuItem>

        <MenuItem
          onClick={() => {
            shape.config.processing.colors = {
              kind: 'single-color',
              color: shapeStyle.colors.color,
            }
            onUpdate()
          }}
        >
          <Box display="flex" flexDirection="column" py="2">
            <Text my="0">Custom color</Text>
            <Text my="0" fontSize="xs" color="gray.500">
              Choose one color to fill the whole shape
            </Text>
          </Box>
        </MenuItem>

        {shape.colorMap.length > 1 && (
          <MenuItem
            onClick={() => {
              shape.config.processing.colors = {
                kind: 'color-map',
                colors: shapeStyle.colors.colorMaps.get(shape.id)!,
              }
              onUpdate()
            }}
          >
            <Box display="flex" flexDirection="column" py="2">
              <Text my="0">Multicolor</Text>
              <Text my="0" fontSize="xs" color="gray.500">
                Customize individual colors of the shape
              </Text>
            </Box>
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  )
})

export const SvgShapeColorOptions: React.FC<{
  onUpdate: () => void
}> = observer(({ onUpdate }) => {
  const { editorPageStore: store } = useStore()
  const shapeStyle = store.styleOptions.shape
  const shape = store.getShape()
  if (!shape || shape.kind !== 'svg') {
    return <></>
  }

  return (
    <>
      <Box mt="2" mb="4" display="flex" alignItems="center">
        <SvgShapeColorKindDropdown onUpdate={onUpdate} />

        {shape.config.processing.colors.kind === 'single-color' && (
          <Box ml="3">
            <ColorPickerPopover
              disableAlpha
              value={chroma(shape.config.processing.colors.color)
                .alpha(1)
                .hex()}
              onChange={(hex) => {
                if (shape.config.processing.colors.kind === 'single-color') {
                  shape.config.processing.colors.color = chroma(hex).hex()
                  shapeStyle.colors.color = chroma(hex).hex()
                }
              }}
              onAfterChange={() => {
                onUpdate()
              }}
            />
          </Box>
        )}
      </Box>

      {shape.config.processing.colors.kind === 'color-map' && (
        <Box>
          {shape.config.processing.colors.colors.map((color, index) => (
            <Box mr="1" key={index} display="inline-block">
              {shape.config.processing.colors.kind === 'color-map' && (
                <ColorPickerPopover
                  disableAlpha
                  value={chroma(shape.config.processing.colors.colors[index])
                    .alpha(1)
                    .hex()}
                  onChange={(hex) => {
                    if (shape.config.processing.colors.kind === 'color-map') {
                      shape.config.processing.colors.colors[index] = chroma(
                        hex
                      ).hex()
                    }
                  }}
                  onAfterChange={() => {
                    onUpdate()
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </>
  )
})

export const ShapeColorOptions: React.FC<{
  onUpdate: () => void
}> = observer(({ onUpdate }) => {
  const { editorPageStore: store } = useStore()
  const shape = store.getShape()
  if (!shape) {
    return <></>
  }
  if (shape.kind === 'svg') {
    return <SvgShapeColorOptions onUpdate={onUpdate} />
  }

  return <></>
})
