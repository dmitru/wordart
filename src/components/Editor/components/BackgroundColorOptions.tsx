import { Box } from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { Slider } from 'components/shared/Slider'
import { observer } from 'mobx-react'
import React from 'react'
import { useEditorStore } from 'components/Editor/editor-store'

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
            <ColorPickerPopover
              disableAlpha
              colorSwatchOpacity={bgStyle.fill.color.opacity / 100}
              value={chroma(bgStyle.fill.color.color).alpha(1).hex()}
              onChange={(hex) => {
                bgStyle.fill.color.color = chroma(hex).hex()
              }}
              onAfterChange={() => {
                onUpdate()
              }}
            />

            <Box ml="5" flex="1">
              <Slider
                css={css`
                  flex: 1;
                  margin-right: 20px;
                  margin-bottom: 0;
                `}
                horizontal
                afterLabel="%"
                label="Opacity"
                value={bgStyle.fill.color.opacity}
                onChange={(value) => {
                  bgStyle.fill.color.opacity = value
                }}
                onAfterChange={() => {
                  onUpdate()
                }}
                resetValue={100}
                min={0}
                max={100}
                step={1}
              />
            </Box>
          </Box>
        )}
      </Box>
    </>
  )
})
