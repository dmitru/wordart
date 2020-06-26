import { observer } from 'mobx-react'
import styled from '@emotion/styled'
import { noop } from 'lodash'
import { darken } from 'polished'
import { Box, BoxProps } from '@chakra-ui/core'
import { ShapeConf, ShapeId } from 'components/Editor/shape-config'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List, ListProps } from 'react-window'
import css from '@emotion/css'

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
    const cols = 3
    const rows = Math.ceil(shapes.length / cols)

    const itemWidth = 106
    const itemHeight = 106

    const ThumbnailsRow: ListProps['children'] = ({ index, style }) => {
      const rowShapes = [
        shapes[cols * index],
        shapes[cols * index + 1],
        shapes[cols * index + 2],
      ].filter((s) => s != null)

      return (
        <Box
          style={style}
          px="3px"
          css={css`
            &:first-child {
              padding-top: 3px;
            }
            &:last-child {
              padding-bottom: 3px;
            }
          `}
        >
          {rowShapes.map((shape, i) => (
            <ShapeThumbnailBtn
              key={`${index}-${i}`}
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
        </Box>
      )
    }

    return (
      <>
        <Box flex="1" width="346px">
          <AutoSizer defaultWidth={346} defaultHeight={600}>
            {({ height }) => (
              <List
                overscanCount={5}
                height={height}
                itemCount={rows}
                itemSize={itemHeight}
                width={itemWidth * cols + 26}
              >
                {ThumbnailsRow}
              </List>
            )}
          </AutoSizer>
        </Box>
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
  border: 1px solid #efefef;
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
    filter: drop-shadow(0px 0px 4px #0003);
  }

  svg {
    width: 90px;
    height: 90px;
    filter: drop-shadow(0px 0px 4px #0003);

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
    background-color: hsla(358, 80%, 65%, 0.14);
    outline: 3px solid ${theme.colors.accent['500']};
    z-index: 1;
    overflow: visible;
    position: relative;
  `}

  &:hover,
  &:focus {
    z-index: 1;
    background: #eee;
    border: 1px solid ${(p) => p.theme.colors.accent};
    ${({ theme, active }) =>
      active &&
      `
      z-index: 2;
      background: hsla(358, 80%, 65%, 0.14);
      `}
  }
`
