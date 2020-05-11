import React, { useRef, useState, useEffect } from 'react'
import { Layout } from 'components/layout'
import styled from '@emotion/styled'
import 'lib/wordart/console-extensions'
import { Settings } from '@styled-icons/material/Settings'
import { HeartSquare } from '@styled-icons/boxicons-solid/HeartSquare'
import { Heart } from '@styled-icons/boxicons-solid/Heart'
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
import { darken, lighten, desaturate } from 'polished'
import { MagicWand } from '@styled-icons/boxicons-solid/MagicWand'
import { css } from '@emotion/react'
import { LeftPanelIconsTab } from 'components/pages/EditorPage/components/LeftPanelIconsTab'
import { BaseBtn } from 'components/shared/BaseBtn'
import Headroom from 'react-headroom'

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
  /* background: linear-gradient(90deg, #21c5be, #697af5); */
  background: linear-gradient(90deg, #80578e, #3b458c);
  color: white;
`

const LeftWrapper = styled.div`
  height: 100%;
  background: white;
  max-width: 350px;
  min-width: 350px;
  flex: 1;
  z-index: 3;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 5px 0 #00000033;
`

const LeftNavbarTop = styled.div`
  z-index: 0;
  background: ${(p) => p.theme.colors.dark2};
  width: 100%;
  /* height: 50px; */
  display: flex;
  direction: row;
  background: linear-gradient(90deg,#80578e,#3b458c);
  /* margin-bottom: 10px; */
  /* border-bottom: 5px solid ${(p) => p.theme.colors.accent}; */
`

const LeftNavbarTopBtn = styled(BaseBtn)<{ active: boolean }>`
  height: 40px;
  flex: 1;
  font-weight: 500;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  /* text-transform: uppercase; */

  background: transparent;
  color: ${(p) => p.theme.colors.textLight};
  border-radius: 0;
  outline: none;
  border: none;

  border-top: 5px solid transparent;
  padding-bottom: 3px;
  transition: 0.2s all;

  ${({ theme, active }) =>
    active &&
    `
    // font-weight: 500;
    background: #f3f3f3;
    z-index: 1;
    color: ${theme.colors.text};
    box-shadow: 0 0 2px 0 #00000033;
    border-top: 5px solid ${theme.colors.accent};
  `}

  position: relative;
  z-index: 0;

  .icon {
    /* display: none; */
    width: 20px;
    height: 20px;
    /* margin-bottom: 4px; */
  }

  /* transition: 0.2s background; */

  &:hover,
  &:focus {
    background: #0003;
    ${({ theme, active }) =>
      active &&
      `
      background: #f3f3f3;
    // color: ${theme.colors.textLight};
    `}
  }
`

const LeftNavbar = styled.div`
  /* background: ${(p) =>
    darken(0.1, desaturate(0.5, p.theme.colors.dark4))}; */
  background: #f3f3f3;
  border-bottom: 1px solid #cecece;
  padding: 0 10px;
  width: 100%;
  /* height: 50px; */
  display: flex;
  direction: row;
  
  z-index: 1;
`

const LeftNavbarBtn = styled(BaseBtn)<{ active: boolean }>`
  background: white;
  min-width: 20%;
  font-weight: 500;
  height: 60px;
  padding-top: 8px;
  padding-bottom: 5px;
  top: 10px;
  text-transform: uppercase;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  /* background: ${(p) => p.theme.colors.light1}; */
  background: #dedede;
  border-radius: 0;
  color: ${(p) => p.theme.colors.dark1};
  outline: none;
  /* border: 1px solid #cecece; */
  border: none;
  border-radius: 0;
  z-index: 0;
  border-bottom: 10px solid transparent;

  transition: 0.2s all;

  ${({ theme, active }) =>
    active &&
    `
    z-index: 1;
    background: ${theme.colors.light};
    color: ${theme.colors.text};
    transform: translateY(-3px);
    border: 1px solid #cecece;
    border-bottom: 10px solid ${theme.colors.accent};
    // box-shadow: 0 0 2px 0 #00000033;
  `}

  .icon {
    width: 18px;
    height: 18px;
    margin-bottom: 2px;
  }

  /* transition: 0.2s background; */

  &:hover,
  &:focus {
    background: ${(p) => darken(0.1, '#ddd')};
    ${({ theme, active }) =>
      active &&
      `
    background: ${darken(0.01, theme.colors.light)};
    color: ${theme.colors.text};
    `}
  }
`

const LeftPanel = styled.div`
  flex: 1;
  padding: 20px;
  height: 100%;
  overflow: auto;
  background: ${(p) => p.theme.colors.light};
  z-index: 2;
  box-shadow: 0 0 2px 0 #00000033;
`

const RightWrapper = styled.div`
  height: 100%;
  background: #eee;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 5px 0 #00000033;
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
      <TopNavWrapper alignItems="center" display="flex"></TopNavWrapper>

      <EditorLayout>
        <LeftWrapper>
          <LeftNavbarTop>
            <LeftNavbarTopBtn
              onClick={() => (store.activeLeftTab = 'foreground')}
              active={store.activeLeftTab === 'foreground'}
            >
              {/* <Heart className="icon" /> */}
              Foreground
            </LeftNavbarTopBtn>
            <LeftNavbarTopBtn
              onClick={() => (store.activeLeftTab = 'background')}
              active={store.activeLeftTab === 'background'}
            >
              {/* <HeartSquare className="icon" /> */}
              Background
            </LeftNavbarTopBtn>
            <LeftNavbarTopBtn
              onClick={() => (store.activeLeftTab = 'colors')}
              active={store.activeLeftTab === 'colors'}
            >
              {/* <ColorPalette className="icon" /> */}
              Colors
            </LeftNavbarTopBtn>
            <LeftNavbarTopBtn
              onClick={() => (store.activeLeftTab = 'settings')}
              active={store.activeLeftTab === 'settings'}
            >
              <Settings className="icon" />
              {/* Settings */}
            </LeftNavbarTopBtn>
          </LeftNavbarTop>
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
              active={store.activeLeftSubtab === 'shapes'}
            >
              <Shapes className="icon" />
              Shape
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                store.setLeftPanelTab('colors')
              }}
              active={store.activeLeftSubtab === 'colors'}
            >
              <ColorPalette className="icon" />
              Colors
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                store.setLeftPanelTab('words')
              }}
              active={store.activeLeftSubtab === 'words'}
            >
              <TextFields className="icon" />
              Words
            </LeftNavbarBtn>
            <LeftNavbarBtn
              onClick={() => {
                store.setLeftPanelTab('symbols')
              }}
              active={store.activeLeftSubtab === 'symbols'}
            >
              <Face className="icon" />
              Icons
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                store.setLeftPanelTab('layout')
              }}
              active={store.activeLeftSubtab === 'layout'}
            >
              <LayoutMasonry className="icon" />
              Layout
            </LeftNavbarBtn>
          </LeftNavbar>

          <LeftPanel id="left-panel-content">
            {store.activeLeftSubtab === 'shapes' && <LeftPanelShapesTab />}
            {store.activeLeftSubtab === 'words' && (
              <LeftPanelWordsTab type="shape" />
            )}
            {store.activeLeftSubtab === 'symbols' && (
              <LeftPanelIconsTab type="shape" />
            )}
            {store.activeLeftSubtab === 'colors' && <LeftPanelColorsTab />}

            {store.activeLeftSubtab === 'layout' && (
              <LeftPanelLayoutTab type="shape" />
            )}
          </LeftPanel>
        </LeftWrapper>

        <RightWrapper>
          <TopToolbar
            display="flex"
            alignItems="center"
            bg="light"
            p={2}
            pl={3}
          >
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
