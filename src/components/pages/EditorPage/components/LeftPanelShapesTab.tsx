import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import styled from '@emotion/styled'
import { ShapeConfig } from 'components/pages/EditorPage/editor-page-store'
import { ReactSVG } from 'react-svg'
import { useState } from 'react'
import { TextInput } from 'components/shared/TextInput'
import { Box } from 'components/shared/Box'

export type LeftPanelShapesTabProps = {}

const ShapeThumbnailBtn: React.FC<
  {
    backgroundColor: string
    shape: ShapeConfig
    active: boolean
  } & Omit<React.HTMLProps<HTMLButtonElement>, 'shape'>
> = ({ shape, backgroundColor, active, onClick }) => {
  if (shape.kind === 'img') {
    return (
      <ShapeThumbnailBtnInner
        active={active}
        onClick={onClick}
        backgroundColor={backgroundColor}
      >
        <ShapeThumbnailBtnInnerImg src={shape.url} />
      </ShapeThumbnailBtnInner>
    )
  }

  if (shape.kind === 'svg') {
    return (
      <ShapeThumbnailBtnInner
        backgroundColor={backgroundColor}
        active={active}
        onClick={onClick}
        fill={shape.fill || 'black'}
      >
        <ReactSVG
          src={shape.url}
          style={{
            color: shape.fill || 'black',
            width: `78px`,
            height: `78px`,
          }}
        />
      </ShapeThumbnailBtnInner>
    )
  }

  return null
}

const ShapeThumbnailBtnInnerImg = styled.img`
  width: 66px;
  height: 66px;
  margin: 0;
  object-fit: contain;
`

const ShapeThumbnails = styled(Box)`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
`

const ShapeThumbnailBtnInner = styled.button<
  {
    backgroundColor: string
    fill?: string
    active: boolean
  } & React.HTMLProps<HTMLButtonElement>
>`
  outline: none;
  background: white;
  width: 78px;
  height: 78px;
  display: inline-flex;
  padding: 5px;
  margin: 4px;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  cursor: pointer;
  flex-direction: column;
  ${({ theme, active }) =>
    active && `outline: 3px solid ${theme.colors.primary};`}
  -webkit-appearance: none;
  background-color: ${(p) => p.backgroundColor};

  svg {
    width: 78px;
    height: 78px;

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

  &:hover,
  &:focus {
    outline: 3px solid ${(p) => p.theme.colors.primary};
    ${({ theme, active }) =>
      active && `outline: 3px solid ${theme.colors.primary};`}
  }
`

export const LeftPanelShapesTab: React.FC<LeftPanelShapesTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    const [query, setQuery] = useState('')

    const matchingShapes = editorPageStore
      .getAvailableShapes()
      .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))

    return (
      <>
        <TextInput
          placeholder='Try "Heart" or "face"'
          value={query}
          onChange={setQuery}
        />

        <ShapeThumbnails mt={2}>
          {matchingShapes.map((shape) => (
            <ShapeThumbnailBtn
              key={shape.id}
              onClick={() => {
                editorPageStore.selectShape(shape.id)
              }}
              backgroundColor="white"
              // backgroundColor={editorPageStore.bgColor}
              active={shape.id === editorPageStore.getSelectedShape().id}
              shape={shape}
            />
          ))}
        </ShapeThumbnails>
      </>
    )
  }
)
