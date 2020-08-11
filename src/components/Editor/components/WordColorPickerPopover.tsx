import {
  ButtonProps,
  Portal,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  PopoverProps,
  Box,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { useRef } from 'react'
import { SketchPicker } from 'react-color'
import { observer } from 'mobx-react'
import { useEditorStore } from '../editor-store'
import { ChoiceButtons } from './ChoiceButtons'
import { ColorPicker } from 'components/shared/ColorPicker'

export const WordColorPickerPopover = observer(() => {
  const store = useEditorStore()
  const initialFocusRef = useRef(null)

  if (!store || !store.selectedItemData) {
    return null
  }

  const color =
    store?.selectedItemData.customColor ||
    store?.selectedItemData.color ||
    'black'

  return (
    <>
      <Popover
        initialFocusRef={initialFocusRef}
        placement="bottom"
        closeOnBlur
        closeOnEsc
      >
        <PopoverTrigger>
          <ColorSwatchButton kind="color" color={color} />
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            outline="none"
            zIndex={4000}
            css={css`
              width: 250px;
            `}
          >
            <PopoverArrow />
            <PopoverBody p={2}>
              <Box mb="4" mt="3">
                <ChoiceButtons
                  value={
                    store.selectedItemData.customColor ? 'custom' : 'default'
                  }
                  choices={[
                    { title: 'Default color', value: 'default' },
                    { title: 'Custom', value: 'custom' },
                  ]}
                  onChange={(value) => {
                    if (value === 'default') {
                      store?.resetItemCustomColor()
                    } else {
                      store?.setItemCustomColor(
                        store?.selectedItemData?.color || 'black'
                      )
                    }
                  }}
                />
              </Box>

              {store.selectedItemData.customColor && (
                <ColorPicker
                  value={color}
                  onAfterChange={(color) => {
                    store?.setItemCustomColor(color)
                  }}
                />
              )}
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    </>
  )
})
