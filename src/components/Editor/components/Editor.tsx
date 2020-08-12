import {
  Box,
  Button,
  Editable,
  EditableInput,
  EditablePreview,
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
  Portal,
  Progress,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/core'
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  DownloadIcon,
  SmallCloseIcon,
} from '@chakra-ui/icons'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import * as Sentry from '@sentry/react'
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
import { LeftPanelResizeTab } from 'components/Editor/components/LeftPanelResizeTab'
import { LeftPanelWordsTab } from 'components/Editor/components/LeftPanelWordsTab'
import { LeftPanelShapesTab } from 'components/Editor/components/ShapesTab/LeftPanelShapesTab'
import { Spinner } from 'components/Editor/components/Spinner'
import { WarningModal } from 'components/Editor/components/WarningModal'
import {
  EditorStore,
  EditorStoreContext,
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
import {
  UpgradeModalContainer,
  useUpgradeModal,
} from 'components/upgrade/UpgradeModal'
import { config } from 'config'
import { saveAs } from 'file-saver'
import { canvasToDataUri, Dimensions } from 'lib/wordart/canvas-utils'
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
  FiDownload,
  FiEdit,
  FiFilePlus,
  FiHelpCircle,
  FiMenu,
  FiPrinter,
  FiSave,
} from 'react-icons/fi'
import { IoMdResize } from 'react-icons/io'
import { Api, ApiErrors } from 'services/api/api'
import { WordcloudId } from 'services/api/types'
import { useStore } from 'services/root-store'
import { Urls } from 'urls'
import { useToasts } from 'use-toasts'
import { openUrlInNewTab } from 'utils/browser'
import 'utils/canvas-to-blob'
import { getTabTitle } from 'utils/tab-title'
import { useWarnIfUnsavedChanges } from 'utils/use-warn-if-unsaved-changes'
import { uuid } from 'utils/uuid'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import { WordColorPickerPopover } from './WordColorPickerPopover'

export type EditorComponentProps = {
  wordcloudId?: WordcloudId
}

const UnsavedChangesMsg = 'If you leave the page, unsaved changes will be lost.'

export const EditorComponent: React.FC<EditorComponentProps> = observer(
  (props) => {
    const [store] = useState(() => new EditorStore())

    const state = useLocalStore(() => ({
      title: 'New wordart',
      leftTab: 'shapes' as LeftPanelTab,
      leftPanelContext: 'normal' as 'normal' | 'resize',
      isShowingExport: false,
      isShowingExportNoItemsWarning: false,
    }))

    const upgradeModal = useUpgradeModal()
    const toasts = useToasts()

    useEffect(() => {
      // @ts-ignore
      window['toast'] = toasts
    }, [])

    const aspectRatio = pageSizePresets[0].aspect
    const [canvasSize] = useState<Dimensions>({ w: 900 * aspectRatio, h: 900 })
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bgCanvasRef = useRef<HTMLCanvasElement>(null)
    const canvasWrapperRef = useRef<HTMLDivElement>(null)
    const { wordcloudsStore } = useStore()
    const { isSaving } = store

    const isNew = props.wordcloudId == null

    useEffect(() => {
      Sentry.configureScope((scope) => {
        scope.setTag('wordcloud_id', props.wordcloudId || 'unsaved')
      })
    }, [props.wordcloudId])

    const { authStore } = useStore()
    const { profile } = authStore

    const hasActivePlan = profile
      ? profile.limits.isActiveDownloadsPack ||
        profile.limits.isActiveUnlimitedPlan
      : false

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

    const handleDelete = async () => {
      if (!props.wordcloudId) {
        return
      }
      if (
        !window.confirm(
          'Are you sure you want to delete this design? You will not be able to undo it.'
        )
      ) {
        return
      }

      await wordcloudsStore.delete([props.wordcloudId])
      router.replace(Urls.yourDesigns)
    }

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

        toasts.showSuccess({
          title: 'Your work is saved. Please sign up to continue.',
          duration: 10000,
          isClosable: true,
        })
      } finally {
        store.isSaving = false
      }
    }

    const handleSaveClick = useCallback(() => {
      const showSaveToast = () =>
        toasts.showSuccess({
          id: 'work-saved',
          title: 'Your work is saved',
          isClosable: true,
        })

      if (!store.hasUnsavedChanges && !isNew) {
        showSaveToast()
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
        const itemsCount = store.getItemsCount().total
        if (itemsCount === 0) {
          window.alert(
            'Your design is empty. Please click "Visualize" before saving to place some words.'
          )
          return
        }

        store.enterViewMode()

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
          showSaveToast()
          store.hasUnsavedChanges = false
        } catch (error) {
          if (
            error.response?.data?.message === ApiErrors.NoMediaUploadFreePlan
          ) {
            upgradeModal.show('custom-fonts')
          } else if (
            error.response?.data?.message === ApiErrors.WordcloudsLimit
          ) {
            upgradeModal.show('design-limits')
          } else {
            throw error
          }
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
            await wordcloudsStore.fetchWordcloudById(props.wordcloudId)
            const wordcloud = wordcloudsStore.getById(props.wordcloudId)

            if (wordcloud) {
              state.title = wordcloud.title
            }

            try {
              const editorData = await Api.wordclouds.fetchEditorData(
                props.wordcloudId
              )
              editorParams.serialized = editorData
            } catch (error) {
              console.error(error)
              toasts.showError({
                title: 'Error loading the design',
                description:
                  "Sorry, we couldn't load this design. If you believe it's a problem on our end, please contact our support at support@wordcloudy.com",
                isClosable: true,
                duration: 8000,
              })
              router.replace(Urls.yourDesigns)
            }
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
      } as { [format in DownloadFormat]: string })[selectedFormat] as
        | 'svg'
        | 'png'
        | 'jpeg'

      if (hd) {
        if (!profile) {
          upgradeModal.show('hq-download')
          return
        }
      }

      const startExport = async () => {
        const dimension = hd ? 4096 : 1024
        if (!store.editor) {
          return
        }

        setIsExporting(true)

        try {
          if (hd) {
            const result = await Api.wordclouds.hdDownload({
              wordcloudVersion: store.editor.version,
              wordloudKey: store.editor.key,
            })

            if (!result.canDownload) {
              console.log('API: can not download')
              upgradeModal.show('hq-download')
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
    }, [store, selectedFormat, profile])

    const closeExport = useCallback(() => {
      state.isShowingExport = false
    }, [])

    const openExport = useCallback(() => {
      const itemsCount = store.getItemsCount().total
      if (itemsCount > 0) {
        state.isShowingExport = true
      } else {
        state.isShowingExportNoItemsWarning = true
      }
    }, [])

    const cancelVisualization = () => {
      store.editor?.cancelVisualization()
      toasts.showInfo({
        title: 'Visualization cancelled',
        duration: 2000,
        isClosable: true,
      })
    }

    useEffect(() => {
      window.addEventListener('beforeprint', (evt) => {
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

    const hasShapeItems = store.editor
      ? store.editor.items.shape.items.length > 0
      : false
    const hasBgItems = store.editor
      ? store.editor.items.bg.items.length > 0
      : false
    const hasItems = hasShapeItems || hasBgItems

    const leftTab = state.leftTab

    const handleVisualizeClick = async () => {
      const bgCount =
        store.styleOptions.bg.items.words.wordList.length +
        store.styleOptions.bg.items.icons.iconList.length
      const shapeCount =
        store.styleOptions.shape.items.words.wordList.length +
        store.styleOptions.shape.items.icons.iconList.length

      if (bgCount + shapeCount === 0) {
        await store.editor?.clearItems('shape')
        await store.editor?.clearItems('bg')
        setIsShowingEmptyIconsWarning(true)
        return
      }

      try {
        if (shapeCount > 0) {
          await store.editor?.generateShapeItems({
            style: mkShapeStyleConfFromOptions(store.styleOptions.shape),
          })
        } else {
          await store.editor?.clearItems('shape')
        }
        if (bgCount > 0) {
          await store.editor?.generateBgItems({
            style: mkBgStyleConfFromOptions(store.styleOptions.bg),
          })
        } else {
          await store.editor?.clearItems('bg')
        }
      } catch (error) {
        store.isVisualizing = false
        toasts.showError({
          title:
            'Sorry, there was an error. Please contact us at support@wordcloudy.com',
        })
        throw error
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
      <EditorStoreContext.Provider value={store}>
        <PageLayoutWrapper>
          <Helmet>
            <title>{getTabTitle(state.title || 'Untitled')}</title>
          </Helmet>

          <UpgradeModalContainer />

          <Hotkeys
            keyName="cmd+s,ctrl+s"
            onKeyDown={(shortcut, event) => {
              event.preventDefault()
              handleSaveClick()
            }}
          />

          <TopNavWrapper alignItems="center" display="flex">
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
              <MenuButton
                mr="2"
                as={TopNavButton}
                variant="primary"
                leftIcon={<FiMenu />}
              >
                Menu
              </MenuButton>
              <Portal>
                <MenuTransition>
                  {(styles) => (
                    // @ts-ignore
                    <MenuList css={styles} zIndex={4}>
                      <MenuItem
                        onClick={() =>
                          openUrlInNewTab(
                            `${config.baseUrl}${Urls.editor.create}`
                          )
                        }
                      >
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
                      {/* <MenuItem>
                        <FiCopy
                          css={css`
                            margin-right: 4px;
                          `}
                        />
                        Make Copy
                      </MenuItem> */}

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
                      <MenuItem isDisabled={isNew} onClick={handleDelete}>
                        <BsTrash
                          css={css`
                            margin-right: 4px;
                          `}
                        />
                        Delete
                      </MenuItem>
                      <MenuDivider />
                      <MenuItem
                        onClick={() => {
                          router.push(Urls.yourDesigns)
                        }}
                      >
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
                id="title-input"
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

            <Menu isLazy>
              <MenuButton
                as={TopNavButton}
                colorScheme="secondary"
                mr="2"
                ml="auto"
              >
                <FiHelpCircle
                  css={css`
                    margin-right: 4px;
                    display: inline-block;
                  `}
                />
                Help
                <span
                  css={css`
                    @media screen and (max-width: 1010px) {
                      display: none;
                    }
                  `}
                >
                  {' & Tutorials'}
                </span>
              </MenuButton>

              <MenuTransition>
                {(styles) => (
                  <Portal>
                    <MenuList
                      // @ts-ignore
                      css={css`
                        ${styles}
                        max-width: 320px;
                      `}
                    >
                      <MenuItemWithDescription
                        title="Open Tutorials"
                        description="Learn how to use Wordcloudy"
                        onClick={() => {
                          openUrlInNewTab(
                            `https://blog.wordcloudy.com/tag/tutorials/`
                          )
                        }}
                      />
                      <MenuItemWithDescription
                        title="Read FAQ"
                        description="Find answers to commonly asked questions"
                        onClick={() => {
                          openUrlInNewTab(`${config.baseUrl}${Urls.faq}`)
                        }}
                      />
                      <MenuItemWithDescription
                        title="Contact us"
                        description="Report a problem, give feedback, suggest a feature or ask us anything!"
                        onClick={() => {
                          openUrlInNewTab(`${config.baseUrl}${Urls.contact}`)
                        }}
                      />
                    </MenuList>
                  </Portal>
                )}
              </MenuTransition>
            </Menu>

            {!hasActivePlan && (
              <Button
                colorScheme="accent"
                onClick={() => upgradeModal.show('generic')}
              >
                Upgrade
              </Button>
            )}
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
                      leftTab === 'symbols' &&
                      state.leftPanelContext === 'normal'
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
                      leftTab === 'layout' &&
                      state.leftPanelContext === 'normal'
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
                      leftTab === 'colors' &&
                      state.leftPanelContext === 'normal'
                    }
                  >
                    <ColorPalette className="icon" />
                    Colors
                  </LeftNavbarBtn>

                  <div
                    css={css`
                      flex: 1;
                      display: flex;
                      align-items: flex-end;
                    `}
                  >
                    <img
                      src="/images/logo.svg"
                      css={css`
                        opacity: 0.5;
                        margin: 0 auto 30px;
                      `}
                    />
                  </div>
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
                  isOpen={state.isShowingExport}
                  onClose={closeExport}
                  trapFocus={false}
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
                              <strong>Standard Download,</strong> for personal
                              use only
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
                              <Stack
                                direction="row"
                                spacing="3"
                                flexWrap="wrap"
                              >
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
                        isLoading={store.editor?.isUndoing}
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
                        isLoading={store.editor?.isRedoing}
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
                                      isDisabled={!hasShapeItems}
                                    >
                                      <SmallCloseIcon color="gray.500" mr="2" />
                                      Delete all Shape items
                                    </MenuItem>

                                    <MenuItem
                                      onClick={() => {
                                        store.editor?.clearItems('bg', true)
                                      }}
                                      isDisabled={!hasBgItems}
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
                              <WordColorPickerPopover />

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
                <Box as="ul" mb="4">
                  {(store.langCheckErrors ?? [])
                    .slice(0, 10)
                    .map((e, index) => (
                      <li key={index}>{e.word}</li>
                    ))}
                </Box>
                <p>
                  <strong>
                    Please choose other fonts that support these languages.
                  </strong>
                </p>
                <p>
                  You can easily find fonts for your language using the
                  "Language" filter in the font selector window.
                </p>
              </>
            }
          />

          <ConfirmModalWithRecaptcha
            isOpen={isShowingSignupModal}
            onCancel={() => setIsShowingSignupModal(false)}
            onSubmit={saveAnonymously}
            title="Please sign in to save your work"
            cancelText="No, thanks"
            submitText="Save and continue"
          >
            <p>
              To save your design to your Wordcloudy account, you'll need to
              sign in.
            </p>
            <p>
              Please proceed to sign in form – your work will be saved. If you
              don't have an account yet, you'll be able to create one.
            </p>
          </ConfirmModalWithRecaptcha>
        </PageLayoutWrapper>
      </EditorStoreContext.Provider>
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
  height: calc(100% - 60px);
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
  height: ${(p) => (p.noScroll ? '100%' : 'calc(100vh - 60px)')};
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
