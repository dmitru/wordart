import {
  Box,
  Button,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/core'
import css from '@emotion/css'
import chroma from 'chroma-js'
import { ShapeSvg } from 'components/Editor/shape'
import { ColorPicker } from 'components/shared/ColorPicker'
import { ColorSwatchButton } from 'components/shared/ColorSwatchButton'
import { isEqual } from 'lodash'
import { observer } from 'mobx-react'
import { useRef, useState } from 'react'
import { useStore } from 'services/root-store'
import { ChoiceButtons } from 'components/Editor/components/ChoiceButtons'

export const SvgShapeColorPicker: React.FC<{
  shape: ShapeSvg
  onUpdate: () => void
  children?: React.ReactNode
}> = observer(({ shape, onUpdate, children, ...props }) => {
  const { editorPageStore: store } = useStore()
  const shapeStyle = store.styleOptions.shape

  const initialFocusRef = useRef(null)
  const ref = useRef(null)

  let trigger: React.ReactNode = <span>open</span>
  if (shape.config.processing.colors.kind === 'single-color') {
    trigger = (
      <ColorSwatchButton
        css={css`
          width: 80px;
        `}
        borderRadius="none"
        color={shape.config.processing.colors.color}
        kind="color"
        ref={ref}
        {...props}
      >
        {null}
      </ColorSwatchButton>
    )
  } else if (shape.config.processing.colors.kind === 'original') {
    trigger = (
      <ColorSwatchButton
        css={css`
          width: 80px;
        `}
        borderRadius="none"
        colors={shape.originalColors}
        kind="colors"
        ref={ref}
        {...props}
      >
        {null}
      </ColorSwatchButton>
    )
  } else if (shape.config.processing.colors.kind === 'color-map') {
    trigger = (
      <ColorSwatchButton
        css={css`
          width: 80px;
        `}
        borderRadius="none"
        colors={shape.config.processing.colors.colors}
        kind="colors"
        ref={ref}
        {...props}
      >
        {null}
      </ColorSwatchButton>
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
                      { title: 'Original', value: 'original' },
                      { title: 'Multicolor', value: 'color-map' },
                      { title: 'Single color', value: 'single-color' },
                    ]}
                    value={shape.config.processing.colors.kind}
                    onChange={(value) => {
                      if (value === 'original') {
                        shape.config.processing.colors = {
                          kind: 'original',
                        }
                      } else if (value === 'color-map') {
                        shape.config.processing.colors = {
                          kind: 'color-map',
                          colors: shapeStyle.colors.colorMaps.get(shape.id)!,
                        }
                      } else if (value === 'single-color') {
                        shape.config.processing.colors = {
                          kind: 'single-color',
                          color: shapeStyle.colors.color,
                        }
                      }
                      onUpdate()
                    }}
                  />
                </Box>

                {shape.config.processing.colors.kind === 'single-color' && (
                  <Box mb="4">
                    <ColorPicker
                      disableAlpha
                      value={chroma(shape.config.processing.colors.color)
                        .alpha(1)
                        .hex()}
                      onChange={(hex) => {
                        if (
                          shape.config.processing.colors.kind === 'single-color'
                        ) {
                          shape.config.processing.colors.color = chroma(
                            hex
                          ).hex()
                        }
                      }}
                      onAfterChange={() => {
                        onUpdate()
                      }}
                    />
                  </Box>
                )}

                {shape.config.processing.colors.kind === 'color-map' && (
                  <Box>
                    {shape.config.processing.colors.colors.map(
                      (color, index) => (
                        <Box mr="1" key={index} display="inline-block">
                          {shape.config.processing.colors.kind ===
                            'color-map' && (
                            <ColorSwatchButton
                              kind="color"
                              color={
                                shape.config.processing.colors.colors[index]
                              }
                              onClick={() => setMulticolorIndex(index)}
                            />
                          )}
                        </Box>
                      )
                    )}

                    <Box mt="3">
                      <ColorPicker
                        disableAlpha
                        value={chroma(
                          shape.config.processing.colors.colors[multicolorIndex]
                        )
                          .alpha(1)
                          .hex()}
                        onChange={(hex) => {
                          if (
                            shape.config.processing.colors.kind === 'color-map'
                          ) {
                            shape.config.processing.colors.colors[
                              multicolorIndex
                            ] = chroma(hex).hex()
                          }
                        }}
                        onAfterChange={() => {
                          onUpdate()
                        }}
                      />
                    </Box>

                    {shape.config.processing.colors.kind === 'color-map' && (
                      <Button
                        mt="3"
                        size="sm"
                        isDisabled={isEqual(
                          shape.config.processing.colors.colors,
                          shape.originalColors
                        )}
                        onClick={() => {
                          shape.config.processing.colors = {
                            kind: 'color-map',
                            colors: shape.originalColors,
                          }
                          onUpdate()
                        }}
                      >
                        Reset Default Colors
                      </Button>
                    )}
                  </Box>
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
