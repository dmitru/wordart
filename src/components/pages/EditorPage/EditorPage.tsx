import React, { useRef, useState, useEffect } from 'react'
import { Layout } from 'components/layout'
import styled from '@emotion/styled'
import 'lib/wordart/console-extensions'
import { Template } from '@styled-icons/heroicons-solid/Template'
import { Rocket } from '@styled-icons/entypo/Rocket'
import { Text } from '@styled-icons/evaicons-solid/Text'
import { Shapes } from '@styled-icons/fa-solid/Shapes'
import { ColorLens } from '@styled-icons/material-rounded/ColorLens'
import { observer } from 'mobx-react'
import { LeftPanelShapesTab } from 'components/pages/EditorPage/components/LeftPanelShapesTab'
import { useStore } from 'root-store'
import { BaseBtn } from 'components/shared/BaseBtn'
import { LeftPanelWordsTab } from 'components/pages/EditorPage/components/LeftPanelWordsTab'
import { Dimensions } from 'lib/wordart/canvas-utils'
import { LeftPanelStyleTab } from 'components/pages/EditorPage/components/LeftPanelStyleTab'
import { observable, runInAction } from 'mobx'
import { Button } from 'components/shared/Button'
import { Box } from 'components/shared/Box'

const PageLayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`

const EditorLayout = styled.div`
  display: flex;
  background: pink;
  height: calc(100% - 50px);
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
`

const TopNavWrapper = styled.div`
  height: 50px;
  padding: 20px;
  background: #999;
`

const LeftWrapper = styled.div`
  height: 100%;
  background: gray;
  max-width: 380px;
  flex: 1;
  display: flex;
  flex-direction: row;
`

const LeftNavbar = styled.div`
  background: darkgray;
  width: 65px;
  height: 100%;
`

const LeftNavbarBtn = styled(BaseBtn)<{ active: boolean }>`
  background: white;
  width: 100%;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  background: #eee;
  ${({ active }) => active && `background: #fff;`}

  color: black;

  .icon {
    width: 20px;
    height: 20px;
    margin-bottom: 4px;
  }

  &:hover,
  &:focus {
    background: #ddd;
    ${({ active }) => active && `background: #fff;`}
  }
`

const LeftPanel = styled.div`
  background: white;
  flex: 1;
  padding: 20px;
  height: 100%;
  overflow: auto;
`

const RightWrapper = styled.div`
  height: 100%;
  background: #eee;
  flex: 1;
  display: flex;
  flex-direction: column;
`

const TopToolbar = styled.div`
  background: white;
  height: 50px;
`

const CanvasWrappper = styled.div`
  flex: 1;
  height: calc(100vh - 100px);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Canvas = styled.canvas`
  /* width: 100%; */
  height: 100%;
  /* max-height: 100%; */
  margin: auto;
`

const VisualizeBtn = styled(BaseBtn)`
  background: magenta;
  color: white;
  padding: 4px 10px;
  margin-left: 20px;
  font-size: 15px;
`

const state = observable({
  isVisualizing: false,
})

export const EditorPage = observer(() => {
  const [canvasSize, setCanvasSize] = useState<Dimensions>({ w: 900, h: 900 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { editorPageStore } = useStore()

  useEffect(() => {
    console.log('editorPageStore.state', editorPageStore.state)
    if (canvasRef.current && editorPageStore.state !== 'initialized') {
      editorPageStore.initEditor({
        canvas: canvasRef.current,
        store: editorPageStore,
      })
    }
  }, [canvasRef.current])

  return (
    <PageLayoutWrapper>
      <TopNavWrapper>HEADER</TopNavWrapper>

      <EditorLayout>
        <LeftWrapper>
          <LeftNavbar>
            {/* <LeftNavbarBtn
              onClick={() => {
                editorPageStore.setLeftPanelTab('templates')
              }}
              active={editorPageStore.activeLeftTab === 'templates'}
            >
              <Rocket className="icon" />
              Templates
            </LeftNavbarBtn> */}
            <LeftNavbarBtn
              onClick={() => {
                editorPageStore.setLeftPanelTab('shapes')
              }}
              active={editorPageStore.activeLeftTab === 'shapes'}
            >
              <Shapes className="icon" />
              Shape
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                editorPageStore.setLeftPanelTab('style:shape')
              }}
              active={editorPageStore.activeLeftTab === 'style:shape'}
            >
              Style: Shape
            </LeftNavbarBtn>
            <LeftNavbarBtn
              onClick={() => {
                editorPageStore.setLeftPanelTab('style:bg')
              }}
              active={editorPageStore.activeLeftTab === 'style:bg'}
            >
              Style: Background
            </LeftNavbarBtn>
          </LeftNavbar>

          <LeftPanel>
            {editorPageStore.activeLeftTab === 'shapes' && (
              <LeftPanelShapesTab />
            )}
            <div>
              <LeftPanelStyleTab
                type={
                  editorPageStore.activeLeftTab === 'style:bg'
                    ? 'background'
                    : 'shape'
                }
              />
            </div>
            <div>
              <LeftPanelWordsTab
                type={
                  editorPageStore.activeLeftTab === 'style:bg'
                    ? 'background'
                    : 'shape'
                }
              />
            </div>
          </LeftPanel>
        </LeftWrapper>

        <RightWrapper>
          <Box display="flex" alignItems="center" bg="light" p={2} height={50}>
            <Button
              primary
              // disabled={state.isVisualizing}
              onClick={async () => {
                state.isVisualizing = true
                await Promise.all([
                  editorPageStore.editor?.generateItems('shape'),
                  editorPageStore.editor?.generateItems('background'),
                ])
                state.isVisualizing = false
              }}
            >
              {state.isVisualizing ? 'Visualizing...' : 'Visualize'}
            </Button>

            <Button ml={3}>Undo</Button>
            <Button ml={1}>Redo</Button>
          </Box>
          <CanvasWrappper>
            <Canvas
              width={canvasSize.w}
              height={canvasSize.h}
              ref={canvasRef}
              id="scene"
            />
          </CanvasWrappper>
        </RightWrapper>
      </EditorLayout>
    </PageLayoutWrapper>
  )
})
