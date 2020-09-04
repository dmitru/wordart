import { Box } from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { Slider } from 'components/shared/Slider'
import { observer } from 'mobx-react'
import React from 'react'
import { useEditorStore } from 'components/Editor/editor-store'
import { ChoiceButtons } from 'components/Editor/components/ChoiceButtons'

export const BackgroundColorOptions: React.FC<{
  onUpdate: () => void
}> = observer(({ onUpdate }) => {
  const store = useEditorStore()!
  const bgStyle = store.styleOptions.bg

  return (
    <>
      <Box>
        {bgStyle.fill.kind === 'color' && (
          <Box display="flex" alignItems="center">
            <ChoiceButtons
              mr="6"
              choices={[
                { title: 'Transparent', value: 'transparent' },
                { title: 'Color', value: 'color' },
              ]}
              value={
                bgStyle.fill.color.opacity === 100 ? 'color' : 'transparent'
              }
              onChange={(choice) => {
                bgStyle.fill.color.opacity = choice === 'color' ? 100 : 0
                onUpdate()
              }}
            />

            {bgStyle.fill.color.opacity > 0 && (
              <ColorPickerPopover
                disableAlpha
                colorSwatchOpacity={bgStyle.fill.color.opacity / 100}
                value={chroma(bgStyle.fill.color.color).alpha(1).hex()}
                onChange={(hex) => {
                  bgStyle.fill.color.color = chroma(hex).hex()
                  bgStyle.fill.color.opacity = 100
                }}
                onAfterChange={() => {
                  onUpdate()
                }}
              />
            )}
          </Box>
        )}
      </Box>
    </>
  )
})
