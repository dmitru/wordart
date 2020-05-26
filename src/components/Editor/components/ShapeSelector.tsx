import { observer } from 'mobx-react'
import styled from '@emotion/styled'
import { Box, BoxProps } from 'components/shared/Box'
import { noop } from 'lodash'
import { darken } from 'polished'
import { ShapeConfig, ShapeId } from 'components/Editor/style'

export type ShapeSelectorProps = {
  shapes: ShapeConfig[]
  selectedShapeId?: ShapeId
  onSelected?: (shape: ShapeConfig) => void
} & BoxProps

export const ShapeSelector: React.FC<ShapeSelectorProps> = observer(
  ({ shapes, selectedShapeId, onSelected = noop, ...rest }) => {
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
              shape={shape}
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
    shape: ShapeConfig
    active?: boolean
  } & Omit<React.HTMLProps<HTMLButtonElement>, 'shape' | 'type'>
> = observer(({ shape, backgroundColor, active = false, onClick, ...rest }) => {
  if (shape.kind === 'img' || shape.kind === 'svg') {
    return (
      <ShapeThumbnailBtnInner
        {...rest}
        active={active}
        onClick={onClick}
        backgroundColor={backgroundColor}
      >
        <ShapeThumbnailBtnInnerImg src={shape.thumbnailUrl || shape.url} />
      </ShapeThumbnailBtnInner>
    )
  }

  // if (shape.kind === 'svg') {
  //   return (
  //     <ShapeThumbnailBtnInner
  //       backgroundColor={backgroundColor}
  //       active={active}
  //       onClick={onClick}
  //     >
  //       <ReactSVG
  //         src={shape.url}
  //         style={{
  //           color: shape.keepSvgColors ? undefined : shape.fill || 'black',
  //           width: `78px`,
  //           height: `78px`,
  //         }}
  //       />
  //     </ShapeThumbnailBtnInner>
  //   )
  // }

  return null
})

const ShapeThumbnailBtnInnerImg = styled.img`
  width: 90px;
  height: 90px;
  margin: 0;
  object-fit: contain;
`

export const ShapeThumbnails = styled(Box)``

const ShapeThumbnailBtnInner = styled.button<
  {
    backgroundColor: string
    fill?: string
    active: boolean
  } & React.HTMLProps<HTMLButtonElement>
>`
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
