import {
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useToast,
  Text,
  Box,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { MagicWand } from '@styled-icons/boxicons-solid/MagicWand'
import { ColorPalette } from '@styled-icons/evaicons-solid/ColorPalette'
import { Shapes } from '@styled-icons/fa-solid/Shapes'
import { Font } from '@styled-icons/icomoon/Font'
import { Face } from '@styled-icons/material/Face'
import { TextFields } from '@styled-icons/material/TextFields'
import { LayoutMasonry } from '@styled-icons/remix-fill/LayoutMasonry'
import { LeftPanelColorsTab } from 'components/Editor/components/LeftPanelColorsTab'
import { LeftPanelFontsTab } from 'components/Editor/components/LeftPanelFontsTab'
import { LeftPanelIconsTab } from 'components/Editor/components/LeftPanelIconsTab'
import { LeftPanelLayoutTab } from 'components/Editor/components/LeftPanelLayoutTab'
import { LeftPanelShapesTab } from 'components/Editor/components/LeftPanelShapesTab'
import { LeftPanelWordsTab } from 'components/Editor/components/LeftPanelWordsTab'
import {
  pageSizePresets,
  EditorStoreInitParams,
} from 'components/Editor/editor-store'
import { EditorInitParams } from 'components/Editor/lib/editor'
import { BaseBtn } from 'components/shared/BaseBtn'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import { Tooltip } from 'components/shared/Tooltip'
import { Dimensions } from 'lib/wordart/canvas-utils'
import 'lib/wordart/console-extensions'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import Link from 'next/link'
import { darken, desaturate } from 'polished'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Api } from 'services/api/api'
import { WordcloudId } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { ColorPicker } from 'components/shared/ColorPicker'
import {
  mkShapeStyleConfFromOptions,
  mkBgStyleConfFromOptions,
} from 'components/Editor/style'

export type EditorComponentProps = {
  wordcloudId?: WordcloudId
}

export const EditorComponent: React.FC<EditorComponentProps> = observer(
  (props) => {
    const toast = useToast()
    const aspectRatio = 4 / 3
    const [canvasSize] = useState<Dimensions>({ w: 900 * aspectRatio, h: 900 })
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const canvasWrapperRef = useRef<HTMLDivElement>(null)
    const { editorPageStore: store, wordcloudsStore } = useStore()

    const isNew = props.wordcloudId == null

    const { authStore } = useStore()
    const router = useRouter()

    const [isSaving, setIsSaving] = useState(false)
    const handleSaveClick = useCallback(() => {
      const save = async () => {
        if (isSaving || !store.editor) {
          return
        }
        setIsSaving(true)
        const thumbnail = store.editor.canvas.toDataURL({
          multiplier: 0.25,
          format: 'jpeg',
          quality: 0.85,
        })
        const editorData = store.serialize()

        if (isNew) {
          const wordcloud = await wordcloudsStore.create({
            title: state.title,
            editorData,
            thumbnail,
          })
          router.push(Urls.editor._next, Urls.editor.edit(wordcloud.id), {
            shallow: true,
          })
        } else {
          await wordcloudsStore.save(props.wordcloudId!, {
            title: state.title,
            thumbnail,
            editorData,
          })
        }
        toast({
          title: 'Your work is saved',
          status: 'success',
          duration: 2000,
          position: 'bottom-right',
          isClosable: true,
        })
        setIsSaving(false)
      }

      save()
    }, [isSaving, props.wordcloudId])

    useEffect(() => {
      const init = async () => {
        if (
          authStore.hasInitialized &&
          canvasRef.current &&
          store.lifecycleState !== 'initialized'
        ) {
          const editorParams: EditorStoreInitParams = {
            canvas: canvasRef.current,
            canvasWrapperEl: canvasWrapperRef.current!,
            aspectRatio,
          }

          if (props.wordcloudId != null) {
            const wordcloud = wordcloudsStore.getById(props.wordcloudId)
            if (wordcloud) {
              state.title = wordcloud.title
            }
            const editorData = await Api.wordclouds.fetchEditorData(
              props.wordcloudId
            )

            editorParams.serialized = editorData
          } else {
            state.title = 'New wordart'
          }

          await store.initEditor(editorParams)

          // store.editor?.generateShapeItems({
          //   style: mkShapeStyleConfFromOptions(store.styleOptions.shape),
          // })
        }
      }

      init()
    }, [props.wordcloudId, authStore.hasInitialized, canvasRef.current])

    useEffect(() => {
      return store.destroyEditor
    }, [])

    if (!router || !authStore.hasInitialized) {
      return <SpinnerSplashScreen />
    }

    if (authStore.isLoggedIn !== true) {
      router.replace(Urls.login)
      return <SpinnerSplashScreen />
    }

    const hasItems = store.editor
      ? state.targetTab === 'bg'
        ? store.editor.items.bg.items.length > 0
        : store.editor.items.shape.items.length > 0
      : false

    const leftTab =
      state.targetTab === 'bg' ? state.leftTabBg : state.leftTabShape

    return (
      <PageLayoutWrapper>
        <TopNavWrapper alignItems="center" display="flex">
          <Link href={Urls.dashboard} passHref>
            <Button color="white" variant="ghost" leftIcon="chevron-left">
              Back
            </Button>
          </Link>

          <Menu>
            <MenuButton
              ml="4"
              color="white"
              as={Button}
              // @ts-ignore
              rightIcon="chevron-down"
              variant="ghost"
            >
              Menu
            </MenuButton>
            <MenuList zIndex={4}>
              <MenuItem
                onClick={() => {
                  state.leftPanelContext = 'resize'
                }}
              >
                Change page size...
              </MenuItem>
            </MenuList>
          </Menu>
          <Button
            ml="4"
            color="white"
            onClick={handleSaveClick}
            isLoading={isSaving}
            loadingText="Saving..."
            variant="ghost"
          >
            Save
          </Button>

          <Editable
            ml="4"
            value={state.title}
            onChange={(value) => {
              state.title = value
            }}
            placeholder="Enter name..."
            color="white"
            fontSize="xl"
            maxWidth="200px"
            flex={1}
          >
            <EditablePreview width="100%" />
            <EditableInput />
          </Editable>
        </TopNavWrapper>

        <EditorLayout>
          <LeftWrapper>
            <LeftBottomWrapper>
              <SideNavbar
                activeIndex={
                  state.targetTab === 'shape'
                    ? leftPanelShapeTabs.findIndex(
                        (s) => s === state.leftTabShape
                      )
                    : leftPanelBgTabs.findIndex((s) => s === state.leftTabBg)
                }
              >
                {state.targetTab !== 'bg' && (
                  <LeftNavbarBtn
                    onClick={() => {
                      state.leftTabShape = 'shapes'
                    }}
                    active={state.leftTabShape === 'shapes'}
                  >
                    <Shapes className="icon" />
                    Shape
                  </LeftNavbarBtn>
                )}

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTabBg = 'words'
                    state.leftTabShape = 'words'
                  }}
                  active={leftTab === 'words'}
                >
                  <TextFields className="icon" />
                  Words
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTabBg = 'fonts'
                    state.leftTabShape = 'fonts'
                  }}
                  active={leftTab === 'fonts'}
                >
                  <Font className="icon" />
                  Fonts
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTabBg = 'symbols'
                    state.leftTabShape = 'symbols'
                  }}
                  active={leftTab === 'symbols'}
                >
                  <Face className="icon" />
                  Icons
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTabBg = 'layout'
                    state.leftTabShape = 'layout'
                  }}
                  active={leftTab === 'layout'}
                >
                  <LayoutMasonry className="icon" />
                  Layout
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTabBg = 'colors'
                    state.leftTabShape = 'colors'
                  }}
                  active={leftTab === 'colors'}
                >
                  <ColorPalette className="icon" />
                  Colors
                </LeftNavbarBtn>
              </SideNavbar>

              <LeftPanel>
                <LeftPanelContent
                  id="left-panel-content"
                  px="3"
                  py="3"
                  noScroll={leftTab === 'shapes'}
                >
                  {store.lifecycleState === 'initialized' ? (
                    <>
                      {state.leftPanelContext === 'resize' && (
                        <Box>
                          <Heading size="md" mt="0" mb="3">
                            Page Size
                          </Heading>
                          {pageSizePresets.map((preset) => (
                            <Button
                              variantColor={
                                store.pageSize.kind === 'preset' &&
                                store.pageSize.preset.id === preset.id
                                  ? 'primary'
                                  : undefined
                              }
                              mr="2"
                              mb="3"
                              key={preset.id}
                              onClick={() => {
                                store.setPageSize({ kind: 'preset', preset })
                              }}
                            >
                              {preset.title}
                            </Button>
                          ))}
                          <Button
                            variantColor={
                              store.pageSize.kind === 'custom'
                                ? 'primary'
                                : undefined
                            }
                            mr="2"
                            mb="3"
                            onClick={() => {
                              store.setPageSize({
                                kind: 'custom',
                                height: 2,
                                width: 4,
                              })
                            }}
                          >
                            Custom
                          </Button>

                          <Box>
                            <Button
                              mt="4"
                              variantColor="green"
                              onClick={() => {
                                state.leftPanelContext = 'normal'
                              }}
                            >
                              Done
                            </Button>
                          </Box>
                        </Box>
                      )}

                      {state.leftPanelContext === 'normal' && (
                        <>
                          {leftTab === 'shapes' && <LeftPanelShapesTab />}
                          {leftTab === 'words' && (
                            <>
                              <LeftPanelWordsTab target={state.targetTab} />
                            </>
                          )}
                          {leftTab === 'fonts' && (
                            <>
                              <LeftPanelFontsTab target={state.targetTab} />
                            </>
                          )}
                          {leftTab === 'symbols' && (
                            <LeftPanelIconsTab target={state.targetTab} />
                          )}
                          {leftTab === 'colors' && (
                            <LeftPanelColorsTab target={state.targetTab} />
                          )}

                          {leftTab === 'layout' && (
                            <LeftPanelLayoutTab target={state.targetTab} />
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <Box>Loading...</Box>
                  )}
                </LeftPanelContent>
              </LeftPanel>
            </LeftBottomWrapper>
          </LeftWrapper>

          <RightWrapper>
            <TopToolbar
              display="flex"
              alignItems="center"
              bg="light"
              p="2"
              pl="3"
            >
              <Button
                css={css`
                  width: 128px;
                `}
                // accent
                // isDisabled={store.isVisualizing}
                variantColor="accent"
                loadingText={`${Math.round(
                  (store.visualizingProgress || 0) * 100
                )}%`}
                isLoading={store.isVisualizing}
                onClick={() => {
                  if (state.targetTab === 'shape') {
                    store.editor?.generateShapeItems({
                      style: mkShapeStyleConfFromOptions(
                        store.styleOptions.shape
                      ),
                    })
                  } else {
                    store.editor?.generateBgItems({
                      style: mkBgStyleConfFromOptions(store.styleOptions.bg),
                    })
                  }
                }}
              >
                <MagicWand
                  size={24}
                  css={css`
                    margin-right: 4px;
                  `}
                />
                Visualize
              </Button>

              <Tooltip label="Undo" aria-label="Undo" hasArrow zIndex={5}>
                <IconButton ml="3" icon="arrow-back" aria-label="Undo" />
              </Tooltip>
              <Tooltip label="Redo" aria-label="Redo" hasArrow zIndex={5}>
                <IconButton ml="1" icon="arrow-forward" aria-label="Redo" />
              </Tooltip>

              <Box mr="3" ml="3">
                {store.mode === 'view' && hasItems && (
                  <Button
                    css={css`
                      box-shadow: none !important;
                    `}
                    py="1"
                    onClick={() => {
                      store.enterEditItemsMode()
                    }}
                  >
                    Edit Items
                  </Button>
                )}
                {store.mode === 'view' && hasItems && (
                  <Button
                    css={css`
                      box-shadow: none !important;
                    `}
                    variant="ghost"
                    py="1"
                    onClick={() => {
                      store.editor?.clearItems(state.targetTab, true)
                    }}
                  >
                    Clear All
                  </Button>
                )}

                {store.mode === 'edit items' && (
                  <>
                    <Button
                      css={css`
                        box-shadow: none !important;
                      `}
                      mr="2"
                      py="1"
                      variantColor="green"
                      onClick={() => {
                        store.enterViewMode()
                      }}
                    >
                      Done
                    </Button>

                    <Button
                      mr="2"
                      size="sm"
                      isDisabled={!store.hasItemChanges}
                      variant="ghost"
                      onClick={store.resetAllItems}
                    >
                      Reset All
                    </Button>

                    {store.selectedItemData && (
                      <>
                        <ColorPicker
                          value={
                            store.selectedItemData.customColor ||
                            store.selectedItemData.color
                          }
                          onAfterChange={(color) => {
                            store.setItemCustomColor(color)
                          }}
                        >
                          <Button
                            onClick={() => {
                              store.resetItemCustomColor()
                            }}
                          >
                            Reset Default Color
                          </Button>
                        </ColorPicker>
                        <Button
                          ml="2"
                          size="sm"
                          onClick={() => {
                            if (!store.selectedItemData) {
                              return
                            }
                            store.setItemLock(
                              !Boolean(store.selectedItemData.locked)
                            )
                          }}
                        >
                          {store.selectedItemData.locked ? 'Unlock' : 'Lock'}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </Box>

              {store.mode === 'view' && (
                <Box mr="3" ml="3" marginLeft="auto">
                  <Button
                    css={css`
                      box-shadow: none !important;
                    `}
                    py="1"
                    borderTopRightRadius="0"
                    borderBottomRightRadius="0"
                    variantColor="secondary"
                    onClick={() => {
                      state.targetTab = 'shape'
                    }}
                    variant={state.targetTab !== 'shape' ? 'outline' : 'solid'}
                  >
                    Shape
                  </Button>
                  <Button
                    css={css`
                      box-shadow: none !important;
                    `}
                    py="1"
                    borderTopLeftRadius="0"
                    borderBottomLeftRadius="0"
                    variantColor="secondary"
                    onClick={() => {
                      state.targetTab = 'bg'
                    }}
                    variant={state.targetTab !== 'bg' ? 'outline' : 'solid'}
                  >
                    Background
                  </Button>
                </Box>
              )}
            </TopToolbar>

            <CanvasWrappper ref={canvasWrapperRef}>
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
  }
)

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
  height: 58px;
`

const TopNavWrapper = styled(Box)`
  height: 50px;
  padding: 20px;
  /* font-size: 1.5em; */
  /* font-weight: 400; */
  /* background: linear-gradient(90deg, #21c5be, #697af5); */
  background: linear-gradient(90deg, #80578e, #3b458c);
  /* color: white; */
`

const LeftWrapper = styled.div`
  height: 100%;
  background: white;
  max-width: 460px;
  min-width: 460px;
  flex: 1;
  z-index: 3;
  display: flex;
  flex-direction: column;
  /* box-shadow: 0 0 5px 0 #00000033; */
`

const LeftTopWrapper = styled(Box)`
  height: 58px;
  background: white;
  position: relative;
  z-index: 4;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  box-shadow: -3px 1px 2px 1px #00000033;
  /* box-shadow: 0 0 5px 0 #00000033; */
`

const LeftBottomWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  background: #606060;
  /* box-shadow: 0 0 5px 0 #00000033; */
`

const LeftPanel = styled(Box)`
  flex: 1;
  width: 350px;
`

const SideNavbar = styled.div<{ theme: any; activeIndex: number }>`
  /* background: ${(p) =>
    darken(0.1, desaturate(0.5, p.theme.colors.dark4))}; */
  /* border-bottom: 1px solid #cecece; */
  padding: 0;
  margin: 0;
  margin-top: 58px;
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

const LeftNavbarBtn = styled(BaseBtn)<{ theme: any; active: boolean }>`
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
  color: ${(p) => p.theme.colors.textLight};
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

const LeftPanelContent = styled(Box)<{ theme: any; noScroll: boolean }>`
  flex: 1;
  height: ${(p) => (p.noScroll ? '100%' : 'calc(100vh - 50px)')};
  overflow: auto;
  background: ${(p) => p.theme.colors.light};
  z-index: 2;
  box-shadow: 0 0 5px 0 #00000033;
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
  width: calc(100vw - 460px);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 5px 0 #00000033;
`

const Canvas = styled.canvas`
  /* width: 100%; */
  height: 100%;
  /* max-height: 100%; */
  margin: auto;
`

const state = observable({
  title: 'New wordart',
  leftTabShape: 'shapes' as LeftPanelTab,
  leftTabBg: 'words' as Omit<LeftPanelTab, 'shapes'>,
  targetTab: 'shape' as TargetTab,
  leftPanelContext: 'normal' as 'normal' | 'resize',
})

export type TargetTab = 'shape' | 'bg'
export type LeftPanelTab =
  | 'shapes'
  | 'words'
  | 'fonts'
  | 'symbols'
  | 'colors'
  | 'layout'
const leftPanelShapeTabs: LeftPanelTab[] = [
  'shapes',
  'words',
  'fonts',
  'symbols',
  'layout',
  'colors',
]
const leftPanelBgTabs: LeftPanelTab[] = [
  'words',
  'fonts',
  'symbols',
  'layout',
  'colors',
]
