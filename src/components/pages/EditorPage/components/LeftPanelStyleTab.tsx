import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { ChromePicker } from 'react-color'
import { runInAction } from 'mobx'
import chroma from 'chroma-js'

export type LeftPanelStyleTabProps = {}

export const LeftPanelStyleTab: React.FC<LeftPanelStyleTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    const style =
      editorPageStore.activeStyleTab === 'shape'
        ? editorPageStore.shapeStyle
        : editorPageStore.backgroundStyle
    return (
      <>
        <div>
          BG:
          <ChromePicker
            color={style.bgColor}
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

                style.bgColor = hex
                if (editorPageStore.editor) {
                  if (editorPageStore.activeStyleTab === 'shape') {
                    editorPageStore.editor.setBgShapeColor(hex)
                  } else {
                    editorPageStore.editor.setBackgroundColor(hex)
                  }
                }
              })
            }}
          />
        </div>

        <div>
          Items:
          <ChromePicker
            color={style.itemsColor}
            onChangeComplete={(color) => {
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

                style.itemsColor = hex
                if (editorPageStore.editor) {
                  if (editorPageStore.activeStyleTab === 'shape') {
                    editorPageStore.editor.setShapeItemsColor(hex)
                  } else {
                    editorPageStore.editor.setBgItemsColor(hex)
                  }
                }
              })
              // editorPageStore.editor?.generateAndRenderAll()
            }}
          />
        </div>
      </>
    )
  }
)
