import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import { useCallback, useState } from 'react'
import {
  ShapeSelector,
  ShapeThumbnailBtn,
} from 'components/pages/EditorPage/components/ShapeSelector'
import { observable } from 'mobx'
import { Modal } from 'components/shared/Modal'
import { Slider } from 'components/shared/Slider'
import { Box } from 'components/shared/Box'
import { css } from '@emotion/react'
import { Checkbox } from 'components/shared/Checkbox'
import { ColorPicker } from 'components/shared/ColorPicker'
import chroma from 'chroma-js'
import { Button } from 'components/shared/Button'
import { Label } from 'components/pages/EditorPage/components/shared'
import { TextInput } from 'components/shared/TextInput'
import { Search } from '@styled-icons/material/Search'
import { SearchInput } from 'components/shared/SearchInput'

export type LeftPanelShapesTabProps = {}

const state = observable({
  showCustomize: false,
  isSelectingShape: false,
})

export const LeftPanelShapesTab: React.FC<LeftPanelShapesTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    const shapeStyle = editorPageStore.shapeStyle

    const { shapeStyle: style } = editorPageStore

    const visualize = useCallback(() => {
      editorPageStore.editor?.generateItems('shape')
    }, [])

    const [query, setQuery] = useState('')
    const matchingShapes = editorPageStore
      .getAvailableShapes()
      .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))

    return (
      <>
        <Box>
          <>
            <Box display="flex" alignItems="flex-start" mb={3}>
              <ShapeThumbnailBtn
                css={css`
                  width: 120px;
                  height: 120px;
                  min-width: 120px;

                  img {
                    width: 115px;
                    height: 115px;
                  }
                `}
                onClick={() => {
                  state.isSelectingShape = true
                }}
                backgroundColor="white"
                active={false}
                shape={editorPageStore.getSelectedShape()}
              />
              <Box
                flex={1}
                ml={3}
                display="flex"
                flexDirection="column"
                alignItems="flex-end"
                justifyContent="flex-end"
              >
                <Box flex={1} width={1} mb={2}>
                  <Slider
                    label="Opacity"
                    value={100 * style.bgOpacity}
                    onChange={(value) => {
                      style.bgOpacity = value / 100
                    }}
                    onAfterChange={(value) => {
                      editorPageStore.editor?.setShapeFillOpacity(value / 100)
                    }}
                    min={0}
                    max={100}
                    step={1}
                  />
                </Box>

                <Button
                  px={2}
                  py={1}
                  outline
                  // secondary
                  onClick={() => {
                    state.showCustomize = true
                  }}
                >
                  Customize
                </Button>
              </Box>
            </Box>

            <Box>
              <Box>
                <SearchInput
                  placeholder="Search shapes..."
                  value={query}
                  onChange={setQuery}
                />
              </Box>

              <ShapeSelector
                height="calc(100vh - 380px)"
                overflowY="auto"
                shapes={matchingShapes}
                onSelected={(shape) => {
                  editorPageStore.selectShape(shape.id)
                }}
                selectedShapeId={editorPageStore.getSelectedShape().id}
              />
            </Box>

            <Modal
              isOpen={state.showCustomize}
              onRequestClose={() => {
                state.showCustomize = false
              }}
            >
              <Box
                css={css`
                  min-width: 300px;
                `}
              >
                <Slider
                  label="Edges"
                  min={0}
                  max={100}
                  step={1}
                  value={shapeStyle.processing.edges.amount}
                  onAfterChange={(value) => {
                    shapeStyle.processing.edges.amount = value
                    visualize()
                  }}
                />

                <Checkbox
                  label="Invert"
                  id="invert"
                  value={shapeStyle.processing.invert.enabled}
                  onChange={(value) => {
                    shapeStyle.processing.invert.enabled = value
                    visualize()
                  }}
                />

                {shapeStyle.processing.invert.enabled && (
                  <ColorPicker
                    value={shapeStyle.processing.invert.fillColor}
                    onChange={(color) => {
                      shapeStyle.processing.invert.fillColor = chroma(
                        color
                      ).hex()
                      visualize()
                    }}
                  />
                )}
              </Box>
            </Modal>
          </>
        </Box>
      </>
    )
  }
)
