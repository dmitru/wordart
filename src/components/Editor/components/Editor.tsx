import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Heading,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Skeleton,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/core'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { MagicWand } from '@styled-icons/boxicons-solid/MagicWand'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
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
import { Spinner } from 'components/Editor/components/Spinner'
import {
  EditorStoreInitParams,
  pageSizePresets,
} from 'components/Editor/editor-store'
import {
  mkBgStyleConfFromOptions,
  mkShapeStyleConfFromOptions,
} from 'components/Editor/style'
import { BaseBtn } from 'components/shared/BaseBtn'
import { Button } from 'components/shared/Button'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import { Tooltip } from 'components/shared/Tooltip'
import { saveAs } from 'file-saver'
import { Dimensions } from 'lib/wordart/canvas-utils'
import 'lib/wordart/console-extensions'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import Link from 'next/link'
import { darken, desaturate } from 'polished'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { BsTrash } from 'react-icons/bs'
import {
  FiChevronLeft,
  FiCopy,
  FiDownload,
  FiEdit,
  FiFilePlus,
  FiHelpCircle,
  FiMenu,
  FiPrinter,
  FiSave,
} from 'react-icons/fi'
import { IoMdResize } from 'react-icons/io'
import { Api } from 'services/api/api'
import { WordcloudId } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import 'utils/canvas-to-blob'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { TopNavButton } from 'components/shared/TopNavButton'

export type EditorComponentProps = {
  wordcloudId?: WordcloudId
}

export const EditorComponent: React.FC<EditorComponentProps> = observer(
  (props) => {
    const toast = useToast()
    const aspectRatio = 4 / 3
    const [canvasSize] = useState<Dimensions>({ w: 900 * aspectRatio, h: 900 })
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bgCanvasRef = useRef<HTMLCanvasElement>(null)
    const canvasWrapperRef = useRef<HTMLDivElement>(null)
    const { editorPageStore: store, wordcloudsStore } = useStore()

    const isNew = props.wordcloudId == null

    const { authStore } = useStore()
    const { profile } = authStore
    const router = useRouter()

    const cancelVisualizationBtnRef = useRef<HTMLButtonElement>(null)

    const [isSaving, setIsSaving] = useState(false)

    const handleSaveClick = useCallback(() => {
      const save = async () => {
        if (isSaving || !store.editor) {
          return
        }
        setIsSaving(true)
        const thumbnailCanvas = await store.editor.exportAsRaster(380)
        const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.85)
        const editorData = await store.serialize()

        if (isNew) {
          const wordcloud = await wordcloudsStore.create({
            title: state.title || 'Untitled Design',
            editorData,
            thumbnail,
          })
          router.replace(Urls.editor._next, Urls.editor.edit(wordcloud.id), {
            shallow: true,
          })
        } else {
          await wordcloudsStore.save(props.wordcloudId!, {
            title: state.title || 'Untitled Design',
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
          bgCanvasRef.current &&
          store.lifecycleState === 'initial'
        ) {
          const editorParams: EditorStoreInitParams = {
            canvas: canvasRef.current,
            bgCanvas: bgCanvasRef.current,
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
        }
      }

      init()
    }, [props.wordcloudId, authStore.hasInitialized, canvasRef.current])

    useEffect(() => {
      return () => {
        store.destroyEditor()
        store.lifecycleState = 'initial'
      }
    }, [])

    //
    // Exporting
    //
    const [isExporting, setIsExporting] = useState(false)
    const handleDownloadClick = useCallback(
      (hd = false, format: 'svg' | 'png' | 'jpeg') => {
        const startExport = async () => {
          const dimension = hd ? 4096 : 1024
          if (!store.editor) {
            return
          }

          setIsExporting(true)

          try {
            // TODO: hit API for HD download
            if (hd) {
              const result = await Api.wordclouds.hdDownload({
                wordcloudVersion: store.editor.version,
                wordloudKey: store.editor.key,
              })

              if (!result.canDownload) {
                console.log('Can not download! :(')
                // TODO: open upgrade / buy modal
                return
              }
            }

            const mimeType =
              {
                png: 'image/png',
                jpeg: 'image/jpeg',
                svg: 'image/svg',
              }[format] || 'image/png'

            if (format === 'svg') {
              const svg = await store.editor.exportAsSvg()
              const svgBlob = new Blob([svg], { type: 'image/svg' })
              saveAs(svgBlob, `${state.title || 'Untitled Design'}.svg`)
            } else {
              const canvas = await store.editor.exportAsRaster(dimension)
              canvas.toBlob((blob) => {
                saveAs(
                  blob as Blob,
                  `${state.title || 'Untitled Design'}.${format}`
                )
              }, mimeType)
            }
          } finally {
            setIsExporting(false)
          }
        }

        startExport()
      },
      [store]
    )

    const closeExport = useCallback(() => {
      state.isShowingExport = false
    }, [])
    const openExport = useCallback(() => {
      state.isShowingExport = true
    }, [])

    const cancelVisualization = () => {
      store.editor?.cancelVisualization()
      toast({
        title: 'Visualization cancelled',
        status: 'info',
        duration: 2000,
        position: 'bottom-right',
        isClosable: true,
      })
    }

    if (!router || !authStore.hasInitialized) {
      return <SpinnerSplashScreen />
    }

    if (authStore.isLoggedIn !== true) {
      router.replace(Urls.login)
      return <SpinnerSplashScreen />
    }

    const {
      // @ts-ignore
      renderKey, // eslint-disable-line
    } = store
    const hasItems = store.editor
      ? store.targetTab === 'bg'
        ? store.editor.items.bg.items.length > 0
        : store.editor.items.shape.items.length > 0
      : false

    const leftTab =
      store.targetTab === 'bg' ? state.leftTabBg : state.leftTabShape

    return (
      <PageLayoutWrapper>
        <TopNavWrapper alignItems="center" display="flex">
          <Link href={Urls.dashboard} passHref>
            <TopNavButton mr="1" variant="secondary">
              <FiChevronLeft
                css={css`
                  margin-right: 4px;
                `}
              />
              Home
            </TopNavButton>
          </Link>

          <Menu>
            <MenuButton mr="1" as={TopNavButton} variant="accent">
              <FiMenu
                css={css`
                  margin-right: 4px;
                `}
              />
              Menu
            </MenuButton>
            <MenuList zIndex={4}>
              <MenuItem>
                <FiFilePlus
                  css={css`
                    margin-right: 4px;
                  `}
                />
                New...
              </MenuItem>
              <MenuItem onClick={handleSaveClick}>
                <FiSave
                  css={css`
                    margin-right: 4px;
                  `}
                />
                Save
              </MenuItem>
              <MenuItem>
                <FiCopy
                  css={css`
                    margin-right: 4px;
                  `}
                />
                Make Copy
              </MenuItem>
              <MenuItem>
                <FiEdit
                  css={css`
                    margin-right: 4px;
                  `}
                />
                Rename
              </MenuItem>
              <MenuItem
                onClick={() => {
                  state.leftPanelContext = 'resize'
                }}
              >
                <IoMdResize
                  css={css`
                    margin-right: 4px;
                  `}
                />
                Page Size...
              </MenuItem>
              <MenuDivider />
              <MenuItem>
                <FiPrinter
                  css={css`
                    margin-right: 4px;
                  `}
                />
                Print
              </MenuItem>
              <MenuItem>
                <FiDownload
                  onClick={openExport}
                  css={css`
                    margin-right: 4px;
                  `}
                />{' '}
                Download as Image
              </MenuItem>
              <MenuDivider />
              <MenuItem>
                <BsTrash
                  css={css`
                    margin-right: 4px;
                  `}
                />
                Delete
              </MenuItem>
              <MenuDivider />
              <MenuItem>
                <FiChevronLeft
                  css={css`
                    margin-right: 4px;
                  `}
                />
                Go Back to Your Designs
              </MenuItem>
            </MenuList>
          </Menu>

          <TopNavButton
            onClick={handleSaveClick}
            isLoading={isSaving}
            mr="1"
            css={css`
              width: 90px;
            `}
          >
            <FiSave
              css={css`
                margin-right: 4px;
              `}
            />
            Save
          </TopNavButton>

          <Editable
            css={css`
              background: #fff3;
              padding: 2px 8px;
              border-radius: 4px;
              display: flex;
              height: 40px;

              &:hover {
                background: #ffffff15;
              }
            `}
            value={state.title}
            onChange={(value) => {
              state.title = value
            }}
            selectAllOnFocus={false}
            placeholder="Untitled Design"
            color="white"
            fontSize="xl"
            maxWidth="200px"
            ml="2"
            flex={1}
          >
            <EditablePreview
              width="100%"
              css={css`
                text-overflow: ellipsis;
                overflow-x: hidden;
                white-space: nowrap;
              `}
            />
            <EditableInput
              css={css`
                background-color: white;
                color: black;
              `}
            />
          </Editable>

          <TopNavButton onClick={openExport} mr="1" variant="secondary">
            <FiDownload
              css={css`
                margin-right: 4px;
              `}
            />
            Download
          </TopNavButton>

          {/* <TopNavButton
            onClick={openExport}
            isLoading={isExporting}
            loadingText="Saving..."
            mr="1"
          >
            <FiShoppingCart
              css={css`
                margin-right: 4px;
              `}
            />
            Order Prints
          </TopNavButton> */}

          <TopNavButton variant mr="2" ml="auto">
            <FiHelpCircle
              css={css`
                margin-right: 4px;
              `}
            />
            Help & Tutorials
          </TopNavButton>

          <Button variantColor="accent">Upgrade</Button>
        </TopNavWrapper>

        <EditorLayout>
          <LeftWrapper>
            <LeftBottomWrapper>
              <SideNavbar
                activeIndex={
                  store.targetTab === 'shape'
                    ? leftPanelShapeTabs.findIndex(
                        (s) => s === state.leftTabShape
                      )
                    : leftPanelBgTabs.findIndex((s) => s === state.leftTabBg)
                }
              >
                {store.targetTab !== 'bg' && (
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
                  noScroll={leftTab === 'shapes'}
                >
                  {store.lifecycleState === 'initialized' ? (
                    <>
                      {state.leftPanelContext === 'resize' && (
                        <Box px="3" py="3">
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
                                store.animateVisualize(false)
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
                              <LeftPanelWordsTab target={store.targetTab} />
                            </>
                          )}
                          {leftTab === 'fonts' && (
                            <>
                              <LeftPanelFontsTab target={store.targetTab} />
                            </>
                          )}
                          {leftTab === 'symbols' && (
                            <LeftPanelIconsTab target={store.targetTab} />
                          )}
                          {leftTab === 'colors' && (
                            <LeftPanelColorsTab target={store.targetTab} />
                          )}

                          {leftTab === 'layout' && (
                            <LeftPanelLayoutTab target={store.targetTab} />
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <Box px="5" py="6">
                      <Skeleton height="50px" my="10px" />
                      <Skeleton height="30px" my="10px" />
                      <Skeleton height="300px" my="10px" />
                    </Box>
                  )}
                </LeftPanelContent>
              </LeftPanel>
            </LeftBottomWrapper>
          </LeftWrapper>

          <RightWrapper>
            <TopToolbar display="flex" alignItems="center" bg="light" px="5">
              <Modal
                initialFocusRef={cancelVisualizationBtnRef}
                finalFocusRef={cancelVisualizationBtnRef}
                isOpen={state.isShowingExport}
                onClose={closeExport}
              >
                <ModalOverlay />
                <ModalContent
                  css={css`
                    max-width: 530px;
                  `}
                >
                  <ModalHeader>Choose Download Format</ModalHeader>
                  <ModalBody pb={6}>
                    {isExporting ? (
                      <>
                        <Spinner />
                      </>
                    ) : (
                      <>
                        <Text fontSize="lg">
                          <strong>Standard Download,</strong> personal use only
                        </Text>
                        <Stack direction="row" spacing="3" flexWrap="wrap">
                          <ExportButton
                            variant="outline"
                            onClick={() => handleDownloadClick(false, 'png')}
                          >
                            <Text mt="0" fontSize="lg" fontWeight="bold">
                              PNG
                            </Text>
                            <Text mb="0" fontSize="sm" fontWeight="normal">
                              1024 px
                            </Text>
                            <Text mb="0" fontSize="sm" fontWeight="normal">
                              Higher quality
                            </Text>
                          </ExportButton>
                          <ExportButton
                            variant="outline"
                            onClick={() => handleDownloadClick(false, 'jpeg')}
                          >
                            <Text mt="0" fontSize="lg" fontWeight="bold">
                              JPEG
                            </Text>
                            <Text mb="0" fontSize="sm" fontWeight="normal">
                              1024 px
                            </Text>
                            <Text mb="0" fontSize="sm" fontWeight="normal">
                              Smaller file size
                            </Text>
                          </ExportButton>
                        </Stack>

                        <Box mt="6">
                          <Text fontSize="lg">
                            <strong>HD Download,</strong> personal or commercial
                            use
                          </Text>
                          <Stack direction="row" spacing="3" flexWrap="wrap">
                            <ExportButton
                              variant="outline"
                              onClick={() => handleDownloadClick(true, 'png')}
                            >
                              <Text mt="0" fontSize="lg">
                                PNG (HD)
                              </Text>
                              <Text mb="0" fontSize="sm">
                                4096 px
                              </Text>
                            </ExportButton>

                            <ExportButton
                              variant="outline"
                              onClick={() => handleDownloadClick(true, 'jpeg')}
                            >
                              <Text mt="0" fontSize="lg">
                                JPEG (HD)
                              </Text>
                              <Text mb="0" fontSize="sm">
                                4096 px
                              </Text>
                            </ExportButton>

                            <ExportButton
                              variant="outline"
                              onClick={() => handleDownloadClick(true, 'svg')}
                            >
                              <Text mt="0" fontSize="lg">
                                SVG
                              </Text>
                              <Text mb="0" fontSize="sm">
                                Vector format
                              </Text>
                            </ExportButton>
                          </Stack>
                        </Box>
                      </>
                    )}
                  </ModalBody>
                  <ModalCloseButton />
                </ModalContent>
              </Modal>

              <Modal
                initialFocusRef={cancelVisualizationBtnRef}
                finalFocusRef={cancelVisualizationBtnRef}
                isOpen={store.isVisualizing}
                onClose={cancelVisualization}
                closeOnOverlayClick={false}
                closeOnEsc={false}
              >
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>
                    {store.visualizingStep === 'generating'
                      ? 'Generating'
                      : 'Visualizing'}
                    : {Math.round(100 * (store.visualizingProgress || 0))}%
                  </ModalHeader>
                  <ModalBody pb={6}>
                    <Stack>
                      <Progress
                        isAnimated
                        hasStripe
                        css={css`
                          &,
                          * {
                            transition: all 0.2s !important;
                          }
                        `}
                        color="accent"
                        height="32px"
                        value={(store.visualizingProgress || 0) * 100}
                      />
                      <Text fontSize="lg"></Text>
                    </Stack>
                  </ModalBody>

                  <ModalFooter>
                    <Button
                      ref={cancelVisualizationBtnRef}
                      onClick={cancelVisualization}
                    >
                      Cancel
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              {store.lifecycleState === 'initialized' && (
                <>
                  <Button
                    id="btn-visualize"
                    css={css`
                      width: 128px;
                    `}
                    variantColor="accent"
                    isLoading={store.isVisualizing}
                    onClick={() => {
                      if (store.targetTab === 'shape') {
                        store.editor?.generateShapeItems({
                          style: mkShapeStyleConfFromOptions(
                            store.styleOptions.shape
                          ),
                        })
                      } else {
                        store.editor?.generateBgItems({
                          style: mkBgStyleConfFromOptions(
                            store.styleOptions.bg
                          ),
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

                  <Tooltip
                    label="Undo"
                    aria-label="Undo"
                    hasArrow
                    zIndex={5}
                    isDisabled={!store.editor?.canUndo()}
                  >
                    <IconButton
                      ml="3"
                      icon="arrow-back"
                      aria-label="Undo"
                      variant="outline"
                      isDisabled={!store.editor?.canUndo()}
                      onClick={store.editor?.undo}
                    />
                  </Tooltip>
                  <Tooltip
                    label="Redo"
                    aria-label="Redo"
                    hasArrow
                    zIndex={5}
                    isDisabled={!store.editor?.canRedo()}
                  >
                    <IconButton
                      ml="1"
                      icon="arrow-forward"
                      aria-label="Redo"
                      variant="outline"
                      isDisabled={!store.editor?.canRedo()}
                      onClick={store.editor?.redo}
                    />
                  </Tooltip>

                  <Box mr="3" ml="3">
                    {store.mode === 'view' && hasItems && (
                      <>
                        <Button
                          variant="outline"
                          css={css`
                            box-shadow: none !important;
                          `}
                          py="1"
                          onClick={() => {
                            store.enterEditItemsMode(store.targetTab)
                          }}
                        >
                          Edit Items
                        </Button>

                        <Menu>
                          <MenuButton ml="2" as={MenuDotsButton} />
                          <MenuList>
                            <MenuItem
                              onClick={() => {
                                store.editor?.clearItems(store.targetTab, true)
                              }}
                            >
                              <Icon
                                name="small-close"
                                size="20px"
                                color="gray.500"
                                mr="2"
                              />
                              Clear all
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </>
                    )}

                    {store.mode === 'edit' && (
                      <>
                        <Button
                          css={css`
                            box-shadow: none !important;
                          `}
                          mr="2"
                          py="1"
                          variantColor="green"
                          onClick={() => {
                            store.enterViewMode(store.targetTab)
                          }}
                        >
                          Done
                        </Button>

                        <Button
                          mr="2"
                          size="sm"
                          isDisabled={!store.hasItemChanges}
                          variant="ghost"
                          onClick={() => store.resetAllItems(store.targetTab)}
                        >
                          Reset All
                        </Button>

                        {store.selectedItemData && (
                          <>
                            <ColorPickerPopover
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
                            </ColorPickerPopover>
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
                              {store.selectedItemData.locked
                                ? 'Unlock'
                                : 'Lock'}
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </Box>

                  {store.mode === 'view' && (
                    <Box mr="3" ml="auto" display="flex" alignItems="center">
                      <Menu>
                        <MenuButton
                          // @ts-ignore
                          variant="outline"
                          as={Button}
                          rightIcon="chevron-down"
                          py="2"
                          px="3"
                        >
                          {store.targetTab === 'shape' ? 'Layer: Shape' : ''}
                          {store.targetTab === 'bg' ? 'Layer: Background' : ''}
                        </MenuButton>
                        <MenuList
                          as="div"
                          placement="bottom-end"
                          css={css`
                            max-height: 300px;
                            max-width: 260px;
                            right: 200px;
                          `}
                        >
                          <MenuItem
                            onClick={() => {
                              store.targetTab = 'shape'
                            }}
                          >
                            <Box display="flex" flexDirection="column" py="2">
                              <Text my="0">Layer: Shape</Text>
                              <Text my="0" fontSize="xs" color="gray.500">
                                Use this layer to place words and icons on the
                                shape.
                              </Text>
                            </Box>
                          </MenuItem>

                          <MenuItem
                            onClick={() => {
                              store.targetTab = 'bg'
                            }}
                          >
                            <Box display="flex" flexDirection="column" py="2">
                              <Text my="0">Layer: Background</Text>
                              <Text my="0" fontSize="xs" color="gray.500">
                                Use this layer to place words and icons on the
                                background.
                              </Text>
                            </Box>
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Box>
                  )}
                </>
              )}

              {store.lifecycleState !== 'initialized' && (
                <>
                  <Skeleton height="30px" width="100px" mr="20px" />
                  <Skeleton height="30px" width="300px" mr="20px" />
                </>
              )}
            </TopToolbar>

            <CanvasWrappper ref={canvasWrapperRef}>
              <CanvasContainer>
                <Canvas
                  width={canvasSize.w}
                  height={canvasSize.h}
                  ref={bgCanvasRef}
                  id="bg"
                />
                <Canvas
                  width={canvasSize.w}
                  height={canvasSize.h}
                  ref={canvasRef}
                  id="scene"
                />
              </CanvasContainer>
              {store.lifecycleState !== 'initialized' && (
                <Box
                  position="absolute"
                  width="100%"
                  height="100%"
                  display="flex"
                  flexDir="column"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Spinner />
                  <Text mt="4" fontSize="lg">
                    Initializing...
                  </Text>
                </Box>
              )}
            </CanvasWrappper>
          </RightWrapper>
        </EditorLayout>
      </PageLayoutWrapper>
    )
  }
)

const ExportButton = styled(Button)(
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
  position: relative;
  z-index: 1;
  box-shadow: 0 0 5px 0 #00000033;
  height: 60px;
`

const TopNavWrapper = styled(Box)<{ theme: any }>`
  height: 60px;
  padding: 10px 20px;
  /* padding-left: 90px; */
  background: ${(p) => p.theme.colors.header.bg};
`

const LeftWrapper = styled.div`
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

const LeftBottomWrapper = styled.div<{ theme: any }>`
  flex: 1;
  display: flex;
  flex-direction: row;
  background: ${(p) => p.theme.colors.leftPanel.bg};
`

const LeftPanel = styled(Box)`
  z-index: 2;
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
    transform: translateY(${(p) => p.activeIndex * 75}px);
    top: 0;
    left: 0;
    position: absolute;
    height: 75px;
    width: 100%;
    z-index: 0;
    background: ${(p) => p.theme.colors.leftPanel.bgActive};
    border-left: 8px solid ${(p) => p.theme.colors.primary}; 
  }
`

const LeftNavbarBtn = styled(BaseBtn)<{ theme: any; active: boolean }>`
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

const LeftPanelContent = styled(Box)<{ theme: any; noScroll: boolean }>`
  flex: 1;
  height: ${(p) => (p.noScroll ? '100%' : 'calc(100vh - 50px)')};
  overflow: auto;
  background: ${(p) => p.theme.colors.light};
  z-index: 2;
  box-shadow: 0 0 5px 0 #00000033;

  &::-webkit-scrollbar {
    display: none; /* Chrome Safari */
  }
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
`

const RightWrapper = styled.div`
  height: 100%;
  background: #eee;
  flex: 1;
  box-shadow: 0 0 5px 0 #00000033;
`

const CanvasWrappper = styled.div`
  flex: 1;
  height: calc(100vh - 100px);
  width: calc(100vw - 460px);
  display: flex;
  position: relative;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 5px 0 #00000033;
`

const CanvasContainer = styled.div`
  height: 100%;
  width: 100%;
  position: relative;
`

const Canvas = styled.canvas`
  position: absolute !important;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
`

const state = observable({
  title: 'New wordart',
  leftTabShape: 'shapes' as LeftPanelTab,
  leftTabBg: 'words' as Omit<LeftPanelTab, 'shapes'>,
  leftPanelContext: 'normal' as 'normal' | 'resize',
  isShowingExport: false,
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
