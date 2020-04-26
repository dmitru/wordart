import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import styled from 'styled-components'
import { ShapeConfig } from 'components/pages/EditorPage/editor-page-store'
import { ReactSVG } from 'react-svg'

export type LeftPanelShapesTabProps = {}

const ShapeThumbnailBtn: React.FC<
  {
    shape: ShapeConfig
    active: boolean
  } & Omit<React.HTMLProps<HTMLButtonElement>, 'shape'>
> = ({ shape, active, onClick }) => {
  if (shape.kind === 'img') {
    return (
      <ShapeThumbnailBtnInner active={active} onClick={onClick}>
        <ShapeThumbnailBtnInnerImg src={shape.url} />
      </ShapeThumbnailBtnInner>
    )
  }

  if (shape.kind === 'svg') {
    return (
      <ShapeThumbnailBtnInner active={active} onClick={onClick}>
        <ReactSVG
          src={shape.url}
          style={{
            color: shape.fill || 'black',
            width: `100px`,
            height: `100px`,
          }}
        />
      </ShapeThumbnailBtnInner>
    )
  }

  return null
}

const ShapeThumbnailBtnInnerImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`

const ShapeThumbnails = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
`

const ShapeThumbnailBtnInner = styled.button<
  {
    active: boolean
  } & React.HTMLProps<HTMLButtonElement>
>`
  outline: none;
  background: white;
  width: 100px;
  height: 100px;
  display: inline-flex;
  margin: 10px;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  cursor: pointer;
  flex-direction: column;
  ${({ active }) => active && `outline: 3px solid orange;`}
  -webkit-appearance: none;

  svg {
    width: 100px;
    height: 100px;
  }

  color: black;

  .icon {
    width: 20px;
    height: 20px;
    margin-bottom: 4px;
  }

  &:hover,
  &:focus {
    outline: 3px solid pink;
    ${({ active }) => active && `outline: 3px solid orange;`}
  }
`

export const LeftPanelShapesTab: React.FC<LeftPanelShapesTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    return (
      <>
        <ShapeThumbnails>
          {editorPageStore.getAvailableShapes().map((shape) => (
            <ShapeThumbnailBtn
              key={shape.id}
              onClick={() => {
                editorPageStore.selectShape(shape.id)
              }}
              active={shape.id === editorPageStore.getSelectedShape().id}
              shape={shape}
            />
          ))}
        </ShapeThumbnails>
      </>
    )
  }
)
