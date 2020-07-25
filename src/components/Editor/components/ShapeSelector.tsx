import React, { useRef, useEffect } from 'react'
import { observer } from 'mobx-react'
import styled from '@emotion/styled'
import { noop } from 'lodash'
import { Box, BoxProps } from '@chakra-ui/core'
import {
  ShapeConf,
  ShapeId,
  ShapeClipartConf,
  ShapeIconConf,
} from 'components/Editor/shape-config'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List, ListProps } from 'react-window'
import css from '@emotion/css'

export type ShapeSelectorProps = {
  columns?: number
  overscanCount?: number
  shapes: (ShapeClipartConf | ShapeIconConf)[]
  showProcessedThumbnails?: boolean
  selectedShapeId?: ShapeId
  onSelected?: (shape: ShapeConf) => void
} & BoxProps

export const ShapeSelector: React.FC<ShapeSelectorProps> = observer(
  ({
    columns = 3,
    overscanCount = 4,
    shapes,
    selectedShapeId,
    showProcessedThumbnails = false,
    onSelected = noop,
    ...rest
  }) => {
    const listRef = useRef<List>(null)

    useEffect(() => {
      if (listRef.current && selectedShapeId != null) {
        // Scroll to the current item
        const itemIndex = shapes.findIndex((s) => s.id === selectedShapeId)
        if (itemIndex > -1) {
          listRef.current.scrollToItem(Math.ceil(itemIndex / columns), 'smart')
        }
      }
    }, [listRef.current])

    const cols = columns
    const rows = Math.ceil(shapes.length / cols)

    const width = 106 * 3
    const itemWidth = width / cols
    const itemHeight = width / cols

    const ThumbnailsRow: ListProps['children'] = ({ index, style }) => {
      const rowShapes = new Array(cols)
        .fill(null)
        .map((v, colIndex) => shapes[cols * index + colIndex])
        .filter((s) => s != null)

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
              size={itemWidth}
              padding={8}
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
                overscanCount={overscanCount}
                height={height}
                itemCount={rows}
                itemSize={itemHeight}
                width={itemWidth * cols + 26}
                ref={listRef}
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
    size?: number
    padding?: number
    backgroundColor?: string
    url?: string
    active?: boolean
    children?: React.ReactNode
  } & Omit<React.HTMLProps<HTMLButtonElement>, 'shape' | 'type'>
> = observer(
  ({
    size = 106,
    padding = 8,
    url = null,
    children,
    backgroundColor = 'white',
    active = false,
    onClick,
    ...rest
  }) => {
    return url ? (
      <ShapeThumbnailBtnInner
        {...rest}
        padding={padding}
        size={size}
        active={active}
        onClick={onClick}
        backgroundColor={backgroundColor}
      >
        <ShapeThumbnailBtnInnerImg src={url} size={size - 2 * padding} />
        {children}
      </ShapeThumbnailBtnInner>
    ) : null
  }
)

const ShapeThumbnailBtnInnerImg = styled.img<{ size: number }>`
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
  margin: 0;
  object-fit: contain;
`

export const ShapeThumbnails = styled(Box)``

const ShapeThumbnailBtnInner = styled.button<{
  size: number
  padding: number
  theme: any
  backgroundColor: string
  fill?: string
  active: boolean
}>`
  width: ${(p) => p.size}px;
  height: ${(p) => p.size}px;
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
    // filter: drop-shadow(0px 0px 4px #0003);
  }

  svg {
    width: ${(p) => p.size - 2 * p.padding}px;
    height: ${(p) => p.size - 2 * p.padding}px;
    // filter: drop-shadow(0px 0px 4px #0003);

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
