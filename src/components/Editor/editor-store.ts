import { TargetTab } from 'components/Editor/components/editor-components'
import {
  defaultBgStyleOptions,
  defaultShapeStyleOptions,
} from 'components/Editor/default-style-options'
import {
  Editor,
  EditorInitParams,
  TargetKind,
} from 'components/Editor/lib/editor'
import {
  EditorItem,
  EditorItemConfig,
  EditorItemId,
} from 'components/Editor/lib/editor-item'
import { EditorItemConfigShape } from 'components/Editor/lib/editor-item-icon'
import { EditorItemConfigWord } from 'components/Editor/lib/editor-item-word'
import {
  applyTransformToObj,
  cloneObj,
  getObjTransformMatrix,
  objAsCanvasElement,
} from 'components/Editor/lib/fabric-utils'
import { Font } from 'components/Editor/lib/generator'
import {
  defaultPageSizePreset,
  getAspect,
  PageSize,
  PageSizePreset,
  pageSizePresets,
  PageSizeSettings,
} from 'components/Editor/page-size-presets'
import { Shape } from 'components/Editor/shape'
import {
  ShapeClipartConf,
  ShapeConf,
  ShapeIconConf,
  ShapeId,
} from 'components/Editor/shape-config'
import {
  getAnglesForPreset,
  mkBgStyleConfFromOptions,
  mkShapeStyleConfFromOptions,
  ThemePreset,
} from 'components/Editor/style'
import {
  BgFill,
  BgStyleOptions,
  ItemsColoringColorConf,
  ItemsColoringGradientConf,
  ItemsColoringShapeConf,
  ShapeStyleOptions,
  WordListEntry,
} from 'components/Editor/style-options'
import { themePresets } from 'components/Editor/theme-presets'
import { ItemUpdateUndoData } from 'components/Editor/undo'
import {
  FontConfig,
  FontId,
  fonts,
  FontStyleConfig,
  loadFontsConfig,
  popularFonts,
} from 'data/fonts'
import { icons, loadIconsConfig } from 'data/icons'
import {
  getSortedIconsShapes,
  getSortedImageShapes,
  loadShapesConfig,
  shapes,
} from 'data/shapes'
import { createCanvas } from 'lib/wordart/canvas-utils'
import { loadFont } from 'lib/wordart/fonts'
import { cloneDeep, uniq, uniqBy } from 'lodash'
import { action, observable, set, toJS } from 'mobx'
import paper from 'paper'
import React, { useContext } from 'react'
import {
  MatrixSerialized,
  PersistedCustomFontV1,
  PersistedItemShapeV1,
  PersistedItemV1,
  PersistedItemWordV1,
  PersistedShapeConfV1,
  PersistedWordV1,
} from 'services/api/persisted/v1'
import { EditorPersistedData } from 'services/api/types'
import { RootStore, rootStore } from 'services/root-store'
import { animateElement } from 'utils/animation'
import { consoleLoggers } from 'utils/console-logger'
import { UniqIdGenerator } from 'utils/ids'
import { notEmpty } from 'utils/not-empty'
import { roundFloat } from 'utils/round-float'
import { exhaustiveCheck } from 'utils/type-utils'

export type EditorMode = 'view' | 'edit'

export type EditorStoreInitParams = Pick<
  EditorInitParams,
  'aspectRatio' | 'canvas' | 'bgCanvas' | 'canvasWrapperEl' | 'serialized'
>

export class EditorStore {
  logger = consoleLoggers.editorStore
  @observable lifecycleState:
    | 'initial'
    | 'initializing'
    | 'initialized'
    | 'destroyed' = 'initial'

  rootStore: RootStore
  editor: Editor | null = null
  @observable renderKey = 1
  @observable isSaving = false

  @observable leftColorTab = {
    showShapeItemsAdvanced: false,
    showBgItemsAdvanced: false,
  }

  visualizeAnimatedLastTime: Date | null = null

  @observable langCheckErrors: { word: string }[] | null = null
  @observable isVisualizing = false
  @observable visualizingProgress = null as number | null
  @observable visualizingStep: 'generating' | 'drawing' | null = null

  @observable mode: EditorMode = 'view'

  @observable customFonts: FontConfig[] = []

  @observable shapesPanel = leftPanelShapesInitialState
  /** Ui state of the various settings of the editor */
  @observable styleOptions = {
    bg: defaultBgStyleOptions,
    shape: defaultShapeStyleOptions,
  }

  @observable pageSize: PageSizeSettings = {
    preset: defaultPageSizePreset,
    custom: {
      width: 16,
      height: 9,
      unit: 'in',
    },
  }

  @observable leftTabIsTransformingShape = false
  @observable targetTab = 'shape' as TargetTab
  @observable hasItemChanges = false
  @observable availableImageShapes: ShapeClipartConf[] = []
  @observable availableIconShapes: ShapeIconConf[] = []
  @observable hasUnsavedChanges = false

  @observable selectedShapeConf: ShapeConf | null = null

  wordIdGen = new UniqIdGenerator(3)
  customImgIdGen = new UniqIdGenerator(3)
  customFontIdGen = new UniqIdGenerator(4)
  fontsCache = new Map<FontId, opentype.Font>()

  constructor() {
    this.rootStore = rootStore
  }

  @observable selectedItemData: {
    id: EditorItemId
    locked: boolean
    transform: MatrixSerialized
    color: string
    customColor: string | undefined
    customText: string | undefined
  } | null = null
  selectedItem: EditorItem | null = null

  @action initEditor = async (
    params: EditorStoreInitParams,
    pageSize?: PageSizeSettings
  ) => {
    this.logger.debug('initEditor', params)
    this.lifecycleState = 'initializing'

    await Promise.all([
      fonts.length === 0 ? loadFontsConfig() : Promise.resolve(),
      icons.length === 0 ? loadIconsConfig() : Promise.resolve(),
      shapes.length === 0 ? loadShapesConfig() : Promise.resolve(),
    ])
    this.availableImageShapes = getSortedImageShapes(shapes)
    this.availableIconShapes = getSortedIconsShapes(icons)

    this.styleOptions.bg.items.words.fontIds = [
      this.getAvailableFonts({ popular: true })[1].defaultStyle.fontId,
    ]

    this.editor = new Editor({
      ...params,
      store: this,
      onItemSelected: (item) => {
        const selectionBefore = this.getStateSnapshot().selection

        this.selectedItem = item
        this.selectedItemData = {
          id: item.id,
          locked: item.locked,
          color: item.color,
          transform: item.transform.values as MatrixSerialized,
          customColor: item.customColor,
          customText: item.kind === 'word' ? item.customText : '',
        }

        const selectionAfter = this.getStateSnapshot().selection
        this.editor?.pushUndoFrame({
          kind: 'selection-change',
          before: selectionBefore,
          after: selectionAfter,
        })
      },
      onItemSelectionCleared: () => {
        const selectionBefore = this.getStateSnapshot().selection
        this.selectedItemData = null
        this.selectedItem = null
        this.editor?.pushUndoFrame({
          kind: 'selection-change',
          before: selectionBefore,
          after: null,
        })
      },
      onItemUpdated: (item, newTransform) => {
        // TODO
        const before: ItemUpdateUndoData = {
          customColor: item.customColor,
          locked: item.locked,
          transform: [...item.transform.values] as MatrixSerialized,
        }
        this.hasItemChanges = true
        this.selectedItem = item
        this.selectedItemData = {
          id: item.id,
          transform: newTransform,
          locked: item.locked,
          color: item.color,
          customColor: item.customColor,
          customText: item.kind === 'word' ? item.customText : '',
        }
        const after: ItemUpdateUndoData = {
          ...before,
          transform: newTransform,
        }
        if (!this.editor) {
          return
        }
        this.editor.pushUndoFrame({
          kind: 'item-update',
          item,
          before,
          after,
          versionBefore: this.editor.version,
          versionAfter: this.editor.version + 1,
        })
        this.editor.version++
      },
    })

    this.editor.setBgColor(mkBgStyleConfFromOptions(this.styleOptions.bg).fill)
    if (this.styleOptions.bg.fill.kind === 'transparent') {
      this.editor.setBgOpacity(0)
    } else if (this.styleOptions.bg.fill.kind === 'color') {
      this.editor.setBgOpacity(this.styleOptions.bg.fill.color.opacity / 100)
    }
    // @ts-ignore
    window['editor'] = this.editor

    if (params.serialized) {
      await this.loadSerialized(params.serialized, pageSize)
    } else {
      const defaultIcon = this.availableIconShapes.find(
        (i) => i.id === 'fa-solid-heart'
      )!
      await this.selectShape(defaultIcon)
      this.shapesPanel.icon.selected = defaultIcon.id

      const defaultShape = this.availableImageShapes[
        Math.floor(Math.random() * 12)
      ]
      this.shapesPanel.image.selected = defaultShape.id
    }

    this.enterViewMode('shape')

    this.lifecycleState = 'initialized'

    this.hasUnsavedChanges = false
  }

  getItemsCount = () => {
    const shape = this.editor?.items?.shape?.items?.length || 0
    const bg = this.editor?.items?.bg?.items?.length || 0
    const total = shape + bg
    return { shape, bg, total }
  }

  removeItem = () => {}

  setItemLock = (lockValue: boolean) => {
    if (!this.selectedItem || !this.selectedItemData) {
      return
    }
    const before = this.getSelectedItemUndoData()
    this.selectedItem.setLocked(lockValue)
    this.selectedItemData.locked = lockValue
    const after = this.getSelectedItemUndoData()
    if (!this.editor) {
      return
    }
    this.editor.pushUndoFrame({
      kind: 'item-update',
      item: this.selectedItem,
      before,
      after,
      versionAfter: this.editor.version,
      versionBefore: this.editor.version,
    })
    this.editor.canvas.requestRenderAll()
  }

  resetAllItems = async (target?: TargetKind) => {
    if (!this.editor) {
      return
    }

    const versionBefore = this.editor.version
    const dataBefore = await this.serialize()
    const stateBefore = this.getStateSnapshot()
    if (target) {
      this.editor.resetAllItems(target)
    } else {
      this.editor.resetAllItems('shape')
      this.editor.resetAllItems('bg')
    }
    this.editor.canvas.discardActiveObject(new Event('no-callbacks'))

    const dataAfter = await this.serialize()
    const stateAfter = this.getStateSnapshot()

    this.editor.undoStack.push({
      kind: 'visualize',
      dataAfter,
      dataBefore,
      stateAfter,
      stateBefore,
      versionAfter: this.editor.version,
      versionBefore,
    })

    this.hasItemChanges = false
  }

  setItemCustomColor = (color: string) => {
    if (!this.selectedItem || !this.selectedItemData || !this.editor) {
      return
    }

    const versionBefore = this.editor.version
    const before = this.getSelectedItemUndoData()

    this.hasItemChanges = true
    this.selectedItem.setCustomColor(color)
    this.selectedItem.setLocked(true)
    this.selectedItemData.customColor = color
    this.selectedItemData.locked = true
    this.editor.canvas.requestRenderAll()

    const after = this.getSelectedItemUndoData()

    this.editor.pushUndoFrame({
      kind: 'item-update',
      item: this.selectedItem,
      before,
      after,
      versionBefore,
      versionAfter: this.editor.version,
    })
  }
  private getSelectedItemUndoData = (): ItemUpdateUndoData => {
    if (!this.selectedItem) {
      throw new Error('no selected item')
    }
    return {
      customColor: this.selectedItem.customColor,
      locked: this.selectedItem.locked,
      transform: [...this.selectedItem.transform.values] as MatrixSerialized,
    }
  }

  resetItemCustomColor = () => {
    if (!this.selectedItem || !this.selectedItemData) {
      return
    }
    this.selectedItem.clearCustomColor()
    this.selectedItemData.customColor = undefined
    this.editor?.canvas.requestRenderAll()
  }

  @action enterEditItemsMode = (target?: TargetKind) => {
    this.logger.info(`enterEditItemsMode: ${target}`)

    this.mode = 'edit'
    if (!this.editor) {
      return
    }
    if (target) {
      this.editor.showLockBorders(target)
      this.editor.enableItemsSelection(target)
    } else {
      this.editor.showLockBorders('shape')
      this.editor.enableItemsSelection('shape')
      this.editor.showLockBorders('bg')
      this.editor.enableItemsSelection('bg')
    }
    this.editor.enableSelectionMode()
  }

  @action enterViewMode = (target?: TargetKind) => {
    this.logger.info(`enterViewMode: ${target}`)

    this.mode = 'view'
    if (!this.editor) {
      return
    }
    this.selectedItemData = null
    this.selectedItem = null
    if (target) {
      this.editor.hideLockBorders(target)
      this.editor.disableItemsSelection(target)
    } else {
      this.editor.hideLockBorders('shape')
      this.editor.disableItemsSelection('shape')
      this.editor.hideLockBorders('bg')
      this.editor.disableItemsSelection('bg')
    }
    this.editor.disableSelectionMode()
  }

  @action loadSerialized = async (
    serialized: EditorPersistedData,
    /** Whether to resize the page to a different page size (e.g. for starting templates) */
    resizePage?: PageSizeSettings
  ) => {
    const shouldShowModal =
      serialized.data.bgItems.items.length > 0 ||
      serialized.data.shapeItems.items.length > 0
    if (shouldShowModal) {
      this.isVisualizing = true
      this.visualizingStep = 'drawing'
      this.visualizingProgress = 0
    }
    this.logger.debug('loadSerialized', serialized)
    if (!this.editor) {
      throw new Error('editor is not initialized')
    }
    const { data } = serialized

    const shouldVisualizeItems = !resizePage
    const shouldGenerateItems = !shouldVisualizeItems

    if (resizePage) {
      await this.setPageSize(resizePage, false)
    } else {
      this.editor.setAspectRatio(
        serialized.data.sceneSize.w / serialized.data.sceneSize.h,
        false
      )

      // Find the closest match among page size presets
      const matchingPageSizePreset = pageSizePresets.find(
        (p) =>
          Math.abs(
            p.width / p.height -
              serialized.data.sceneSize.w / serialized.data.sceneSize.h
          ) /
            (p.width / p.height) <
          1e-1
      )
      if (matchingPageSizePreset) {
        this.pageSize.preset = matchingPageSizePreset
      } else {
        this.pageSize.preset = null
        this.pageSize.custom.width = serialized.data.sceneSize.w
        this.pageSize.custom.height = serialized.data.sceneSize.h
      }
    }

    for (const font of serialized.data.customFonts) {
      await this.addCustomFont(font)
    }

    if (data.shape.kind === 'custom:raster') {
      const customShapeConf: ShapeConf = {
        kind: 'custom:raster',
        url: data.shape.url,
        thumbnailUrl: data.shape.url,
        processedThumbnailUrl: data.shape.url,
        processing: data.shape.processing || {},
      }
      if (data.shape.processing?.fill?.color) {
        this.shapesPanel.customImage.fillColor =
          data.shape.processing?.fill?.color
      }
      await this.selectShape(customShapeConf, false, false)
    } else if (data.shape.kind === 'text') {
      const customShapeConf: ShapeConf = {
        kind: 'text',
        thumbnailUrl: '',
        text: data.shape.text,
        textStyle: data.shape.textStyle,
      }
      this.updateColorForAllShapeTypes(data.shape.textStyle.color)
      await this.selectShape(customShapeConf, false, false)
    } else if (data.shape.kind === 'blob') {
      const customShapeConf: ShapeConf = {
        kind: 'blob',
        color: data.shape.color,
        complexity: data.shape.complexity,
        points: data.shape.points,
        pathData: data.shape.pathData,
      }
      this.updateColorForAllShapeTypes(data.shape.color)
      await this.selectShape(customShapeConf, false, false)
    } else if (data.shape.kind === 'full-canvas') {
      const customShapeConf: ShapeConf = {
        kind: 'full-canvas',
        color: data.shape.color,
      }
      this.updateColorForAllShapeTypes(data.shape.color)
      await this.selectShape(customShapeConf, false, false)
    } else if (
      (data.shape.kind === 'clipart:raster' ||
        data.shape.kind === 'clipart:svg' ||
        data.shape.kind === 'icon') &&
      data.shape.shapeId != null
    ) {
      let shapeId = data.shape.shapeId
      let shapeConf =
        this.availableIconShapes.find((s) => s.id === shapeId) ||
        this.availableImageShapes.find((s) => s.id === shapeId)

      if (!shapeConf) {
        console.error(`shape config not found for shape id ${shapeId}`)
        shapeId = this.availableIconShapes[0].id
        shapeConf = this.availableIconShapes[0]
      }

      if (
        data.shape.kind === 'clipart:svg' &&
        shapeConf.kind === 'clipart:svg'
      ) {
        if (data.shape.processing?.colors.kind === 'single-color') {
          const color = data.shape.processing?.colors.color
          this.updateColorForAllShapeTypes(color)
        }
      } else if (data.shape.kind === 'icon' && shapeConf.kind === 'icon') {
        shapeConf.color = data.shape.color
        this.updateColorForAllShapeTypes(data.shape.color)
      }

      await this.selectShape(shapeConf, false, false)
    }

    const shape = this.editor.shape
    if (!this.selectedShapeConf || !shape) {
      return
    }

    if ('transform' in data.shape && !resizePage) {
      applyTransformToObj(shape.obj, data.shape.transform)
      if (
        shape.kind === 'clipart:svg' ||
        shape.kind === 'custom:svg' ||
        shape.kind === 'icon'
      ) {
        applyTransformToObj(shape.objOriginalColors, data.shape.transform)
      }
      shape.transform = data.shape.transform
    }

    if (resizePage) {
      await this.setPageSize(resizePage, true)
    }

    if (
      (shape.kind === 'clipart:svg' || shape.kind === 'custom:svg') &&
      (data.shape.kind === 'clipart:svg' || data.shape.kind === 'custom:svg') &&
      data.shape.processing
    ) {
      shape.config.processing = data.shape.processing
    } else if (
      shape &&
      (shape.kind === 'clipart:raster' || shape.kind === 'custom:raster') &&
      (data.shape.kind === 'clipart:raster' ||
        data.shape.kind === 'custom:raster') &&
      data.shape.processing
    ) {
      shape.config.processing = data.shape.processing
    }

    const sceneSize = this.editor.getSceneBounds(0)
    const scale = sceneSize.width / serialized.data.sceneSize.w
    const bgStyle = this.styleOptions.bg
    const shapeStyle = this.styleOptions.shape

    // // Restore BG style options
    if (data.bgStyle.fill.kind === 'color') {
      this.styleOptions.bg.fill.color = data.bgStyle.fill
    } else if (data.bgStyle.fill.kind === 'transparent') {
      this.styleOptions.bg.fill.kind = 'transparent'
    }

    bgStyle.items.dimSmallerItems = data.bgStyle.items.dimSmallerItems
    bgStyle.items.brightness = data.bgStyle.items.brightness
    bgStyle.items.opacity = data.bgStyle.items.opacity
    bgStyle.items.placement = data.bgStyle.items.placement
    bgStyle.items.icons.iconList = data.bgStyle.items.icons.iconList
    bgStyle.items.words.customAngles = data.bgStyle.items.words.angles
    bgStyle.items.words.anglesPreset = data.bgStyle.items.words.anglePreset

    bgStyle.items.words.wordList = data.bgStyle.items.words.wordList
    bgStyle.items.words.fontIds = data.bgStyle.items.words.fontIds
    if (data.bgStyle.items.coloring.kind === 'color') {
      bgStyle.items.coloring.kind = 'color'
      bgStyle.items.coloring.color = {
        ...bgStyle.items.coloring.color,
        ...data.bgStyle.items.coloring,
      }
    } else if (data.bgStyle.items.coloring.kind === 'gradient') {
      bgStyle.items.coloring.kind = 'gradient'
      bgStyle.items.coloring.gradient = data.bgStyle.items.coloring
    }

    // Restore Shape style options
    shapeStyle.items.dimSmallerItems = data.shapeStyle.items.dimSmallerItems
    shapeStyle.items.brightness = data.shapeStyle.items.brightness
    shapeStyle.items.opacity = data.shapeStyle.items.opacity
    shapeStyle.items.placement = data.shapeStyle.items.placement
    shapeStyle.items.icons.iconList = data.shapeStyle.items.icons.iconList
    shapeStyle.items.words.customAngles = data.shapeStyle.items.words.angles
    shapeStyle.items.words.anglesPreset =
      data.shapeStyle.items.words.anglePreset

    shapeStyle.items.words.wordList = data.shapeStyle.items.words.wordList
    shapeStyle.items.words.fontIds = data.shapeStyle.items.words.fontIds
    shapeStyle.opacity = data.shapeStyle.opacity

    if (data.shapeStyle.items.coloring.kind === 'color') {
      shapeStyle.items.coloring.kind = 'color'
      shapeStyle.items.coloring.color = {
        ...shapeStyle.items.coloring.color,
        ...data.shapeStyle.items.coloring,
      }
    } else if (data.shapeStyle.items.coloring.kind === 'gradient') {
      shapeStyle.items.coloring.kind = 'gradient'
      shapeStyle.items.coloring.gradient = data.shapeStyle.items.coloring
    } else if (data.shapeStyle.items.coloring.kind === 'shape') {
      shapeStyle.items.coloring.kind = 'shape'
      shapeStyle.items.coloring.shape = data.shapeStyle.items.coloring
    }

    // RESTORE SHAPE PANEL STATE
    if (
      this.selectedShapeConf.kind === 'clipart:raster' ||
      this.selectedShapeConf.kind === 'clipart:svg'
    ) {
      this.shapesPanel.shapeKind = 'image'
      this.shapesPanel.image.selected = this.selectedShapeConf.id
      if (
        this.selectedShapeConf.kind === 'clipart:svg' &&
        this.selectedShapeConf.processing.colors.kind === 'single-color'
      ) {
        this.shapesPanel.image.singleColor = this.selectedShapeConf.processing.colors.color
      }
    } else if (
      this.selectedShapeConf.kind === 'custom:raster' ||
      this.selectedShapeConf.kind === 'custom:svg'
    ) {
      this.shapesPanel.shapeKind = 'custom image'
    } else {
      if (this.selectedShapeConf.kind === 'text') {
        this.shapesPanel.text.text = this.selectedShapeConf.text
        this.shapesPanel.text.color = this.selectedShapeConf.textStyle.color
        this.shapesPanel.text.fontId = this.selectedShapeConf.textStyle.fontId
      } else if (this.selectedShapeConf.kind === 'blob') {
        this.shapesPanel.blob.color = this.selectedShapeConf.color
        this.shapesPanel.blob.complexity = this.selectedShapeConf.complexity
        this.shapesPanel.blob.points = this.selectedShapeConf.points
      } else if (this.selectedShapeConf.kind === 'full-canvas') {
        this.shapesPanel.fullCanvas.color = this.selectedShapeConf.color
      } else if (this.selectedShapeConf.kind === 'icon') {
        this.shapesPanel.icon.color = this.selectedShapeConf.color
        this.shapesPanel.icon.selected = this.selectedShapeConf.id
      }

      this.shapesPanel.shapeKind = this.selectedShapeConf.kind
    }

    const deserializeItems = async ({
      items,
      words,
      fontIds,
    }: {
      items: PersistedItemV1[]
      words: PersistedWordV1[]
      fontIds: FontId[]
    }): Promise<EditorItemConfig[]> => {
      // Fetch all required Fonts
      const fontsById = new Map<FontId, Font>()
      for (const fontId of fontIds) {
        const font = await this.fetchFontById(fontId)
        if (!font) {
          throw new Error(`no font ${fontId}`)
        }
        fontsById.set(fontId, { otFont: font, id: fontId, isCustom: false })
      }
      const wordsInfoMap = new Map<
        string,
        { fontId: FontId; text: string; wordConfigId?: WordConfigId }
      >()
      const result: EditorItemConfig[] = []
      for (const [index, item] of items.entries()) {
        if (item.k === 'w') {
          const word = words[item.wi]
          const fontId = fontIds[word.fontIndex]
          const fontEntry = fontsById.get(fontId)
          if (!fontEntry) {
            console.error(`No font entry for fontId ${fontId}`)
            continue
          }
          const wordInfoId = `${fontId}-${word.text}`
          if (!wordsInfoMap.has(wordInfoId)) {
            wordsInfoMap.set(wordInfoId, {
              text: word.text,
              fontId,
              wordConfigId: word.id,
            })
          }
          const { text, wordConfigId } = wordsInfoMap.get(wordInfoId)!
          const wordItem: EditorItemConfigWord = {
            index: index,
            color: item.c,
            customColor: item.cc,
            opacity: 1,
            locked: item.l || false,
            shapeColor: item.sc,
            kind: 'word',
            transform: new paper.Matrix(item.t).prepend(
              new paper.Matrix().scale(scale, new paper.Point(0, 0))
            ),
            fontId,
            text,
            wordConfigId,
          }
          result.push(wordItem)
        }
        if (item.k === 's') {
          const shapeItem: EditorItemConfigShape = {
            index: index,
            color: item.c,
            customColor: item.cc,
            locked: item.l || false,
            shapeColor: item.sc,
            kind: 'shape',
            transform: new paper.Matrix(item.t).prepend(
              new paper.Matrix().scale(scale, new paper.Point(0, 0))
            ),
            shapeId: item.sId,
          }
          result.push(shapeItem)
        }
      }
      return result
    }

    this.editor.setShapeOpacity(shapeStyle.opacity / 100, false)

    if (shouldVisualizeItems) {
      const [shapeItems, bgItems] = await Promise.all([
        deserializeItems({
          items: data.shapeItems.items,
          fontIds: data.shapeItems.fontIds,
          words: data.shapeItems.words,
        }),
        deserializeItems({
          items: data.bgItems.items,
          fontIds: data.bgItems.fontIds,
          words: data.bgItems.words,
        }),
      ])

      await this.editor.setShapeItems(shapeItems, false)
      await this.editor.setBgItems(bgItems, false)
    }

    this.editor.setBgOpacity(
      bgStyle.fill.kind === 'transparent' ? 0 : bgStyle.fill.color.opacity / 100
    )
    this.editor.setBgColor(
      mkBgStyleConfFromOptions(this.styleOptions.bg).fill,
      false
    )
    const shapeConf = this.selectedShapeConf

    await this.editor.updateShapeColors(shapeConf, false)
    await this.editor.setShapeItemsStyle(
      mkShapeStyleConfFromOptions(this.styleOptions.shape).items,
      false
    )
    await this.editor.setBgItemsStyle(
      mkBgStyleConfFromOptions(this.styleOptions.bg).items,
      false
    )
    await this.updateShapeThumbnail()

    this.editor.bgCanvas.requestRenderAll()
    this.editor.canvas.requestRenderAll()

    this.editor.key = data.key
    this.editor.version = data.version

    if (shouldGenerateItems) {
      await this.visualizeAll()
    }

    if (shouldShowModal) {
      this.visualizingProgress = 1
      this.isVisualizing = false
      this.visualizingStep = null
    }
  }

  visualizeAll = async () => {
    const bgCount =
      this.styleOptions.bg.items.words.wordList.length +
      this.styleOptions.bg.items.icons.iconList.length
    const shapeCount =
      this.styleOptions.shape.items.words.wordList.length +
      this.styleOptions.shape.items.icons.iconList.length

    if (bgCount + shapeCount === 0) {
      await this.editor?.clearItems('shape')
      await this.editor?.clearItems('bg')
      return
    }

    try {
      if (shapeCount > 0) {
        await this.editor?.generateShapeItems({
          style: mkShapeStyleConfFromOptions(this.styleOptions.shape),
        })
      } else {
        await this.editor?.clearItems('shape')
      }
      if (bgCount > 0) {
        await this.editor?.generateBgItems({
          style: mkBgStyleConfFromOptions(this.styleOptions.bg),
        })
      } else {
        await this.editor?.clearItems('bg')
      }
    } catch (error) {
      this.isVisualizing = false
      throw error
    }
  }

  updateShapeThumbnail = async () => {
    if (!this.editor || !this.editor.shape) {
      return
    }
    const currentShapeConf = this.getSelectedShapeConf()
    if (!currentShapeConf) {
      return
    }
    const shape = await cloneObj(this.editor.shape.obj)
    applyTransformToObj(shape, this.editor.shape.originalTransform)

    shape.set({ opacity: 1 })
    const canvas = objAsCanvasElement(shape)
    if ('processedThumbnailUrl' in currentShapeConf) {
      currentShapeConf.processedThumbnailUrl = canvas.toDataURL()
    }
    this.renderKey++
  }

  /** Used for undo/redo */
  getStateSnapshot = (): EditorStateSnapshot => {
    if (!this.editor) {
      throw new Error('editor not initialized')
    }
    if (!this.selectedShapeConf) {
      throw new Error('no selected shape')
    }

    let selection: EditorStateSnapshot['selection'] = null
    if (this.selectedItem) {
      selection = { kind: 'item', item: this.selectedItem }
    } else if (
      this.editor.canvas.getActiveObject() === this.editor.shape?.obj
    ) {
      selection = { kind: 'shape' }
    }

    return {
      mode: this.editor.mode,
      shapeConf: cloneDeep(this.selectedShapeConf),
      activeLayer: this.targetTab,
      selection,
      leftTabIsTransformingShape: this.leftTabIsTransformingShape,
    }
  }

  restoreSelection = (selection: EditorStateSnapshot['selection']) => {
    if (!this.editor) {
      return
    }
    if (!selection) {
      this.editor.canvas.discardActiveObject(new Event('no-callbacks'))
    } else if (selection.kind === 'item') {
      this.editor.canvas.setActiveObject(
        selection.item.fabricObj,
        new Event('no-callbacks')
      )
      this.selectedItem = selection.item
      this.selectedItemData = {
        id: selection.item.id,
        transform: selection.item.transform.values as MatrixSerialized,
        locked: selection.item.locked,
        color: selection.item.color,
        customColor: selection.item.customColor,
        customText:
          selection.item.kind === 'word' ? selection.item.customText : '',
      }
    } else if (selection.kind === 'shape') {
      this.editor.selectShape()
    }
  }

  /** Used for undo/redo */
  restoreStateSnapshot = (state: EditorStateSnapshot) => {
    if (!this.editor) {
      return
    }

    // Edit / view mode
    this.enterViewMode('shape')
    this.enterViewMode('bg')

    if (state.mode === 'edit') {
      this.enterEditItemsMode(state.activeLayer)
    }

    // Shape
    this.selectedShapeConf = state.shapeConf
    this.updateShapeThumbnail()

    // Active layer
    this.targetTab = state.activeLayer

    // Selection
    this.restoreSelection(state.selection)

    // Left shape tab
    this.leftTabIsTransformingShape = state.leftTabIsTransformingShape
    if (this.leftTabIsTransformingShape) {
      this.editor.selectShape()
    } else {
      this.editor.deselectShape()
    }

    this.editor.bgCanvas.requestRenderAll()
    this.editor.canvas.requestRenderAll()
  }

  serialize = async (): Promise<EditorPersistedData> => {
    this.logger.debug('serialize', this.getShape()!.kind)
    if (!this.editor) {
      throw new Error('editor is not initialized')
    }

    const serializeMatrix = (
      t: paper.Matrix,
      precision = 3
    ): MatrixSerialized => [
      roundFloat(t.a, precision),
      roundFloat(t.b, precision),
      roundFloat(t.c, precision),
      roundFloat(t.d, precision),
      roundFloat(t.tx, precision),
      roundFloat(t.ty, precision),
    ]

    const serializeItems = (
      target: 'bg' | 'shape'
    ): {
      fontIds: FontId[]
      words: PersistedWordV1[]
      items: PersistedItemV1[]
    } => {
      if (!this.editor) {
        throw new Error('no editor')
      }

      let items = this.editor.getItemsSorted(target)
      let itemsMaxCount = this.styleOptions[target].items.placement
        .itemsMaxCount
      if (typeof itemsMaxCount === 'number') {
        items = items.slice(0, itemsMaxCount)
      }

      const fontIds: FontId[] = uniq(
        items
          .map((item) => {
            if (item.kind !== 'word') {
              return null
            }
            return item.font.id
          })
          .filter(notEmpty)
      )

      const words: (PersistedWordV1 | null)[] = items.map((item) => {
        if (item.kind !== 'word') {
          return null
        }
        const fontIndex = fontIds.findIndex((fId) => fId === item.font.id)
        return {
          fontIndex,
          text: item.customText || item.defaultText,
          id: item.wordConfigId,
        }
      })

      const uniqWords: PersistedWordV1[] = uniqBy(
        words.filter(notEmpty),
        (w) => `${w.fontIndex}.${w.text}`
      )

      return {
        fontIds,
        words: uniqWords,
        items: items
          .map((item, index) => {
            if (item.kind === 'word') {
              return {
                id: item.id,
                k: 'w',
                c: item.color,
                cc: item.customColor,
                t: serializeMatrix(item.transform),
                sc: item.shapeColor,
                l: item.locked,
                wi: uniqWords.findIndex(
                  (uw) =>
                    uw.fontIndex === words[index]!.fontIndex &&
                    uw.text === words[index]!.text
                ),
              } as PersistedItemWordV1
            }
            if (item.kind === 'shape') {
              return {
                k: 's',
                id: item.id,
                t: serializeMatrix(item.transform),
                sId: item.shapeId,
                sc: item.shapeColor,
                l: item.locked,
                c: item.color,
                cc: item.customColor,
              } as PersistedItemShapeV1
            }

            return null
          })
          .filter(notEmpty),
      }
    }

    const serializeShape = (shape: Shape): PersistedShapeConfV1 => {
      const transform = getObjTransformMatrix(this.getShape()!.obj)

      if (shape.kind === 'custom:raster') {
        return {
          kind: shape.kind,
          transform,
          url: shape.url,
          processing: shape.config.processing || {},
        }
      } else if (shape.kind === 'clipart:raster') {
        return {
          kind: shape.kind,
          transform,
          shapeId: shape.config.id,
          processing: shape.config.processing || {},
        }
      } else if (shape.kind === 'custom:svg') {
        return {
          kind: shape.kind,
          transform,
          url: shape.url,
          processing: shape.config.processing || {},
        }
      } else if (shape.kind === 'clipart:svg') {
        return {
          kind: shape.kind,
          transform,
          shapeId: shape.config.id,
          processing: shape.config.processing || {},
        }
      } else if (shape.kind === 'icon') {
        return {
          kind: 'icon',
          transform,
          shapeId: shape.config.id,
          color: shape.config.color,
        }
      } else if (shape.kind === 'text') {
        return {
          kind: shape.kind,
          text: shape.config.text,
          textStyle: shape.config.textStyle,
          transform,
        }
      } else if (shape.kind === 'blob') {
        return {
          kind: shape.kind,
          transform,
          pathData: shape.config.pathData,
          color: shape.config.color,
          complexity: shape.config.complexity,
          points: shape.config.points,
        }
      } else if (shape.kind === 'full-canvas') {
        return {
          kind: shape.kind,
          color: shape.config.color,
        }
      } else {
        exhaustiveCheck(shape)
      }
    }

    const serializeShapeItemsColoring = (
      coloring: ShapeStyleOptions['items']['coloring']
    ):
      | ItemsColoringColorConf
      | ItemsColoringGradientConf
      | ItemsColoringShapeConf => {
      if (coloring.kind === 'color') {
        return coloring.color
      }
      if (coloring.kind === 'gradient') {
        return coloring.gradient
      }
      if (coloring.kind === 'shape') {
        return coloring.shape
      }
      exhaustiveCheck(coloring.kind)
    }

    const serializeBgItemsColoring = (
      coloring: BgStyleOptions['items']['coloring']
    ): ItemsColoringColorConf | ItemsColoringGradientConf => {
      if (coloring.kind === 'color') {
        return coloring.color
      }
      if (coloring.kind === 'gradient') {
        return coloring.gradient
      }

      exhaustiveCheck(coloring.kind)
    }

    const serializeBgFill = (fill: BgStyleOptions['fill']): BgFill => {
      if (fill.kind === 'color') {
        return fill.color
      }
      if (fill.kind === 'transparent') {
        return { kind: 'transparent' }
      }
      exhaustiveCheck(fill.kind)
    }

    const fontsIds = new Set([
      ...this.styleOptions.shape.items.words.fontIds,
      ...this.styleOptions.bg.items.words.fontIds,
    ])

    const serializedData: EditorPersistedData = {
      version: 1,
      data: {
        key: this.editor.key,
        version: this.editor.version,
        customFonts: await Promise.all(
          this.customFonts
            .filter((f) => fontsIds.has(f.styles[0].fontId))
            .map(async (f) => ({
              fontUrl: f.styles[0].url,
              title: f.title,
              fontId: f.styles[0].fontId,
            }))
        ),
        sceneSize: {
          w: Math.round(this.editor.getSceneBounds(0).width),
          h: Math.round(this.editor.getSceneBounds(0).height),
        },
        shapeStyle: {
          opacity: this.styleOptions.shape.opacity,
          items: {
            ...this.styleOptions.shape.items,
            coloring: serializeShapeItemsColoring(
              this.styleOptions.shape.items.coloring
            ),
            words: {
              angles:
                this.styleOptions.shape.items.words.anglesPreset === 'custom'
                  ? this.styleOptions.shape.items.words.customAngles
                  : getAnglesForPreset(
                      this.styleOptions.shape.items.words.anglesPreset
                    ),
              anglePreset: this.styleOptions.shape.items.words.anglesPreset,
              fontIds: this.styleOptions.shape.items.words.fontIds,
              wordList: this.styleOptions.shape.items.words.wordList,
            },
          },
        },
        bgStyle: {
          items: {
            ...this.styleOptions.bg.items,
            coloring: serializeBgItemsColoring(
              this.styleOptions.bg.items.coloring
            ),
            words: {
              angles:
                this.styleOptions.bg.items.words.anglesPreset === 'custom'
                  ? this.styleOptions.bg.items.words.customAngles
                  : getAnglesForPreset(
                      this.styleOptions.bg.items.words.anglesPreset
                    ),
              anglePreset: this.styleOptions.bg.items.words.anglesPreset,
              fontIds: this.styleOptions.bg.items.words.fontIds,
              wordList: this.styleOptions.bg.items.words.wordList,
            },
          },
          fill: serializeBgFill(this.styleOptions.bg.fill),
        },
        shape: serializeShape(this.getShape()!),
        bgItems: serializeItems('bg'),
        shapeItems: serializeItems('shape'),
      },
    }

    // this.logger.debug(
    //   'serialized: ',
    //   toJS(serializedData, { recurseEverything: true })
    // )

    return serializedData
  }

  @action destroyEditor = () => {
    this.logger.debug('destroyEditor')
    this.editor?.destroy()
    this.lifecycleState = 'destroyed'
    this.styleOptions.shape = cloneDeep(defaultShapeStyleOptions)
    this.styleOptions.bg = cloneDeep(defaultBgStyleOptions)
  }

  addCustomFont = async (fontConfig: PersistedCustomFontV1) => {
    const font = await loadFont(fontConfig.fontUrl)
    const fontTitle = fontConfig.title || 'Custom'
    const fontPath = font.getPath(fontTitle, 0, 0, 300)
    const bounds = fontPath.getBoundingBox()

    const canvas = createCanvas({
      w: bounds.x2 - bounds.x1,
      h: bounds.y2 - bounds.y1,
    })
    const ctx = canvas.getContext('2d')!
    ctx.translate(-bounds.x1, -bounds.y1)
    fontPath.draw(ctx)

    const thumbnailUrl = canvas.toDataURL()

    const fontStyle: FontStyleConfig = {
      fontId: fontConfig.fontId,
      title: fontTitle,
      url: fontConfig.fontUrl,
      thumbnail: thumbnailUrl,
      fontStyle: 'regular',
      fontWeight: 'normal',
      isCustom: true,
    }
    this.customFonts.push({
      title: fontTitle,
      isCustom: true,
      categories: ['custom'],
      styles: [fontStyle],
      popularity: 1,
      subsets: ['custom'],
    })
  }

  getIconShapeConfById = (shapeId: ShapeId): ShapeIconConf | undefined =>
    this.availableIconShapes.find((s) => s.id === shapeId)

  getImageShapeConfById = (shapeId: ShapeId): ShapeClipartConf | undefined =>
    this.availableImageShapes.find((s) => s.id === shapeId)

  getShape = (): Shape | undefined => {
    return this.editor?.shape || undefined
  }
  getShapeConf = (): ShapeConf | undefined => this.getShape()?.config

  getDefaultStyleForFont = (font: FontConfig): FontStyleConfig => {
    let normalStyles = font.styles.filter((fs) => fs.fontStyle === 'normal')
    if (normalStyles.length < 1) {
      normalStyles = font.styles
    }

    normalStyles.sort(
      (fs1, fs2) => parseInt(fs1.fontWeight) - parseInt(fs2.fontWeight)
    )
    const middleIndex = Math.min(
      Math.ceil(normalStyles.length / 2),
      normalStyles.length - 1
    )
    return normalStyles[middleIndex]
  }

  getAvailableFonts = (
    params: {
      popular?: boolean
    } = {}
  ): {
    font: FontConfig
    defaultStyle: FontStyleConfig
  }[] => {
    const result: { font: FontConfig; defaultStyle: FontStyleConfig }[] = []

    const allFonts = params.popular ? popularFonts : fonts

    for (const font of [...this.customFonts, ...allFonts]) {
      result.push({ font, defaultStyle: this.getDefaultStyleForFont(font) })
    }
    return result
  }

  getAvailableFontStyles = (): { [fontId in FontId]: FontStyleConfig } => {
    const result: { [fontId in FontId]: FontStyleConfig } = {}

    for (const font of [...this.customFonts, ...fonts]) {
      for (const fs of font.styles) {
        result[fs.fontId] = fs
      }
    }
    return result
  }

  getFontConfigById = (
    fontId: FontId
  ): { font: FontConfig; style: FontStyleConfig } | undefined => {
    for (const font of [...this.customFonts, ...fonts]) {
      for (const style of font.styles) {
        if (style.fontId === fontId) {
          return { font, style }
        }
      }
    }
    return undefined
  }

  fetchFontById = async (fontId: FontId) => {
    if (this.fontsCache.has(fontId)) {
      return this.fontsCache.get(fontId)
    }
    const font = await (this.getFontConfigById(fontId)
      ? loadFont(this.getFontConfigById(fontId)!.style.url!)
      : Promise.resolve(null))
    if (!font) {
      return null
    }
    this.fontsCache.set(fontId, font)
    return font
  }

  getFontById = (fontId: FontId) => this.fontsCache.get(fontId)

  getSelectedShapeConf = () => this.selectedShapeConf

  selectShapeAndSaveUndo = async (
    shapeConfig: ShapeConf,
    updateShapeColors = true,
    render = true
  ) => {
    if (!this.editor) {
      return
    }
    const versionBefore = this.editor.version
    const stateBefore = this.getStateSnapshot()

    const persistedDataBefore = await this.serialize()
    await this.selectShape(shapeConfig, updateShapeColors, render)
    const persistedDataAfter = await this.serialize()

    this.editor.pushUndoFrame({
      kind: 'visualize',
      dataBefore: persistedDataBefore,
      dataAfter: persistedDataAfter,
      stateAfter: this.getStateSnapshot(),
      stateBefore,
      versionAfter: this.editor.version,
      versionBefore,
    })
    this.editor.version++

    this.hasUnsavedChanges = true
  }

  @action selectShape = async (
    shapeConfig: ShapeConf,
    updateShapeColors = true,
    render = true
  ) => {
    this.logger.info(
      `selectShape: ${shapeConfig.kind} ${
        // @ts-ignore
        shapeConfig['id']
      }`
    )

    if (!this.editor) {
      return
    }

    this.selectedShapeConf = shapeConfig
    await this.editor.setShape({
      shapeConfig: this.selectedShapeConf,
      bgFillStyle: mkBgStyleConfFromOptions(this.styleOptions.bg).fill,
      shapeStyle: mkShapeStyleConfFromOptions(this.styleOptions.shape),
      clear: true,
      updateShapeColors,
      render,
    })

    if (shapeConfig.kind === 'clipart:svg') {
      const shape = this.editor.shape
      if (
        shape &&
        shape.kind === 'clipart:svg' &&
        shape.colorMap.length === 1
      ) {
        shape.config.processing.colors = {
          kind: 'single-color',
          color: this.shapesPanel.image.singleColor,
        }
        await this.editor.updateShapeColors(shape.config)
      }
    }

    this.editor.version++
    this.hasUnsavedChanges = true
    this.updateShapeThumbnail()
  }

  /** Update shape based on the selected shape config (e.g. after shape config changes) */
  updateShapeFromSelectedShapeConf = async (params: {
    resetTransform?: boolean
  }) => {
    if (!this.editor || !this.selectedShapeConf) {
      return
    }

    await this.editor.setShape({
      shapeConfig: this.selectedShapeConf,
      bgFillStyle: mkBgStyleConfFromOptions(this.styleOptions.bg).fill,
      shapeStyle: mkShapeStyleConfFromOptions(this.styleOptions.shape),
      clear: false,
      resetTransform: params.resetTransform ?? true,
    })
    if (this.styleOptions.shape.items.coloring.kind === 'shape') {
      await this.editor.setShapeItemsStyle(
        mkShapeStyleConfFromOptions(this.styleOptions.shape).items
      )
    }
  }

  @action deleteWord = (target: TargetKind, wordId: WordConfigId) => {
    this.hasUnsavedChanges = true
    const style = this.styleOptions[target]
    style.items.words.wordList = style.items.words.wordList.filter(
      (w) => w.id !== wordId
    )
  }

  @action clearWords = (target: TargetKind) => {
    this.hasUnsavedChanges = true
    const style = this.styleOptions[target]
    const ids = style.items.words.wordList.map((w) => w.id)
    this.wordIdGen.removeIds(ids)
    this.wordIdGen.resetLen()
    style.items.words.wordList = []
  }

  @action addWords = (target: TargetKind, words: ImportedWord[]) => {
    this.hasUnsavedChanges = true
    const style = this.styleOptions[target]
    for (const word of words) {
      style.items.words.wordList.push({
        id: this.wordIdGen.get(),
        ...word,
      })
    }
  }

  @action addWord = (target: TargetKind, word: ImportedWord) => {
    this.hasUnsavedChanges = true
    const style = this.styleOptions[target]
    style.items.words.wordList.push({
      id: this.wordIdGen.get(),
      ...word,
    })
  }

  @action updateWord = (
    target: TargetKind,
    wordId: WordConfigId,
    update: Partial<Omit<WordListEntry, 'id'>>
  ) => {
    this.hasUnsavedChanges = true
    const style = this.styleOptions[target]
    const word = style.items.words.wordList.find((w) => w.id === wordId)
    if (!word) {
      throw new Error(`missing word, id = ${wordId}`)
    }
    set(word, update)
  }

  @action setMaxItemsCount = (
    target: TargetKind,
    maxCount: number | 'auto'
  ) => {
    this.styleOptions[target].items.placement.itemsMaxCount = maxCount

    // TODO: hide extra items if possible
    if (maxCount !== 'auto') {
      if (this.editor) {
        this.editor.hideItemsAfter(target, maxCount)
        this.hasUnsavedChanges = true
        this.editor.version++
      }
    }
  }

  @action setPageSize = async (
    pageSize: PageSizeSettings,
    resetShape = true
  ) => {
    this.pageSize = pageSize
    if (!this.editor) {
      return
    }
    this.hasUnsavedChanges = true
    const aspect = getAspect(this.pageSize)

    this.editor.setAspectRatio(aspect)

    // Reset the shape
    if (resetShape) {
      const shapeConf = this.getShapeConf()
      if (shapeConf) {
        await this.selectShape(shapeConf, true, true)
      }
    }
  }

  animateVisualize = (debounce = true) => {
    if (
      (debounce &&
        (!this.visualizeAnimatedLastTime ||
          (this.visualizeAnimatedLastTime != null &&
            new Date().getTime() - this.visualizeAnimatedLastTime.getTime() >
              2000))) ||
      !debounce
    ) {
      this.visualizeAnimatedLastTime = new Date()
      animateElement(document.getElementById('btn-visualize')!)
    }
  }

  applyColorTheme = async (theme: ThemePreset) => {
    this.logger.info('applyColorTheme', theme)
    const shape = this.getShape()
    const { shape: shapeStyle, bg: bgStyle } = this.styleOptions

    if (!shape) {
      return
    }

    this.hasUnsavedChanges = true

    // Shape
    shapeStyle.opacity = theme.shapeOpacity
    shapeStyle.items.brightness = 0

    // Bg
    bgStyle.fill.kind = 'color'
    bgStyle.items.brightness = 0
    bgStyle.fill.color = {
      kind: 'color',
      color: theme.bgFill,
      opacity: 100,
    }

    // Shape fill
    this.updateColorForAllShapeTypes(theme.shapeFill)

    if (shape.kind === 'clipart:svg' || shape.kind === 'custom:svg') {
      shape.config.processing.colors = {
        kind: 'single-color',
        color: theme.shapeFill,
      }
    } else if (shape.kind === 'text') {
      shape.config.textStyle.color = theme.shapeFill
    } else if (shape.kind === 'icon') {
      shape.config.color = theme.shapeFill
    } else if (shape.kind === 'full-canvas') {
      shape.config.color = theme.shapeFill
    } else if (shape.kind === 'blob') {
      shape.config.color = theme.shapeFill
    } else if (shape.kind === 'custom:raster') {
      shape.config.processing.fill = { color: theme.shapeFill }
      await this.updateShapeFromSelectedShapeConf({ resetTransform: false })
    }

    // Shape items coloring
    shapeStyle.items.coloring.kind = theme.shapeItemsColoring.kind
    if (theme.shapeItemsColoring.kind === 'color') {
      shapeStyle.items.coloring.color = theme.shapeItemsColoring
    } else if (theme.shapeItemsColoring.kind === 'gradient') {
      shapeStyle.items.coloring.gradient = theme.shapeItemsColoring
    } else if (theme.shapeItemsColoring.kind === 'shape') {
      shapeStyle.items.coloring.shape = theme.shapeItemsColoring
    }

    // Bg items coloring
    bgStyle.items.coloring.kind = theme.bgItemsColoring.kind
    if (theme.bgItemsColoring.kind === 'color') {
      bgStyle.items.coloring.color = theme.bgItemsColoring
    } else if (theme.bgItemsColoring.kind === 'gradient') {
      shapeStyle.items.coloring.gradient = theme.bgItemsColoring
    }

    shapeStyle.items.opacity = theme.itemsOpacity
    bgStyle.items.opacity = theme.itemsOpacity
    shapeStyle.items.dimSmallerItems = theme.shapeDimSmallerItems
    bgStyle.items.dimSmallerItems = theme.bgDimSmallerItems
    // </update-styles>

    await this.editor?.updateShapeColors(shape.config)
    this.editor?.setShapeOpacity(shapeStyle.opacity / 100)
    await this.editor?.setShapeItemsStyle(
      mkShapeStyleConfFromOptions(shapeStyle).items
    )
    await this.editor?.setBgItemsStyle(mkBgStyleConfFromOptions(bgStyle).items)
    this.editor?.setBgColor(bgStyle.fill.color)
    if (bgStyle.fill.kind === 'color') {
      this.editor?.setBgOpacity(bgStyle.fill.color.opacity / 100)
    } else {
      this.editor?.setBgOpacity(0)
    }
    this.updateShapeThumbnail()
  }

  @action updateColorForAllShapeTypes = (color: string) => {
    this.shapesPanel.blob.color = color
    this.shapesPanel.text.color = color
    this.shapesPanel.icon.color = color
    this.shapesPanel.fullCanvas.color = color
    this.shapesPanel.image.singleColor = color
    this.shapesPanel.customImage.fillColor = color
  }
}

export type WordConfigId = string

export type EditorStateSnapshot = {
  mode: EditorMode
  shapeConf: ShapeConf
  activeLayer: TargetTab
  leftTabIsTransformingShape: boolean
  selection:
    | {
        kind: 'item'
        item: EditorItem
      }
    | {
        kind: 'shape'
      }
    | null
}

export type TabMode = 'home' | 'customize shape' | 'add text shape'

export type ShapeKindOption =
  | 'icon'
  | 'image'
  | 'full-canvas'
  | 'blob'
  | 'custom image'
  | 'text'

export type LeftPanelShapesState = {
  shapeKind: ShapeKindOption
  blob: BlobShapeOptions
  fullCanvas: FullCanvasShapeOptions
  image: ImageShapeOptions
  icon: IconShapeOptions
  text: TextShapeOptions
  customImage: CustomImageShapeOptions
}

export const leftPanelShapesInitialState: LeftPanelShapesState = {
  shapeKind: 'icon',
  blob: {
    color: '#4A90E2',
    complexity: 70,
    points: 5,
  },
  customImage: {
    fillColor: '#4A90E2',
  },
  fullCanvas: {
    color: '#4A90E2',
  },
  icon: {
    category: null,
    selected: 'fa-solid-heart',
    color: '#4A90E2',
  },
  image: {
    category: null,
    selected: 'football-player-silhouette',
    singleColor: '#4A90E2',
  },
  text: {
    fontId: 'Luckiest Guy:regular',
    color: '#4A90E2',
    text: 'Hi',
  },
}

export type CustomImageShapeOptions = {
  fillColor: string
}

export type ImageShapeOptions = {
  category: string | null
  selected: ShapeId
  singleColor: string
}

export type IconShapeOptions = {
  category: string | null
  selected: ShapeId
  color: string
}

export type TextShapeOptions = {
  text: string
  fontId: FontId
  color: string
}

export type BlobShapeOptions = {
  color: string
  points: number
  complexity: number
}

export type FullCanvasShapeOptions = {
  color: string
}

export const EditorStoreContext = React.createContext<EditorStore | null>(null)

export const useEditorStore = () => {
  const editorStore = useContext(EditorStoreContext)
  return editorStore
}

export type ImportedWord = Partial<WordListEntry> & {
  text: string
}
