import {
  Box,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ChoiceButtons } from 'components/Editor/components/ChoiceButtons'
import { BgStyleOptions } from 'components/Editor/style-options'
import { ColorPicker } from 'components/shared/ColorPicker'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { observer } from 'mobx-react'
import { useRef, useState } from 'react'

export const BgItemsColorPicker: React.FC<{
  bgStyle: BgStyleOptions
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ bgStyle, onUpdate, children, ...props }) => {
  const initialFocusRef = useRef(null)
  const ref = useRef(null)

  let trigger: React.ReactNode = <span>open</span>
  if (bgStyle.items.coloring.kind === 'color') {
    trigger = (
      <ColorSwatchButton
        css={css`
          width: 80px;
        `}
        borderRadius="none"
        color={bgStyle.items.coloring.color.color}
        kind="color"
        ref={ref}
        {...props}
      />
    )
  } else if (bgStyle.items.coloring.kind === 'gradient') {
    trigger = (
      <ColorSwatchButton
        css={css`
          width: 80px;
        `}
        borderRadius="none"
        colors={[
          bgStyle.items.coloring.gradient.gradient.from,
          bgStyle.items.coloring.gradient.gradient.to,
        ]}
        kind="gradient"
        ref={ref}
        {...props}
      />
    )
  } else if (bgStyle.items.coloring.kind === 'shape') {
    trigger = (
      <ColorSwatchButton
        css={css`
          width: 80px;
        `}
        borderRadius="none"
        kind="spectrum"
        ref={ref}
        {...props}
      />
    )
  }

  const [multicolorIndex, setMulticolorIndex] = useState(0)

  return (
    <>
      <Popover
        initialFocusRef={initialFocusRef}
        placement="bottom"
        closeOnBlur
        closeOnEsc
        usePortal
      >
        <PopoverTrigger>
          <Box>{trigger}</Box>
        </PopoverTrigger>

        <PopoverContent
          zIndex={4000}
          css={css`
            /* width: 250px; */
          `}
        >
          <PopoverArrow />
          <PopoverBody
            p={2}
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Box
              mb="2"
              mt="2"
              display="flex"
              flexDirection="row"
              alignItems="flex-start"
            >
              <Box>
                <Box mb="2">
                  <ChoiceButtons
                    choices={[
                      { title: 'Gradient', value: 'gradient' },
                      { title: 'Color', value: 'color' },
                    ]}
                    value={bgStyle.items.coloring.kind}
                    onChange={(value) => {
                      if (value === 'gradient') {
                        bgStyle.items.coloring.kind = 'gradient'
                      } else if (value === 'color') {
                        bgStyle.items.coloring.kind = 'color'
                      }
                      onUpdate()
                    }}
                  />
                </Box>

                {bgStyle.items.coloring.kind === 'color' && (
                  <ColorPicker
                    disableAlpha
                    value={bgStyle.items.coloring.color.color}
                    onChange={(hex) => {
                      bgStyle.items.coloring.color.color = hex
                    }}
                    onAfterChange={onUpdate}
                  />
                )}
                {bgStyle.items.coloring.kind === 'gradient' && (
                  <>
                    <Box mt="2">
                      {[
                        bgStyle.items.coloring.gradient.gradient.from,
                        bgStyle.items.coloring.gradient.gradient.to,
                      ].map((color, index) => (
                        <Box mr="1" key={index} display="inline-block">
                          <ColorSwatchButton
                            kind="color"
                            color={
                              index === 0
                                ? bgStyle.items.coloring.gradient.gradient.from
                                : bgStyle.items.coloring.gradient.gradient.to
                            }
                            onClick={() => setMulticolorIndex(index)}
                          />
                        </Box>
                      ))}

                      <Box mt="3">
                        <ColorPicker
                          disableAlpha
                          value={chroma(
                            multicolorIndex === 0
                              ? bgStyle.items.coloring.gradient.gradient.from
                              : bgStyle.items.coloring.gradient.gradient.to
                          )
                            .alpha(1)
                            .hex()}
                          onChange={(hex) => {
                            const color = chroma(hex).hex()
                            if (multicolorIndex === 0) {
                              bgStyle.items.coloring.gradient.gradient.from = color
                            } else {
                              bgStyle.items.coloring.gradient.gradient.to = color
                            }
                          }}
                          onAfterChange={() => {
                            onUpdate()
                          }}
                        />
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
            {children}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  )
})
