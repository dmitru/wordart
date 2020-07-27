import {
  Menu,
  MenuButton,
  MenuList,
  MenuTransition,
  Portal,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import { generateBlobShapePathData } from 'components/Editor/lib/blob-shape-gen'
import { ShapeTextConf } from 'components/Editor/shape-config'
import { Button } from 'components/shared/Button'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import { useEditorStore } from 'components/Editor/editor-store'

export const ShapeTypeSelector: React.FC<{}> = observer(() => {
  const store = useEditorStore()!
  const { shapesPanel } = store

  return (
    <Menu isLazy placement="bottom-end">
      <MenuButton
        as={Button}
        colorScheme="secondary"
        rightIcon={<ChevronDownIcon />}
        py="2"
        px="3"
      >
        {'Shape: '}
        {shapesPanel.shapeKind === 'blob' && 'Blob'}
        {shapesPanel.shapeKind === 'image' && 'Clip art'}
        {shapesPanel.shapeKind === 'icon' && 'Icon'}
        {shapesPanel.shapeKind === 'custom image' && 'Custom image'}
        {shapesPanel.shapeKind === 'text' && 'Text'}
        {shapesPanel.shapeKind === 'full-canvas' && 'Fill whole canvas'}
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
                title="Blob shape"
                description="A blob shape for quick and unique designs"
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
                title="Clip art"
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
                title="Custom image"
                description="Upload your own image!"
                onClick={() => {
                  shapesPanel.shapeKind = 'custom image'
                  store.animateVisualize(false)
                }}
              />

              <MenuItemWithDescription
                title="Fill whole canvas"
                description="Use the entire canvas as a shape"
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
