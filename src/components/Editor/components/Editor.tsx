import {
  Box,
  Button,
  Editable,
  EditableInput,
  EditablePreview,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuTransition,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Portal,
  Progress,
  Skeleton,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/core'
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  DownloadIcon,
  SmallCloseIcon,
} from '@chakra-ui/icons'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { MagicWand } from '@styled-icons/boxicons-solid/MagicWand'
import { ColorPalette } from '@styled-icons/evaicons-solid/ColorPalette'
import { Shapes } from '@styled-icons/fa-solid/Shapes'
import { SmileBeam } from '@styled-icons/fa-solid/SmileBeam'
import { Font } from '@styled-icons/icomoon/Font'
import { TextFields } from '@styled-icons/material/TextFields'
import { LayoutMasonry } from '@styled-icons/remix-fill/LayoutMasonry'
import { LeftPanelColorsTab } from 'components/Editor/components/LeftPanelColorsTab'
import { LeftPanelFontsTab } from 'components/Editor/components/LeftPanelFontsTab'
import { LeftPanelIconsTab } from 'components/Editor/components/LeftPanelIconsTab'
import { LeftPanelLayoutTab } from 'components/Editor/components/LeftPanelLayoutTab'
import { LeftPanelWordsTab } from 'components/Editor/components/LeftPanelWordsTab'
import { LeftPanelResizeTab } from 'components/Editor/components/LeftPanelResizeTab'
import { LeftPanelShapesTab } from 'components/Editor/components/ShapesTab/LeftPanelShapesTab'
import { Spinner } from 'components/Editor/components/Spinner'
import { WarningModal } from 'components/Editor/components/WarningModal'
import {
  EditorStoreInitParams,
  pageSizePresets,
} from 'components/Editor/editor-store'
import {
  mkBgStyleConfFromOptions,
  mkShapeStyleConfFromOptions,
} from 'components/Editor/style'
import { BaseBtn } from 'components/shared/BaseBtn'
import { ColorPickerPopover } from 'components/shared/ColorPickerPopover'
import { ConfirmModalWithRecaptcha } from 'components/shared/ConfirmModalWithRecaptcha'
import { MenuDotsButton } from 'components/shared/MenuDotsButton'
import { SpinnerSplashScreen } from 'components/shared/SpinnerSplashScreen'
import { Tooltip } from 'components/shared/Tooltip'
import { TopNavButton } from 'components/shared/TopNavButton'
import { saveAs } from 'file-saver'
import { Dimensions, canvasToDataUri } from 'lib/wordart/canvas-utils'
import 'lib/wordart/console-extensions'
import { observer, useLocalStore } from 'mobx-react'
import { useRouter } from 'next/dist/client/router'
import Link from 'next/link'
import { darken, desaturate } from 'polished'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import Hotkeys from 'react-hot-keys'
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
import { getTabTitle } from 'utils/tab-title'
import { useWarnIfUnsavedChanges } from 'utils/use-warn-if-unsaved-changes'
import { uuid } from 'utils/uuid'
import { SectionLabel } from './shared'

export type EditorComponentProps = {
  wordcloudId?: WordcloudId
}

const UnsavedChangesMsg = 'If you leave the page, unsaved changes will be lost.'

export const EditorComponent: React.FC<EditorComponentProps> = observer(
  (props) => {
    const state = useLocalStore(() => ({
      title: 'New wordart',
      leftTab: 'shapes' as LeftPanelTab,
      leftPanelContext: 'normal' as 'normal' | 'resize',
      isShowingExport: false,
      isShowingExportNoItemsWarning: false,
    }))

    const toast = useToast()
    const aspectRatio = 4 / 3
    const [canvasSize] = useState<Dimensions>({ w: 900 * aspectRatio, h: 900 })
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bgCanvasRef = useRef<HTMLCanvasElement>(null)
    const canvasWrapperRef = useRef<HTMLDivElement>(null)
    const { editorPageStore: store, wordcloudsStore } = useStore()
    const { isSaving } = store

    const isNew = props.wordcloudId == null

    const { authStore } = useStore()
    const { profile } = authStore

    const router = useRouter()

    const cancelVisualizationBtnRef = useRef<HTMLButtonElement>(null)
    const [isShowingSignupModal, setIsShowingSignupModal] = useState(false)

    const hasUnsavedChanges = useCallback((url?: string) => {
      if (url?.startsWith('/editor/')) {
        return false
      }
      return store.hasUnsavedChanges
    }, [])
    useWarnIfUnsavedChanges(hasUnsavedChanges, UnsavedChangesMsg)

    const [
      isShowingEmptyIconsWarning,
      setIsShowingEmptyIconsWarning,
    ] = useState(false)

    const saveAnonymously = async (recaptcha: string) => {
      if (isSaving || !store.editor || !isNew) {
        return
      }

      store.isSaving = true
      try {
        const thumbnailCanvas = await store.editor.exportAsRaster(380)
        const thumbnail = thumbnailCanvas.toDataURL('image/jpeg', 0.85)
        const editorData = await store.serialize()

        const wordcloud = await wordcloudsStore.createAnonymous({
          id: uuid(),
          recaptcha,
          title: state.title || 'Untitled Design',
          editorData,
          thumbnail,
        })
        router.replace(Urls.signup)

        toast({
          title: 'Your work is saved. Please sign up to continue.',
          status: 'success',
          duration: 10000,
          position: 'bottom-right',
          isClosable: true,
        })
      } finally {
        store.isSaving = false
      }
    }

    const handleSaveClick = useCallback(() => {
      const showToast = () =>
        toast({
          id: 'work-saved',
          title: 'Your work is saved',
          status: 'success',
          // duration: 2000,
          position: 'bottom-right',
          isClosable: true,
        })

      if (!store.hasUnsavedChanges) {
        showToast()
        return
      }

      if (authStore.isLoggedIn === false) {
        setIsShowingSignupModal(true)
        return
      }

      const save = async () => {
        if (isSaving || !store.editor) {
          return
        }
        store.isSaving = true

        try {
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
          showToast()
          store.hasUnsavedChanges = false
        } finally {
          store.isSaving = false
        }
      }

      save()
    }, [authStore.isLoggedIn, props.wordcloudId, store.hasUnsavedChanges])

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
    type DownloadFormat = 'sd-png' | 'sd-jpeg' | 'hd-png' | 'hd-jpeg' | 'hd-svg'

    const [isExporting, setIsExporting] = useState(false)
    const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>(
      'sd-png'
    )

    const handleDownloadClick = useCallback(() => {
      const hd =
        selectedFormat === 'hd-jpeg' ||
        selectedFormat === 'hd-png' ||
        selectedFormat === 'hd-svg'
      const format = ({
        'sd-png': 'png',
        'hd-png': 'png',
        'sd-jpeg': 'jpeg',
        'hd-jpeg': 'jpeg',
        'hd-svg': 'svg',
      } as { [format in DownloadFormat]: string })[selectedFormat]

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
            const canvas = await store.editor.exportAsRaster(dimension, format)
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
    }, [store, selectedFormat])

    const closeExport = useCallback(() => {
      state.isShowingExport = false
    }, [])
    const openExport = useCallback(() => {
      const itemsCount =
        (store.editor?.items?.shape?.items?.length || 0) +
        (store.editor?.items?.bg?.items?.length || 0)
      if (itemsCount > 0) {
        state.isShowingExport = true
      } else {
        state.isShowingExportNoItemsWarning = true
      }
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

    useEffect(() => {
      window.addEventListener('beforeprint', (evt) => {
        console.log('beforeprint = ', evt)
        evt.preventDefault()
      })
    }, [])

    if (!router || !authStore.hasInitialized) {
      return <SpinnerSplashScreen />
    }

    const {
      // @ts-ignore
      Key, // eslint-disable-line
    } = store
    const hasItems = store.editor
      ? store.targetTab === 'bg'
        ? store.editor.items.bg.items.length > 0
        : store.editor.items.shape.items.length > 0
      : false

    const leftTab = state.leftTab

    const handleVisualizeClick = () => {
      if (store.targetTab === 'shape') {
        const wordsCount = store.styleOptions.shape.items.words.wordList.length
        const itemsCount = store.styleOptions.shape.items.icons.iconList.length

        if (wordsCount + itemsCount === 0) {
          setIsShowingEmptyIconsWarning(true)
          return
        }

        store.editor?.generateShapeItems({
          style: mkShapeStyleConfFromOptions(store.styleOptions.shape),
        })
      } else {
        const wordsCount = store.styleOptions.bg.items.words.wordList.length
        const itemsCount = store.styleOptions.bg.items.icons.iconList.length

        if (wordsCount + itemsCount === 0) {
          setIsShowingEmptyIconsWarning(true)
          return
        }

        store.editor?.generateBgItems({
          style: mkBgStyleConfFromOptions(store.styleOptions.bg),
        })
      }
    }

    const handlePrint = async () => {
      if (!store.editor) {
        return
      }
      const printJS = require('print-js')
      const canvas = await store.editor.exportAsRaster(1200)
      const dataUrl = canvasToDataUri(canvas)
      printJS({
        printable: dataUrl,
        type: 'image',
        style: 'width: 100%',
        maxWidth: 2048,
      })
    }

    return (
      <PageLayoutWrapper>
        <Helmet>
          <title>{getTabTitle(state.title || 'Untitled')}</title>
        </Helmet>

        <Hotkeys
          keyName="cmd+s,ctrl+s"
          onKeyDown={(shortcut, event) => {
            event.preventDefault()
            handleSaveClick()
          }}
        />

        <TopNavWrapper alignItems="center" display="flex">
          <img
            src="/images/logo.svg"
            css={css`
              height: 40px;
              margin: 0;
              margin-left: 0.5rem;
              margin-right: 0.5rem;
            `}
          />
          <Link
            href={authStore.isLoggedIn ? Urls.yourDesigns : Urls.landing}
            passHref
          >
            <TopNavButton mr="1" variant="secondary" colorScheme="secondary">
              <FiChevronLeft
                css={css`
                  margin-right: 4px;
                `}
              />
              Home
            </TopNavButton>
          </Link>

          <Menu isLazy>
            <MenuButton mr="2" as={TopNavButton} variant="primary">
              <FiMenu
                css={css`
                  margin-right: 4px;
                `}
              />
              Menu
            </MenuButton>
            <Portal>
              <MenuTransition>
                {(styles) => (
                  // @ts-ignore
                  <MenuList css={styles} zIndex={4}>
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
                    <MenuItem onClick={handlePrint}>
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
                )}
              </MenuTransition>
            </Portal>
          </Menu>

          <Button
            colorScheme="secondary"
            onClick={handleSaveClick}
            isLoading={isSaving}
            mr="2"
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
          </Button>

          <Editable
            css={css`
              background: #fff3;
              padding: 5px 8px;
              overflow: hidden;
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
              store.hasUnsavedChanges = true
            }}
            selectAllOnFocus={false}
            placeholder="Untitled Design"
            color="white"
            fontSize="xl"
            maxWidth="200px"
            flex={1}
            mr="2"
          >
            <EditablePreview
              width="100%"
              py="0"
              css={css`
                text-overflow: ellipsis;
                overflow-x: hidden;
                overflow-y: hidden;
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

          <TopNavButton
            variant="secondary"
            onClick={openExport}
            colorScheme="secondary"
          >
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

          <TopNavButton colorScheme="secondary" mr="2" ml="auto">
            <FiHelpCircle
              css={css`
                margin-right: 4px;
              `}
            />
            Help & Tutorials
          </TopNavButton>

          <Button colorScheme="accent">Upgrade</Button>
        </TopNavWrapper>

        <EditorLayout>
          <LeftWrapper>
            <LeftBottomWrapper>
              <SideNavbar
                activeIndex={
                  state.leftPanelContext === 'normal'
                    ? leftPanelTabs.findIndex((s) => s === state.leftTab)
                    : undefined
                }
              >
                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTab = 'shapes'
                    state.leftPanelContext = 'normal'
                  }}
                  active={
                    state.leftTab === 'shapes' &&
                    state.leftPanelContext === 'normal'
                  }
                >
                  <Shapes className="icon" />
                  Shape
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTab = 'words'
                    state.leftPanelContext = 'normal'
                  }}
                  active={
                    leftTab === 'words' && state.leftPanelContext === 'normal'
                  }
                >
                  <TextFields className="icon" />
                  Words
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTab = 'fonts'
                    state.leftPanelContext = 'normal'
                  }}
                  active={
                    leftTab === 'fonts' && state.leftPanelContext === 'normal'
                  }
                >
                  <Font className="icon" />
                  Fonts
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTab = 'symbols'
                    state.leftPanelContext = 'normal'
                  }}
                  active={
                    leftTab === 'symbols' && state.leftPanelContext === 'normal'
                  }
                >
                  <SmileBeam className="icon" />
                  Icons
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTab = 'layout'
                    state.leftPanelContext = 'normal'
                  }}
                  active={
                    leftTab === 'layout' && state.leftPanelContext === 'normal'
                  }
                >
                  <LayoutMasonry className="icon" />
                  Layout
                </LeftNavbarBtn>

                <LeftNavbarBtn
                  onClick={() => {
                    state.leftTab = 'colors'
                    state.leftPanelContext = 'normal'
                  }}
                  active={
                    leftTab === 'colors' && state.leftPanelContext === 'normal'
                  }
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
                        <LeftPanelResizeTab>
                          <Box>
                            <Button
                              mt="4"
                              width="100%"
                              colorScheme="accent"
                              onClick={() => {
                                state.leftPanelContext = 'normal'
                              }}
                            >
                              Done
                            </Button>
                          </Box>
                        </LeftPanelResizeTab>
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
            <TopToolbar display="flex" alignItems="center" px="5">
              <WarningModal
                header="Your design is empty"
                content="Please add some words or icons to your design and click Visualize first."
                isOpen={state.isShowingExportNoItemsWarning}
                onClose={() => {
                  state.isShowingExportNoItemsWarning = false
                }}
              />
              <Modal
                initialFocusRef={cancelVisualizationBtnRef}
                finalFocusRef={cancelVisualizationBtnRef}
                isOpen={state.isShowingExport}
                onClose={closeExport}
              >
                <ModalOverlay>
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
                            <strong>Standard Download,</strong> for personal use
                            only
                          </Text>
                          <Stack direction="row" spacing="3" flexWrap="wrap">
                            <ExportButton
                              variant="outline"
                              boxShadow={
                                selectedFormat === 'sd-png'
                                  ? '0 0 0 3px rgb(237, 93, 98) !important'
                                  : 'none'
                              }
                              onClick={() => setSelectedFormat('sd-png')}
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
                              boxShadow={
                                selectedFormat === 'sd-jpeg'
                                  ? '0 0 0 3px rgb(237, 93, 98) !important'
                                  : 'none'
                              }
                              onClick={() => setSelectedFormat('sd-jpeg')}
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
                              <strong>HQ Download,</strong> personal or
                              commercial use
                            </Text>
                            <Stack direction="row" spacing="3" flexWrap="wrap">
                              <ExportButton
                                variant="outline"
                                boxShadow={
                                  selectedFormat === 'hd-png'
                                    ? '0 0 0 3px rgb(237, 93, 98) !important'
                                    : 'none'
                                }
                                onClick={() => setSelectedFormat('hd-png')}
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
                                boxShadow={
                                  selectedFormat === 'hd-jpeg'
                                    ? '0 0 0 3px rgb(237, 93, 98) !important'
                                    : 'none'
                                }
                                onClick={() => setSelectedFormat('hd-jpeg')}
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
                                boxShadow={
                                  selectedFormat === 'hd-svg'
                                    ? '0 0 0 3px rgb(237, 93, 98) !important'
                                    : 'none'
                                }
                                onClick={() => setSelectedFormat('hd-svg')}
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
                    <ModalFooter>
                      <Button
                        colorScheme="accent"
                        leftIcon={<DownloadIcon />}
                        onClick={handleDownloadClick}
                      >
                        Download
                      </Button>
                    </ModalFooter>
                    <ModalCloseButton />
                  </ModalContent>
                </ModalOverlay>
              </Modal>

              <Modal
                initialFocusRef={cancelVisualizationBtnRef}
                finalFocusRef={cancelVisualizationBtnRef}
                isOpen={store.isVisualizing}
                onClose={cancelVisualization}
                closeOnOverlayClick={false}
                closeOnEsc={false}
              >
                <ModalOverlay>
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
                </ModalOverlay>
              </Modal>

              {store.lifecycleState === 'initialized' && (
                <>
                  <Button
                    id="btn-visualize"
                    css={css`
                      width: 128px;
                    `}
                    colorScheme="accent"
                    isLoading={store.isVisualizing}
                    onClick={handleVisualizeClick}
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
                    isDisabled={!store.editor?.canUndo}
                  >
                    <IconButton
                      ml="3"
                      icon={<ArrowBackIcon />}
                      aria-label="Undo"
                      variant="outline"
                      isDisabled={!store.editor?.canUndo}
                      onClick={store.editor?.undo}
                    />
                  </Tooltip>
                  <Tooltip
                    label="Redo"
                    aria-label="Redo"
                    hasArrow
                    zIndex={5}
                    isDisabled={!store.editor?.canRedo}
                  >
                    <IconButton
                      ml="1"
                      icon={<ArrowForwardIcon />}
                      aria-label="Redo"
                      variant="outline"
                      isDisabled={!store.editor?.canRedo}
                      onClick={store.editor?.redo}
                    />
                  </Tooltip>

                  <Box mr="3" ml="auto">
                    {store.mode === 'view' && hasItems && (
                      <>
                        <Menu isLazy>
                          <MenuButton
                            mr="2"
                            as={MenuDotsButton}
                            variant="ghost"
                          />

                          <Portal>
                            <MenuTransition>
                              {(styles) => (
                                // @ts-ignore
                                <MenuList css={styles}>
                                  <MenuItem
                                    onClick={() => {
                                      store.editor?.clearItems('shape', true)
                                    }}
                                  >
                                    <SmallCloseIcon color="gray.500" mr="2" />
                                    Delete all Shape items
                                  </MenuItem>

                                  <MenuItem
                                    onClick={() => {
                                      store.editor?.clearItems('bg', true)
                                    }}
                                  >
                                    <SmallCloseIcon color="gray.500" mr="2" />
                                    Delete all Background items
                                  </MenuItem>
                                </MenuList>
                              )}
                            </MenuTransition>
                          </Portal>
                        </Menu>

                        <Button
                          variant="outline"
                          py="1"
                          onClick={() => {
                            store.enterEditItemsMode()
                          }}
                        >
                          Edit Items
                        </Button>
                      </>
                    )}

                    {store.mode === 'edit' && (
                      <>
                        <Button
                          mr="2"
                          isDisabled={!store.hasItemChanges}
                          variant="ghost"
                          onClick={() => store.resetAllItems()}
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
                              onClick={() => {
                                if (!store.selectedItemData) {
                                  return
                                }
                                store.setItemLock(
                                  !Boolean(store.selectedItemData.locked)
                                )
                              }}
                              css={css`
                                width: 84px;
                              `}
                            >
                              {store.selectedItemData.locked
                                ? 'Unlock'
                                : 'Lock'}
                            </Button>
                          </>
                        )}

                        <Button
                          ml="2"
                          py="1"
                          colorScheme="green"
                          onClick={() => {
                            store.enterViewMode()
                          }}
                        >
                          Done
                        </Button>
                      </>
                    )}
                  </Box>
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

        <WarningModal
          isOpen={isShowingEmptyIconsWarning}
          onClose={() => {
            setIsShowingEmptyIconsWarning(false)
          }}
          header="There is no items to visualize"
          content="Please add some words or icons to your design before visualizing."
        />

        <WarningModal
          isOpen={store.langCheckErrors != null}
          onClose={() => {
            store.langCheckErrors = null
          }}
          header="Please choose different fonts"
          children={
            <>
              <p>Selected fonts don't support symbols used in these words:</p>
              <Box mb="4">
                {(store.langCheckErrors ?? []).slice(10).map((e, index) => (
                  <Box key={index}>{e.word}</Box>
                ))}
              </Box>
              <p>
                <strong>
                  Please choose other fonts that support these languages.
                </strong>
              </p>
              <p>
                You can easily find fonts for your language using the "Language"
                filter in the font selector window.
              </p>
            </>
          }
        />

        <ConfirmModalWithRecaptcha
          isOpen={isShowingSignupModal}
          onCancel={() => setIsShowingSignupModal(false)}
          onSubmit={saveAnonymously}
          title="Please sign up to save your work"
          submitText="Sign up and save"
        >
          TODO
        </ConfirmModalWithRecaptcha>
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
  background: white;
  height: 60px;
`

const TopNavWrapper = styled(Box)<{ theme: any }>`
  height: 60px;
  padding: 10px 20px;
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
  z-index: 20;
  box-shadow: 0 0 5px 0 #00000033;
  flex: 1;
  width: 350px;
`

const SideNavbar = styled.div<{ theme: any; activeIndex?: number }>`
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
  background: white;

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
  height: calc(100vh - 120px);
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

export type TargetTab = 'shape' | 'bg'
export type LeftPanelTab =
  | 'shapes'
  | 'words'
  | 'fonts'
  | 'symbols'
  | 'colors'
  | 'layout'
const leftPanelTabs: LeftPanelTab[] = [
  'shapes',
  'words',
  'fonts',
  'symbols',
  'layout',
  'colors',
]
