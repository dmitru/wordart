import {
  Menu,
  MenuButton,
  MenuList,
  MenuTransition,
  Portal,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import { Button } from 'components/shared/Button'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import { observer } from 'mobx-react'
import React from 'react'
import { useStore } from 'services/root-store'
import {
  ShapeTextConf,
  ShapeRandomBlobConf,
} from 'components/Editor/shape-config'

export const ShapeTypeSelector: React.FC<{}> = observer(() => {
  const { editorPageStore: store } = useStore()
  const { shapesPanel } = store

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        colorScheme="secondary"
        rightIcon={<ChevronDownIcon />}
        py="2"
        px="3"
      >
        {'Shape type: '}
        {shapesPanel.shapeKind === 'blob' && 'Blob'}
        {shapesPanel.shapeKind === 'image' && 'Clip art'}
        {shapesPanel.shapeKind === 'icon' && 'Icon'}
        {shapesPanel.shapeKind === 'custom image' && 'Custom image'}
        {shapesPanel.shapeKind === 'text' && 'Text'}
        {shapesPanel.shapeKind === 'full canvas' && 'Full canvas'}
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
                  const shape: ShapeRandomBlobConf = {
                    kind: 'blob',
                    color: shapesPanel.blob.color,
                    points: shapesPanel.blob.points,
                    complexity: shapesPanel.blob.complexity,
                  }
                  store.selectShape(shape)
                  shapesPanel.shapeKind = 'blob'
                }}
              />

              <MenuItemWithDescription
                title="Clip Art"
                description="Pick one of hundreds images"
                onClick={() => {
                  shapesPanel.shapeKind = 'image'
                  const shapeConf = store.getImageShapeConfById(
                    shapesPanel.image.selected
                  )
                  if (shapeConf) {
                    store.selectShape(shapeConf)
                  }
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
                    store.selectShape(shapeConf)
                  }
                }}
              />

              <MenuItemWithDescription
                title="Text"
                description="Enter your own text to use as shape"
                onClick={() => {
                  const textShape: ShapeTextConf = {
                    kind: 'text',
                    text: shapesPanel.text.text,
                    textStyle: {
                      color: shapesPanel.text.color,
                      fontId: shapesPanel.text.fontId,
                    },
                    thumbnailUrl: '',
                  }
                  store.selectShape(textShape)
                  shapesPanel.shapeKind = 'text'
                }}
              />

              <MenuItemWithDescription
                title="Custom image"
                description="Upload your own image!"
                onClick={() => {
                  shapesPanel.shapeKind = 'custom image'
                }}
              />

              <MenuItemWithDescription
                title="Full canvas"
                description="Fill the entire canvas"
                onClick={() => {
                  shapesPanel.shapeKind = 'full canvas'
                }}
              />
            </MenuList>
          )}
        </MenuTransition>
      </Portal>
    </Menu>
  )
})
