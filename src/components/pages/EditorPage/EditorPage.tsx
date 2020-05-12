import React, { useRef, useState, useEffect } from 'react'
import styled from '@emotion/styled'
import 'lib/wordart/console-extensions'
import { Shapes } from '@styled-icons/fa-solid/Shapes'
import { TextFields } from '@styled-icons/material/TextFields'
import { Face } from '@styled-icons/material/Face'
import { ColorPalette } from '@styled-icons/evaicons-solid/ColorPalette'
import { LayoutMasonry } from '@styled-icons/remix-fill/LayoutMasonry'
import { observer } from 'mobx-react'
import { LeftPanelShapesTab } from 'components/pages/EditorPage/components/LeftPanelShapesTab'
import { useStore } from 'root-store'
import { LeftPanelWordsTab } from 'components/pages/EditorPage/components/LeftPanelWordsTab'
import { Dimensions } from 'lib/wordart/canvas-utils'
import { LeftPanelColorsTab } from 'components/pages/EditorPage/components/LeftPanelColorsTab'
import { Button } from 'components/shared/Button'
import { Box } from 'components/shared/Box'
import { LeftPanelLayoutTab } from 'components/pages/EditorPage/components/LeftPanelLayoutTab'
import { darken, desaturate } from 'polished'
import { MagicWand } from '@styled-icons/boxicons-solid/MagicWand'
import { css } from '@emotion/react'
import { LeftPanelIconsTab } from 'components/pages/EditorPage/components/LeftPanelIconsTab'
import { BaseBtn } from 'components/shared/BaseBtn'
import { observable } from 'mobx'

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
  max-width: 440px;
  min-width: 440px;
  flex: 1;
  z-index: 3;
  display: flex;
  flex-direction: row;
  /* box-shadow: 0 0 5px 0 #00000033; */
`

export const FgBgTab = styled.div`
  z-index: 0;
  background: ${(p) => p.theme.colors.dark2};
  width: 100%;
  /* height: 50px; */
  display: flex;
  direction: row;
  /* margin-bottom: 10px; */
  /* border-bottom: 5px solid ${(p) => p.theme.colors.accent}; */
`

export const FbBgTabBtn = styled(BaseBtn)<{ active: boolean }>`
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
    background: linear-gradient(90deg,#80578e,#3b458c);
    z-index: 1;
    color: ${theme.colors.textLight};

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
`

const LeftNavbar = styled.div<{ activeIndex: number }>`
  /* background: ${(p) =>
    darken(0.1, desaturate(0.5, p.theme.colors.dark4))}; */
  background: #dedede;
  /* border-bottom: 1px solid #cecece; */
  padding: 0;
  margin: 0;
  /* height: 50px; */
  display: flex;
  flex-direction: column;
  
  z-index: 4;

  position: relative;

  &::after {
    content: '';
    display: block;
    transition: 0.2s transform;
    transform: translateY(${(p) => p.activeIndex * 70}px);
    top: 0;
    left: 0;
    position: absolute;
    height: 70px;
    width: 100%;
    z-index: 0;
    background: ${(p) => p.theme.colors.light};
    border-left: 8px solid ${(p) => p.theme.colors.primary}; 
  }
`

const LeftNavbarBtn = styled(BaseBtn)<{ active: boolean }>`
  min-width: 20%;
  font-weight: 500;
  height: 70px;
  padding: 0 20px 0 20px;
  text-transform: uppercase;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  /* background: ${(p) => p.theme.colors.light1}; */
  /* background: #dedede; */
  border-radius: 0;
  color: ${(p) => p.theme.colors.dark1};
  outline: none;
  /* border: 1px solid #cecece; */
  border: none;
  border-radius: 0;
  z-index: 1;

  transition: 0.2s all;

  ${({ theme, active }) =>
    active &&
    `
    z-index: 1;
    color: ${theme.colors.text};
    background: transparent;
    // transform: translateY(-3px);
    // border: 1px solid #cecece;
    // box-shadow: 0 0 2px 0 #00000033;
  `}

  .icon {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
  }

  /* transition: 0.2s background; */

  &:hover,
  &:focus {
    background: #0001;
    ${({ theme, active }) =>
      active &&
      `
      background: transparent;
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

const state = observable({
  leftTab: 'shapes' as LeftPanelTab,
  words: {
    targetTab: 'shape' as TargetTab,
  },
})

export type TargetTab = 'shape' | 'bg'
export type LeftPanelTab = 'shapes' | 'words' | 'symbols' | 'colors' | 'layout'
export const leftPanelTabs: LeftPanelTab[] = [
  'shapes',
  'words',
  'symbols',
  'colors',
  'layout',
]

export const EditorPage = observer(() => {
  const [canvasSize] = useState<Dimensions>({ w: 900, h: 900 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { editorPageStore: store } = useStore()

  useEffect(() => {
    console.log('useEffect: editorPageStore.state', store.state)
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
          <LeftNavbar
            activeIndex={leftPanelTabs.findIndex((s) => s === state.leftTab)}
          >
            {/* <LeftNavbarBtn
              onClick={() => {
                editorPagestate.leftTab = ('templates')
              }}
              active={editorPageStore.activeLeftTab === 'templates'}
            >
              <Rocket className="icon" />
              Templates
            </LeftNavbarBtn> */}
            <LeftNavbarBtn
              onClick={() => {
                state.leftTab = 'shapes'
              }}
              active={state.leftTab === 'shapes'}
            >
              <Shapes className="icon" />
              Shape
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                state.leftTab = 'words'
              }}
              active={state.leftTab === 'words'}
            >
              <TextFields className="icon" />
              Words
            </LeftNavbarBtn>
            <LeftNavbarBtn
              onClick={() => {
                state.leftTab = 'symbols'
              }}
              active={state.leftTab === 'symbols'}
            >
              <Face className="icon" />
              Icons
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                state.leftTab = 'colors'
              }}
              active={state.leftTab === 'colors'}
            >
              <ColorPalette className="icon" />
              Colors
            </LeftNavbarBtn>

            <LeftNavbarBtn
              onClick={() => {
                state.leftTab = 'layout'
              }}
              active={state.leftTab === 'layout'}
            >
              <LayoutMasonry className="icon" />
              Layout
            </LeftNavbarBtn>
          </LeftNavbar>

          <LeftPanel id="left-panel-content">
            {state.leftTab === 'shapes' && <LeftPanelShapesTab />}
            {state.leftTab === 'words' && (
              <>
                {/* <FgBgTab>
                  <FbBgTabBtn
                    onClick={() => {state.words.targetTab = 'shape'}}
                    active={state.words.targetTab === 'shape'}
                  >
                    Shape
                  </FbBgTabBtn>
                  <FbBgTabBtn
                    onClick={() => {state.words.targetTab = 'bg'}}
                    active={state.words.targetTab === 'bg'}
                  >
                    Background
                  </FbBgTabBtn>
                </FgBgTab> */}
                <LeftPanelWordsTab />
              </>
            )}
            {state.leftTab === 'symbols' && <LeftPanelIconsTab />}
            {state.leftTab === 'colors' && <LeftPanelColorsTab />}

            {state.leftTab === 'layout' && <LeftPanelLayoutTab />}
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
                store.editor?.generateShapeItems({
                  style: store.styles.shape,
                })
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
