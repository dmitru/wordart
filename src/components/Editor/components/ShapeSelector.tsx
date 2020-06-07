import { observer } from 'mobx-react'
import styled from '@emotion/styled'
import { noop } from 'lodash'
import { darken } from 'polished'
import { Box, BoxProps } from '@chakra-ui/core'
import { ShapeConf, ShapeId } from 'components/Editor/shape-config'

export type ShapeSelectorProps = {
  shapes: ShapeConf[]
  showProcessedThumbnails?: boolean
  selectedShapeId?: ShapeId
  onSelected?: (shape: ShapeConf) => void
} & BoxProps

export const ShapeSelector: React.FC<ShapeSelectorProps> = observer(
  ({
    shapes,
    selectedShapeId,
    showProcessedThumbnails = false,
    onSelected = noop,
    ...rest
  }) => {
    return (
      <>
        <ShapeThumbnails mt="2" {...rest}>
          {shapes.map((shape) => (
            <ShapeThumbnailBtn
              key={shape.id}
              onClick={() => {
                onSelected(shape)
              }}
              backgroundColor="white"
              active={shape.id === selectedShapeId}
              url={
                (showProcessedThumbnails
                  ? shape.processedThumbnailUrl
                  : shape.thumbnailUrl) || shape.thumbnailUrl
              }
            />
          ))}
        </ShapeThumbnails>
      </>
    )
  }
)

export const ShapeThumbnailBtn: React.FC<
  {
    backgroundColor: string
    url: string
    active?: boolean
  } & Omit<React.HTMLProps<HTMLButtonElement>, 'shape' | 'type'>
> = observer(({ url, backgroundColor, active = false, onClick, ...rest }) => {
  return (
    <ShapeThumbnailBtnInner
      {...rest}
      active={active}
      onClick={onClick}
      backgroundColor={backgroundColor}
    >
      <ShapeThumbnailBtnInnerImg src={url} />
    </ShapeThumbnailBtnInner>
  )
  return null
})

const ShapeThumbnailBtnInnerImg = styled.img`
  width: 90px;
  height: 90px;
  margin: 0;
  object-fit: contain;
`

export const ShapeThumbnails = styled(Box)``

const ShapeThumbnailBtnInner = styled.button<{
  theme: any
  backgroundColor: string
  fill?: string
  active: boolean
}>`
  width: 106px;
  height: 106px;
  border: 1px solid #ddd;
  outline: none;
  background: white;
  display: inline-flex;
  padding: 5px;
  margin: 0;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  cursor: pointer;
  flex-direction: column;

  -webkit-appearance: none;

  img {
    margin: 0;
  }

  svg {
    width: 90px;
    height: 90px;

    * {
      ${({ fill }) => fill && `fill: ${fill}`};
    }
  }

  color: black;

  .icon {
    width: 20px;
    height: 20px;
    margin-bottom: 4px;
  }

  transition: 0.2s all;

  ${({ theme, active }) =>
    active &&
    `
    border: 1px solid ${theme.colors.accent};
    background-color: #c8e8ff;
  `}

  &:hover,
  &:focus {
    z-index: 1;
    background: #eee;
    border: 1px solid ${(p) => p.theme.colors.accent};
    ${({ theme, active }) =>
      active &&
      `
      border: 1px solid ${theme.colors.accent}; 
      z-index: 2;
      background: ${darken(0.1, '#c8e8ff')};
      `}
  }
`
