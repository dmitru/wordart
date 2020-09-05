import {
  Menu,
  MenuButton,
  MenuList,
  MenuTransition,
  Portal,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import { useEditorStore } from 'components/Editor/editor-store'
import { generateBlobShapePathData } from 'components/Editor/lib/blob-shape-gen'
import { ShapeTextConf } from 'components/Editor/shape-config'
import { Button } from 'components/shared/Button'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import { observer } from 'mobx-react'
import React from 'react'

export const ShapeTypeSelector: React.FC<{}> = observer(() => {
  const store = useEditorStore()!
  const { shapesPanel } = store

  return (
    <Menu isLazy placement="bottom-end">
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        py="2"
        px="3"
        size="lg"
      >
        {'Shape type: '}
        {shapesPanel.shapeKind === 'blob' && 'Wordcloud'}
        {shapesPanel.shapeKind === 'image' && 'Clip Art'}
        {shapesPanel.shapeKind === 'icon' && 'Icon'}
        {shapesPanel.shapeKind === 'custom image' && 'Custom Image'}
        {shapesPanel.shapeKind === 'text' && 'Text'}
        {shapesPanel.shapeKind === 'full-canvas' && 'Full Canvas'}
      </MenuButton>

      <Portal>
        <MenuTransition>
          {(styles) => (
            <MenuList
              // @ts-ignore
              css={css`
                ${styles}
                max-height: 500px;
              `}
            >
              <MenuItemWithDescription
                title="Icon"
                description="Choose one of 1,500+ icons and emoticons"
                onClick={() => {
                  shapesPanel.shapeKind = 'icon'
                  const shapeConf = store.getIconShapeConfById(
                    shapesPanel.icon.selected
                  )
                  if (shapeConf) {
                    store.selectShapeAndSaveUndo(shapeConf)
                  }
                  store.animateVisualize(false)
                }}
              />

              <MenuItemWithDescription
                title="Clip Art / Silhouettes"
                description="Pick one of hundreds images"
                onClick={() => {
                  shapesPanel.shapeKind = 'image'
                  const shapeConf = store.getImageShapeConfById(
                    shapesPanel.image.selected
                  )
                  if (shapeConf) {
                    store.selectShapeAndSaveUndo(shapeConf)
                  }
                  store.animateVisualize(false)
                }}
              />

              <MenuItemWithDescription
                title="Wordcloud"
                description="A random blob shape for a classic wordcloud design"
                onClick={() => {
                  shapesPanel.shapeKind = 'blob'
                  const blobShapeSvg = generateBlobShapePathData({
                    color: store.shapesPanel.blob.color,
                    points: store.shapesPanel.blob.points,
                    complexity: store.shapesPanel.blob.complexity,
                    aspect: store.editor?.aspectRatio || 1,
                  })

                  store.selectShapeAndSaveUndo({
                    kind: 'blob',
                    color: store.shapesPanel.blob.color,
                    points: store.shapesPanel.blob.points,
                    complexity: store.shapesPanel.blob.complexity,
                    pathData: blobShapeSvg,
                  })

                  store.animateVisualize(false)
                }}
              />

              <MenuItemWithDescription
                title="Text"
                description="Enter your own text to use as shape"
                onClick={() => {
                  shapesPanel.shapeKind = 'text'
                  const textShape: ShapeTextConf = {
                    kind: 'text',
                    text: shapesPanel.text.text,
                    textStyle: {
                      color: shapesPanel.text.color,
                      fontId: shapesPanel.text.fontId,
                    },
                    thumbnailUrl: '',
                  }
                  store.selectShapeAndSaveUndo(textShape)
                  store.animateVisualize(false)
                }}
              />

              <MenuItemWithDescription
                title="Custom Image"
                description="Upload your own image!"
                onClick={() => {
                  shapesPanel.shapeKind = 'custom image'
                  store.animateVisualize(false)
                }}
              />

              <MenuItemWithDescription
                title="Full Canvas"
                description="Fill the entire canvas with words"
                onClick={() => {
                  store.selectShapeAndSaveUndo({
                    kind: 'full-canvas',
                    color: shapesPanel.fullCanvas.color,
                  })
                  shapesPanel.shapeKind = 'full-canvas'
                  store.animateVisualize(false)
                }}
              />
            </MenuList>
          )}
        </MenuTransition>
      </Portal>
    </Menu>
  )
})
