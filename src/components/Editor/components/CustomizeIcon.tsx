import {
  Box,
  Flex,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Switch,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { ChoiceButtons } from 'components/Editor/components/ChoiceButtons'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { IconListEntry } from '../style-options'
import { useEditorStore } from 'components/Editor/editor-store'

export type CustomizeIconOptions = {
  // Repeat
  repeat: 'repeat' | 'once' | 'custom'
  customRepeat: number
  // Custom color
  customColor: boolean
  color: string
}

const defaultFontId = 'Pacifico:regular'

const getValueFromWordEntry = (icon: IconListEntry): CustomizeIconOptions => {
  return {
    repeat:
      (icon.repeats ?? -1) === -1
        ? 'repeat'
        : icon.repeats === 1
        ? 'once'
        : 'custom',
    customRepeat: (icon.repeats ?? -1) < 1 ? 1 : icon.repeats || 1,
    customColor: icon.color != null,
    color: icon.color || '#000000',
  }
}

export type CustomizeIconPopoverProps = {
  trigger: React.ReactNode
  icon: IconListEntry
  onAfterColorChange: () => void
}
export const CustomizeIconPopover: React.FC<CustomizeIconPopoverProps> = observer(
  ({ icon, trigger, onAfterColorChange }) => {
    const store = useEditorStore()!

    const state = useLocalStore(() => ({
      value: getValueFromWordEntry(icon),
      isShowingFontPicker: false,
    }))

    const handleChange = () => {
      const { value } = state

      if (value.repeat === 'repeat') {
        icon.repeats = -1
      } else if (value.repeat === 'custom') {
        icon.repeats = value.customRepeat || 1
      } else if (value.repeat === 'once') {
        icon.repeats = 1
      }

      if (value.customColor) {
        icon.color = value.color || 'black'
      } else {
        icon.color = undefined
      }
    }

    return (
      <Popover
        closeOnBlur={!state.isShowingFontPicker}
        closeOnEsc
        placement="right"
        autoFocus={false}
        onOpen={() => {
          state.value = getValueFromWordEntry(icon)
        }}
      >
        <PopoverTrigger>{trigger}</PopoverTrigger>
        <Portal>
          <PopoverContent width="280px">
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
                  value={state.value.repeat}
                  onChange={(value) => {
                    state.value.repeat = value as 'repeat' | 'once' | 'custom'
                    handleChange()
                    store.animateVisualize(false)
                  }}
                />

                {state.value.repeat === 'custom' && (
                  <Box mt="3" mb="4">
                    <NumberInput
                      size="sm"
                      maxWidth="70px"
                      value={icon.repeats}
                      min={1}
                      max={50}
                      step={1}
                      onChange={(v) => {
                        state.value.customRepeat = (v as any) as number
                        handleChange()
                        store.animateVisualize(false)
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
                  id={`${icon.shapeId}-custom-color`}
                  isChecked={icon.color != null ? true : false}
                  onChange={(e) => {
                    state.value.customColor = e.target.checked
                    handleChange()
                    onAfterColorChange()
                  }}
                />

                <FormLabel
                  htmlFor={`${icon.shapeId}-custom-color`}
                  my="0"
                  ml="2"
                >
                  Custom color
                </FormLabel>

                <Box
                  ml="3"
                  css={
                    !state.value.customColor &&
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
                    value={state.value.color || 'black'}
                    onChange={(color) => {
                      state.value.color = color
                      handleChange()
                    }}
                    onAfterChange={() => onAfterColorChange()}
                  />
                </Box>
              </Flex>

              <PopoverCloseButton />
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    )
  }
)
