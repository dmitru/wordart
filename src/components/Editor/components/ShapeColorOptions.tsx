import {
  Box,
  Flex,
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
import { Tooltip } from 'components/shared/Tooltip'
import { DeleteButton } from 'components/shared/DeleteButton'

export const SvgShapeColorKindDropdown: React.FC<{
  onUpdate: () => void
}> = observer(({ onUpdate }) => {
  return <>TODO</>
  // const { editorPageStore: store } = useStore()
  // const shapeStyle = store.styleOptions.shape
  // const shape = store.getShape()
  // const shapeConfig = store.getSelectedShapeConf()
  // if (!shape || shape.kind !== 'svg' || shapeConfig.kind !== 'svg') {
  //   return <></>
  // }

  // const colorsCount = shape.originalColors.length
  // const colorsKind = shapeConfig.processing.colors.kind

  // return (
  //   <Menu placement="bottom-start">
  //     <MenuButton
  //       variant="outline"
  //       as={Button}
  //       rightIcon={<ChevronDownIcon />}
  //       py="2"
  //       px="3"
  //     >
  //       {(colorsKind === 'color-map' ||
  //         (colorsKind === 'original' && colorsCount > 1)) &&
  //         'Multicolor'}
  //       {(colorsKind === 'single-color' ||
  //         (colorsKind === 'original' && colorsCount === 1)) &&
  //         'Single color'}
  //     </MenuButton>
  //     <MenuList
  //       css={css`
  //         max-height: 300px;
  //         overflow: auto;
  //       `}
  //     >
  //       {shape.colorMap.length > 1 && (
  //         <MenuItem
  //           onClick={() => {
  //             shapeConfig.processing.colors = {
  //               kind: 'color-map',
  //               colors: shapeStyle.colors.colorMaps.get(shape.id)!,
  //             }
  //             onUpdate()
  //           }}
  //         >
  //           <Box display="flex" flexDirection="column" py="2">
  //             <Text my="0">Multicolor</Text>
  //             <Text my="0" fontSize="xs" color="gray.500">
  //               Customize individual colors of the shape
  //             </Text>
  //           </Box>
  //         </MenuItem>
  //       )}

  //       <MenuItem
  //         onClick={() => {
  //           shapeConfig.processing.colors = {
  //             kind: 'single-color',
  //             color: shapeStyle.colors.color,
  //           }
  //           onUpdate()
  //         }}
  //       >
  //         <Box display="flex" flexDirection="column" py="2">
  //           <Text my="0">Custom color</Text>
  //           <Text my="0" fontSize="xs" color="gray.500">
  //             Choose one color to fill the whole shape
  //           </Text>
  //         </Box>
  //       </MenuItem>
  //     </MenuList>
  //   </Menu>
  // )
})

export const SvgShapeColorOptions: React.FC<{
  onUpdate: () => void
}> = observer(({ onUpdate }) => {
  // const { editorPageStore: store } = useStore()
  // const shapeStyle = store.styleOptions.shape
  // const shape = store.getShape()
  // const shapeConfig = store.getSelectedShapeConf()
  // if (!shape || shape.kind !== 'svg' || shapeConfig.kind !== 'svg') {
  return <></>
  // }

  // const colorsCount = shape.originalColors.length

  // return (
  //   <>
  //     <Box mt="2" mb="4" display="flex" alignItems="center">
  //       {/* Show the only option - Single color */}
  //       {colorsCount === 1 && (
  //         <Flex alignItems="center">
  //           <ColorPickerPopover
  //             disableAlpha
  //             value={chroma(
  //               shapeConfig.processing.colors.kind === 'original'
  //                 ? shape.originalColors[0]
  //                 : shapeConfig.processing.colors.kind === 'single-color'
  //                 ? shapeConfig.processing.colors.color
  //                 : 'black'
  //             )
  //               .alpha(1)
  //               .hex()}
  //             onChange={(hex) => {
  //               shapeConfig.processing.colors = {
  //                 kind: 'single-color',
  //                 color: chroma(hex).hex(),
  //               }
  //               shapeStyle.colors.color = hex
  //             }}
  //             onAfterChange={() => {
  //               onUpdate()
  //             }}
  //           />
  //           {shapeConfig.processing.colors.kind === 'single-color' && (
  //             <Tooltip label="Reset default color">
  //               <DeleteButton
  //                 ml="2"
  //                 onClick={() => {
  //                   shapeConfig.processing.colors.kind = 'original'
  //                   shapeStyle.colors.color = shape.originalColors[0]
  //                   onUpdate()
  //                 }}
  //               />
  //             </Tooltip>
  //           )}
  //         </Flex>
  //       )}

  //       {colorsCount > 1 && (
  //         <>
  //           <SvgShapeColorKindDropdown onUpdate={onUpdate} />

  //           {shapeConfig.processing.colors.kind === 'single-color' && (
  //             <Box ml="3">
  //               <ColorPickerPopover
  //                 disableAlpha
  //                 value={chroma(shapeConfig.processing.colors.color)
  //                   .alpha(1)
  //                   .hex()}
  //                 onChange={(hex) => {
  //                   if (shapeConfig.processing.colors.kind === 'single-color') {
  //                     shapeConfig.processing.colors.color = chroma(hex).hex()
  //                     shapeStyle.colors.color = chroma(hex).hex()
  //                   }
  //                 }}
  //                 onAfterChange={() => {
  //                   onUpdate()
  //                 }}
  //               />
  //             </Box>
  //           )}

  //           {shapeConfig.processing.colors.kind === 'color-map' && (
  //             <Box ml="3">
  //               {shapeConfig.processing.colors.colors.map((color, index) => (
  //                 <Box mr="1" key={index} display="inline-block">
  //                   {shapeConfig.processing.colors.kind === 'color-map' && (
  //                     <ColorPickerPopover
  //                       disableAlpha
  //                       value={chroma(
  //                         shapeConfig.processing.colors.colors[index]
  //                       )
  //                         .alpha(1)
  //                         .hex()}
  //                       onChange={(hex) => {
  //                         if (
  //                           shapeConfig.processing.colors.kind === 'color-map'
  //                         ) {
  //                           shapeConfig.processing.colors.colors[
  //                             index
  //                           ] = chroma(hex).hex()
  //                         }
  //                       }}
  //                       onAfterChange={() => {
  //                         onUpdate()
  //                       }}
  //                     />
  //                   )}
  //                 </Box>
  //               ))}

  //               <Tooltip label="Reset default color">
  //                 <DeleteButton
  //                   ml="2"
  //                   onClick={() => {
  //                     if (shapeConfig.processing.colors.kind === 'color-map') {
  //                       shapeConfig.processing.colors.colors = [
  //                         ...shape.originalColors,
  //                       ]
  //                     }
  //                     onUpdate()
  //                   }}
  //                 />
  //               </Tooltip>
  //             </Box>
  //           )}
  //         </>
  //       )}
  //     </Box>
  //   </>
  // )
})

export const ShapeColorOptions: React.FC<{
  onUpdate: () => void
}> = observer(({ onUpdate }) => {
  const { editorPageStore: store } = useStore()
  const shape = store.getShape()
  if (!shape) {
    return <></>
  }
  // if (shape.kind === 'svg') {
  //   return <SvgShapeColorOptions onUpdate={onUpdate} />
  // }

  return <></>
})
