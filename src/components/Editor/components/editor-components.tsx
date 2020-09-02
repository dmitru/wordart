import { Box, Button } from '@chakra-ui/core'
import styled from '@emotion/styled'
import { BaseBtn } from 'components/shared/BaseBtn'
import 'lib/wordart/console-extensions'
import { darken, desaturate } from 'polished'
import 'utils/canvas-to-blob'

export const ExportButton = styled(Button)(
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  `
  height: 100px;
  min-width: 150px;
  margin-bottom: 16px;
  `
)

export const PageLayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`

export const EditorLayout = styled.div`
  display: flex;
  height: calc(100% - 60px);
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
`

export const TopToolbar = styled(Box)`
  position: relative;
  z-index: 1;
  box-shadow: 0 0 5px 0 #00000033;
  background: white;
  height: 60px;
`

export const TopNavWrapper = styled(Box)<{ theme: any }>`
  height: 60px;
  padding: 10px 20px;
  background: ${(p) => p.theme.colors.header.bg};
`

export const LeftWrapper = styled.div`
  user-select: none;
  height: 100%;
  background: white;
  max-width: 460px;
  min-width: 460px;
  flex: 1;
  z-index: 3;
  display: flex;
  flex-direction: column;
`

export const LeftBottomWrapper = styled.div<{ theme: any }>`
  flex: 1;
  display: flex;
  flex-direction: row;
  background: ${(p) => p.theme.colors.leftPanel.bg};
`

export const LeftPanel = styled(Box)`
  z-index: 20;
  box-shadow: 0 0 5px 0 #00000033;
  flex: 1;
  width: 350px;
`

export const SideNavbar = styled.div<{ theme: any; activeIndex?: number }>`
  /* background: ${(p) =>
    darken(0.1, desaturate(0.5, p.theme.colors.dark4))}; */
  /* border-bottom: 1px solid #cecece; */
  padding: 0;
  margin: 0;
  margin-top: 58px;
  padding-bottom: 20px;
  /* height: 50px; */
  display: flex;
  flex-direction: column;
  
  z-index: 4;

  position: relative;

  &::after {
    content: '';
    display: block;
    transition: 0.2s transform;
    ${(p) =>
      p.activeIndex != null
        ? `
        transform: translateY(${p.activeIndex * 75}px);
        background: ${p.theme.colors.leftPanel.bgActive};
        border-left: 8px solid ${p.theme.colors.primary}; 
        `
        : ''};
    top: 0;
    left: 0;
    position: absolute;
    height: 75px;
    width: 100%;
    z-index: 0;
  }
`

export const LeftNavbarBtn = styled(BaseBtn)<{ theme: any; active: boolean }>`
  min-width: 20%;
  font-weight: 500;
  height: 75px;
  padding: 0 20px 0 20px;
  text-transform: uppercase;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  border-radius: 0;
  color: ${(p) => p.theme.colors.leftPanel.textInactive};
  outline: none;
  border: none;
  border-radius: 0;
  z-index: 1;

  transition: 0.2s all;

  ${({ theme, active }) =>
    active &&
    `
    z-index: 1;
    color: white;
    box-shadow: 0 0 10px 0 #0004;
    background: transparent;
  `}

  .icon {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
  }

  /* transition: 0.2s background; */

  &:hover,
  &:focus {
    background: ${(p) => p.theme.colors.leftPanel.bgHover};
    ${({ theme, active }) =>
      active &&
      `
      background: ${theme.colors.leftPanel.bgActiveHover};
    `}
  }
`

export const LeftPanelContent = styled(Box)<{ theme: any; noScroll: boolean }>`
  flex: 1;
  height: ${(p) => (p.noScroll ? '100%' : 'calc(100vh - 60px)')};
  overflow: auto;
  background: white;

  &::-webkit-scrollbar {
    display: none; /* Chrome Safari */
  }
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
`

export const RightWrapper = styled.div`
  height: 100%;
  background: #eee;
  flex: 1;
  box-shadow: 0 0 5px 0 #00000033;
`

export const CanvasWrappper = styled.div`
  flex: 1;
  height: calc(100vh - 120px);
  width: calc(100vw - 460px);
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 5px 0 #00000033;
`

export const CanvasContainer = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
`

export const Canvas = styled.canvas`
  position: absolute !important;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
`

export type TargetTab = 'shape' | 'bg'
export type LeftPanelTab =
  | 'shapes'
  | 'words'
  | 'fonts'
  | 'symbols'
  | 'colors'
  | 'layout'
export const leftPanelTabs: LeftPanelTab[] = [
  'shapes',
  'colors',
  'layout',
  'words',
  'fonts',
  'symbols',
]
