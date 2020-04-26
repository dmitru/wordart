import React, { useRef } from 'react'
import { Layout } from 'components/layout'
import styled from 'styled-components'
import 'lib/wordart/console-extensions'
import { Template } from '@styled-icons/heroicons-solid/Template'
import { Rocket } from '@styled-icons/entypo/Rocket'
import { Text } from '@styled-icons/evaicons-solid/Text'
import { Shapes } from '@styled-icons/fa-solid/Shapes'
import { ColorLens } from '@styled-icons/material-rounded/ColorLens'
import { observer } from 'mobx-react'
import { observable } from 'mobx'
import { LeftPanelShapesTab } from 'components/pages/EditorPage/components/LeftPanelShapesTab'
import { useStore } from 'root-store'

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
  max-width: 350px;
  flex: 1;
  display: flex;
  flex-direction: row;
`

const LeftNavbar = styled.div`
  background: darkgray;
  width: 65px;
  height: 100%;
`

const LeftNavbarBtn = styled.button<{ active: boolean }>`
  outline: none;
  background: white;
  width: 100%;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  cursor: pointer;
  background: #eee;
  ${({ active }) => active && `background: #fff;`}
  -webkit-appearance: none;

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
  background: lightgray;
  flex: 1;
  padding: 20px;
  height: 100%;
`

const RightWrapper = styled.div`
  height: 100%;
  background: #eee;
  flex: 1;
  display: flex;
  padding: 20px;
`

const Canvas = styled.canvas`
  width: 100%;
  height: auto;
  max-height: 100%;
  margin: auto;
  border: 1px solid black;
  background: white;
`

export const EditorPage = observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { editorPageStore } = useStore()

  return (
    <PageLayoutWrapper>
      <TopNavWrapper>HEADER</TopNavWrapper>
      <EditorLayout>
        <LeftWrapper>
          <LeftNavbar>
            <LeftNavbarBtn
              onClick={() => {
                editorPageStore.activeLeftTab = 'templates'
              }}
              active={editorPageStore.activeLeftTab === 'templates'}
            >
              <Rocket className="icon" />
              Templates
            </LeftNavbarBtn>
            <LeftNavbarBtn
              onClick={() => {
                editorPageStore.activeLeftTab = 'shapes'
              }}
              active={editorPageStore.activeLeftTab === 'shapes'}
            >
              <Shapes className="icon" />
              Shape
            </LeftNavbarBtn>
            <LeftNavbarBtn
              onClick={() => {
                editorPageStore.activeLeftTab = 'words'
              }}
              active={editorPageStore.activeLeftTab === 'words'}
            >
              <Text className="icon" />
              Words
            </LeftNavbarBtn>
            <LeftNavbarBtn
              onClick={() => {
                editorPageStore.activeLeftTab = 'style'
              }}
              active={editorPageStore.activeLeftTab === 'style'}
            >
              <ColorLens className="icon" />
              Style
            </LeftNavbarBtn>
          </LeftNavbar>

          <LeftPanel>
            {editorPageStore.activeLeftTab === 'shapes' && (
              <LeftPanelShapesTab />
            )}
          </LeftPanel>
        </LeftWrapper>

        <RightWrapper>
          <Canvas
            width={1200 / 1.5}
            height={1040 / 1.5}
            ref={canvasRef}
            id="scene"
          />
        </RightWrapper>
      </EditorLayout>
    </PageLayoutWrapper>
  )
})
