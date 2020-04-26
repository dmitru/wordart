import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import styled from 'styled-components'

export type LeftPanelShapesTabProps = {}

const ShapeThumbnailBtn = styled.button<{
  thumbnailSrc: string
  active: boolean
}>`
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
  background-image: url(${({ thumbnailSrc }) => thumbnailSrc});
  background-repeat: no-repeat;
  background-size: contain;
  ${({ active }) => active && `outline: 3px solid orange;`}
  -webkit-appearance: none;

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
        {editorPageStore.getShapes().map((shape) => (
          <ShapeThumbnailBtn
            onClick={() => {
              editorPageStore.shape = shape
            }}
            active={shape.id === editorPageStore.shape.id}
            thumbnailSrc={shape.url}
          />
        ))}
      </>
    )
  }
)
