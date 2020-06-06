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
import { ShapeStyleOptions } from 'components/Editor/style-options'
import { ColorPicker } from 'components/shared/ColorPicker'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { observer } from 'mobx-react'
import { useRef, useState } from 'react'

export const ShapeItemsColorPicker: React.FC<{
  shapeStyle: ShapeStyleOptions
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ shapeStyle, onUpdate, children, ...props }) => {
  const initialFocusRef = useRef(null)
  const ref = useRef(null)

  let trigger: React.ReactNode = <span>open</span>
  if (shapeStyle.items.coloring.kind === 'color') {
    trigger = (
      <ColorSwatchButton
        css={css`
          width: 80px;
        `}
        borderRadius="none"
        color={shapeStyle.items.coloring.color.color}
        kind="color"
        ref={ref}
        {...props}
      />
    )
  } else if (shapeStyle.items.coloring.kind === 'gradient') {
    trigger = (
      <ColorSwatchButton
        css={css`
          width: 80px;
        `}
        borderRadius="none"
        colors={[
          shapeStyle.items.coloring.gradient.gradient.from,
          shapeStyle.items.coloring.gradient.gradient.to,
        ]}
        kind="gradient"
        ref={ref}
        {...props}
      />
    )
  } else if (shapeStyle.items.coloring.kind === 'shape') {
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
                      { title: 'Shape Colors', value: 'shape' },
                      { title: 'Gradient', value: 'gradient' },
                      { title: 'Color', value: 'color' },
                    ]}
                    value={shapeStyle.items.coloring.kind}
                    onChange={(value) => {
                      if (value === 'shape') {
                        shapeStyle.items.coloring.kind = 'shape'
                      } else if (value === 'gradient') {
                        shapeStyle.items.coloring.kind = 'gradient'
                      } else if (value === 'color') {
                        shapeStyle.items.coloring.kind = 'color'
                      }
                      onUpdate()
                    }}
                  />
                </Box>

                {shapeStyle.items.coloring.kind === 'color' && (
                  <ColorPicker
                    disableAlpha
                    value={shapeStyle.items.coloring.color.color}
                    onChange={(hex) => {
                      shapeStyle.items.coloring.color.color = hex
                    }}
                    onAfterChange={onUpdate}
                  />
                )}
                {shapeStyle.items.coloring.kind === 'gradient' && (
                  <>
                    <Box mt="2">
                      {[
                        shapeStyle.items.coloring.gradient.gradient.from,
                        shapeStyle.items.coloring.gradient.gradient.to,
                      ].map((color, index) => (
                        <Box mr="1" key={index} display="inline-block">
                          <ColorSwatchButton
                            kind="color"
                            color={
                              index === 0
                                ? shapeStyle.items.coloring.gradient.gradient
                                    .from
                                : shapeStyle.items.coloring.gradient.gradient.to
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
                              ? shapeStyle.items.coloring.gradient.gradient.from
                              : shapeStyle.items.coloring.gradient.gradient.to
                          )
                            .alpha(1)
                            .hex()}
                          onChange={(hex) => {
                            const color = chroma(hex).hex()
                            if (multicolorIndex === 0) {
                              shapeStyle.items.coloring.gradient.gradient.from = color
                            } else {
                              shapeStyle.items.coloring.gradient.gradient.to = color
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
