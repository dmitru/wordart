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
import { SelectedFontThumbnail } from 'components/Editor/components/FontPicker/components'
import { FontPickerModal } from 'components/Editor/components/FontPicker/FontPickerModal'
import { useEditorStore } from 'components/Editor/editor-store'
import { BaseBtn } from 'components/shared/BaseBtn'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { Slider } from 'components/shared/Slider'
import { FontId } from 'data/fonts'
import { observer, useLocalStore } from 'mobx-react'
import React from 'react'
import { defaultFontId } from '../default-style-options'
import { WordListEntry } from '../style-options'

export type CustomizeWordOptions = {
  // Repeat
  repeat: 'repeat' | 'once' | 'custom'
  customRepeat: number
  // Angle
  customAngle: boolean
  angle: number
  // Custom font
  customFont: boolean
  font: FontId
  // Custom color
  customColor: boolean
  color: string
}

const getValueFromWordEntry = (word: WordListEntry): CustomizeWordOptions => {
  return {
    repeat:
      (word.repeats ?? -1) === -1
        ? 'repeat'
        : word.repeats === 1
        ? 'once'
        : 'custom',
    customRepeat: (word.repeats ?? -1) < 1 ? 1 : word.repeats || 1,
    customAngle: word.angle != null,
    angle: word.angle || 0,
    customFont: word.fontId != null,
    font: word.fontId || defaultFontId,
    customColor: word.color != null,
    color: word.color || '#000000',
  }
}

export type CustomizeWordPopoverProps = {
  trigger: React.ReactNode
  word: WordListEntry
  onAfterColorChange: () => void
}
export const CustomizeWordPopover: React.FC<CustomizeWordPopoverProps> = observer(
  ({ word, trigger, onAfterColorChange }) => {
    const store = useEditorStore()!

    const state = useLocalStore(() => ({
      value: getValueFromWordEntry(word),
      isShowingFontPicker: false,
    }))

    const handleChange = () => {
      const { value } = state

      if (value.repeat === 'repeat') {
        word.repeats = -1
      } else if (value.repeat === 'custom') {
        word.repeats = value.customRepeat || 1
      } else if (value.repeat === 'once') {
        word.repeats = 1
      }

      if (value.customColor) {
        word.color = value.color || 'black'
      } else {
        word.color = undefined
      }

      if (value.customAngle) {
        word.angle = value.angle || 0
      } else {
        word.angle = undefined
      }

      if (value.customFont) {
        word.fontId = value.font || defaultFontId
      } else {
        word.fontId = undefined
      }
    }

    return (
      <Popover
        closeOnBlur={!state.isShowingFontPicker}
        closeOnEsc
        placement="right"
        autoFocus={false}
        onOpen={() => {
          state.value = getValueFromWordEntry(word)
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
                    { title: 'Repeat word', value: 'repeat' },
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
                      value={state.value.customRepeat}
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
                  id={`${word.id}-custom-color`}
                  isChecked={word.color != null ? true : false}
                  onChange={(e) => {
                    state.value.customColor = e.target.checked
                    handleChange()
                    onAfterColorChange()
                  }}
                />

                <FormLabel htmlFor={`${word.id}-custom-color`} my="0" ml="2">
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

              {/* CUSTOM ANGLE  */}
              <Flex align="center" mt="4">
                <Switch
                  id={`${word.id}-custom-angle`}
                  isChecked={state.value.customAngle}
                  onChange={(e) => {
                    state.value.customAngle = e.target.checked
                    handleChange()
                    store.animateVisualize(false)
                  }}
                />
                <FormLabel htmlFor={`${word.id}-custom-angle`} my="0" ml="2">
                  Custom angle
                </FormLabel>
              </Flex>

              {word.angle != null && (
                <Box mt="2" mb="4">
                  <Slider
                    afterLabel=""
                    value={state.value.angle || 0}
                    onChange={(value) => {
                      state.value.angle = value
                      handleChange()
                    }}
                    onAfterChange={() => store.animateVisualize(false)}
                    min={-90}
                    max={90}
                    step={1}
                  />
                </Box>
              )}

              {/* CUSTOM FONT */}
              <Flex align="center" mt="4">
                <Switch
                  id={`${word.id}-custom-font`}
                  isChecked={state.value.customFont}
                  onChange={(e) => {
                    state.value.customFont = e.target.checked
                    store.animateVisualize(false)
                    handleChange()
                  }}
                />

                <FormLabel htmlFor={`${word.id}-custom-font`} my="0" ml="2">
                  Custom font
                </FormLabel>
              </Flex>

              {word.fontId != null && (
                <Box mt="2">
                  <BaseBtn
                    onClick={() => {
                      state.isShowingFontPicker = true
                    }}
                    as={SelectedFontThumbnail}
                    mb="0"
                    p="3"
                  >
                    <img
                      src={
                        store.getFontConfigById(state.value.font)?.style
                          .thumbnail
                      }
                    />
                  </BaseBtn>
                </Box>
              )}

              <FontPickerModal
                isOpen={state.isShowingFontPicker}
                onClose={() => {
                  state.isShowingFontPicker = false
                }}
                onSubmit={(font, fontStyle) => {
                  state.value.font = fontStyle.fontId
                  state.isShowingFontPicker = false
                  handleChange()
                  store.animateVisualize(false)
                }}
                selectedFontId={state.value.font || defaultFontId}
              />

              <PopoverCloseButton />
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    )
  }
)
