import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { ChromePicker } from 'react-color'
import { runInAction } from 'mobx'
import chroma from 'chroma-js'

export type LeftPanelStyleTabProps = {}

export const LeftPanelStyleTab: React.FC<LeftPanelStyleTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    return (
      <>
        <div>
          BG:
          <ChromePicker
            color={editorPageStore.bgColor}
            onChange={(color) => {
              if (!editorPageStore) {
                return
              }
              runInAction(() => {
                const hex = chroma(
                  color.rgb.r,
                  color.rgb.g,
                  color.rgb.b,
                  color.rgb.a || 1
                ).hex()

                editorPageStore.bgColor = hex
                if (editorPageStore.editor) {
                  editorPageStore.editor.setBackgroundColor(hex)
                }
              })
            }}
          />
        </div>

        <div>
          Shape:
          <ChromePicker
            color={editorPageStore.bgShapeColor}
            onChange={(color) => {
              if (!editorPageStore) {
                return
              }
              runInAction(() => {
                const hex = chroma(
                  color.rgb.r,
                  color.rgb.g,
                  color.rgb.b,
                  color.rgb.a || 1
                ).hex()

                editorPageStore.bgShapeColor = hex
                if (editorPageStore.editor) {
                  editorPageStore.editor.setBgShapeColor(hex)
                }
              })
            }}
          />
        </div>

        <div>
          Items:
          <ChromePicker
            color={editorPageStore.itemsColor}
            onChangeComplete={(color) => {
              if (!editorPageStore) {
                return
              }
              runInAction(() => {
                editorPageStore.itemsColor = color.hex
              })
              editorPageStore.editor?.generateAndRenderAll()
            }}
          />
        </div>
      </>
    )
  }
)
