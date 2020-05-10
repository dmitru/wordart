import React, { useRef, useState, useEffect } from 'react'
import { Layout } from 'components/layout'
import styled from '@emotion/styled'
import 'lib/wordart/console-extensions'
import { Template } from '@styled-icons/heroicons-solid/Template'
import { Rocket } from '@styled-icons/entypo/Rocket'
import { Text } from '@styled-icons/evaicons-solid/Text'
import { Shapes } from '@styled-icons/fa-solid/Shapes'
import { TextFields } from '@styled-icons/material/TextFields'
import { Face } from '@styled-icons/material/Face'
import { ColorPalette } from '@styled-icons/evaicons-solid/ColorPalette'
import { LayoutMasonry } from '@styled-icons/remix-fill/LayoutMasonry'
import { ColorLens } from '@styled-icons/material-rounded/ColorLens'
import { observer } from 'mobx-react'
import { LeftPanelShapesTab } from 'components/pages/EditorPage/components/LeftPanelShapesTab'
import { useStore } from 'root-store'
import { LeftPanelWordsTab } from 'components/pages/EditorPage/components/LeftPanelWordsTab'
import { Dimensions } from 'lib/wordart/canvas-utils'
import { LeftPanelColorsTab } from 'components/pages/EditorPage/components/LeftPanelColorsTab'
import { observable, runInAction } from 'mobx'
import { Button } from 'components/shared/Button'
import { Box } from 'components/shared/Box'
import { LeftPanelLayoutTab } from 'components/pages/EditorPage/components/LeftPanelLayoutTab'
import { darken, lighten } from 'polished'
import { MagicWand } from '@styled-icons/boxicons-solid/MagicWand'
import { css } from '@emotion/react'
import { LeftPanelIconsTab } from 'components/pages/EditorPage/components/LeftPanelIconsTab'

const PageLayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`

const EditorLayout = styled.div`
  display: flex;
  height: calc(100% - 50px);
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
`

const TopToolbar = styled(Box)`
  z-index: 1;
  box-shadow: 0 0 5px 0 #00000033;
`

const TopNavWrapper = styled(Box)`
  height: 50px;
  padding: 20px;
  font-size: 1.5em;
  font-weight: 400;
  background: linear-gradient(90deg, #21c5be, #697af5);
  color: white;
`

const LeftWrapper = styled.div`
  height: 100%;
  background: white;
  max-width: 380px;
  flex: 1;
  display: flex;
  flex-direction: row;
`

const LeftNavbar = styled.div`
  padding-top: 20px;
  background: ${(p) => p.theme.colors.light1};
  width: 85px;
  height: 100%;
  z-index: 3;
`

const LeftNavbarBtn = styled(Button)<{ active: boolean }>`
  background: white;
  width: 100%;
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  background: ${(p) => p.theme.colors.light1};
  border-radius: 0;
  color: ${(p) => p.theme.colors.dark3};
  outline: none;
  border: none;

  ${({ theme, active }) =>
    active &&
    `
    background: ${theme.colors.light};
    color: ${theme.colors.text};
  `}

  .icon {
    width: 20px;
    height: 20px;
    margin-bottom: 4px;
  }

  transition: 0.2s background;

  &:hover,
  &:focus {
    background: ${(p) => lighten(0.1, p.theme.colors.light1)};
    ${({ theme, active }) =>
      active &&
      `
    background: ${darken(0.01, theme.colors.light)};
    color: ${theme.colors.text};
    `}
  }
`

const LeftPanel = styled.div`
  background: white;
  flex: 1;
  padding: 20px;
  height: 100%;
  overflow: auto;
  width: 270px;
  box-shadow: 0 0 5px 0 #00000033;
  z-index: 2;
`

const RightWrapper = styled.div`
  height: 100%;
  background: #eee;
  flex: 1;
  display: flex;
  flex-direction: column;
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

export const EditorPage = observer(() => {
  const [canvasSize, setCanvasSize] = useState<Dimensions>({ w: 900, h: 900 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { editorPageStore: store } = useStore()

  useEffect(() => {
    console.log('editorPageStore.state', store.state)
    if (canvasRef.current && store.state !== 'initialized') {
      store.initEditor({
        canvas: canvasRef.current,
        store: store,
      })
    }
  }, [canvasRef.current])

  return (
    <PageLayoutWrapper>
      <TopNavWrapper alignItems="center" display="flex">
        Wordcloudy
      </TopNavWrapper>

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
                store.setLeftPanelTab('shapes')
              }}
              active={store.activeLeftTab === 'shapes'}
            >
              <Shapes className="icon" />
              Shape
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                store.setLeftPanelTab('words')
              }}
              active={store.activeLeftTab === 'words'}
            >
              <TextFields className="icon" />
              Words
            </LeftNavbarBtn>
            <LeftNavbarBtn
              onClick={() => {
                store.setLeftPanelTab('symbols')
              }}
              active={store.activeLeftTab === 'symbols'}
            >
              <Face className="icon" />
              Icons
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                store.setLeftPanelTab('layout')
              }}
              active={store.activeLeftTab === 'layout'}
            >
              <LayoutMasonry className="icon" />
              Layout
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                store.setLeftPanelTab('colors')
              }}
              active={store.activeLeftTab === 'colors'}
            >
              <ColorPalette className="icon" />
              Colors
            </LeftNavbarBtn>
          </LeftNavbar>

          <LeftPanel>
            {store.activeLeftTab === 'shapes' && <LeftPanelShapesTab />}
            {store.activeLeftTab === 'words' && (
              <LeftPanelWordsTab type="shape" />
            )}
            {store.activeLeftTab === 'symbols' && (
              <LeftPanelIconsTab type="shape" />
            )}
            {store.activeLeftTab === 'colors' && <LeftPanelColorsTab />}

            {store.activeLeftTab === 'layout' && (
              <LeftPanelLayoutTab type="shape" />
            )}
          </LeftPanel>
        </LeftWrapper>

        <RightWrapper>
          <TopToolbar display="flex" alignItems="center" bg="light" p={2}>
            <Button
              css={css`
                width: 128px;
              `}
              accent
              disabled={store.isVisualizing}
              onClick={() => {
                store.editor?.generateItems('shape')
              }}
            >
              {!store.isVisualizing && (
                <MagicWand
                  size={24}
                  css={css`
                    margin-right: 4px;
                  `}
                />
              )}
              {store.isVisualizing
                ? `Working: ${Math.round(
                    (store.visualizingProgress || 0) * 100
                  )}%`
                : 'Visualize'}
            </Button>

            <Button ml={3}>Undo</Button>
            <Button ml={1}>Redo</Button>
          </TopToolbar>
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
