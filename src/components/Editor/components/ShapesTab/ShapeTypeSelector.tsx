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

export const ShapeTypeSelector: React.FC<{}> = observer(() => {
  const { editorPageStore: store } = useStore()
  const { shapesPanel: leftPanelShapesState } = store

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
        {leftPanelShapesState.shapeKind === 'random blob' && 'Blob'}
        {leftPanelShapesState.shapeKind === 'image' && 'Clip art'}
        {leftPanelShapesState.shapeKind === 'icon' && 'Icon'}
        {leftPanelShapesState.shapeKind === 'custom image' && 'Custom image'}
        {leftPanelShapesState.shapeKind === 'text' && 'Text'}
        {leftPanelShapesState.shapeKind === 'full canvas' && 'Full canvas'}
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
                description="A random blob shape for quick and unique designs"
                onClick={() => {
                  leftPanelShapesState.shapeKind = 'random blob'
                }}
              />

              <MenuItemWithDescription
                title="Clip Art"
                description="Choose one of hundreds images"
                onClick={() => {
                  leftPanelShapesState.shapeKind = 'image'
                  const shapeConf = store.getImageShapeConfById(
                    leftPanelShapesState.image.selected
                  )
                  if (shapeConf) {
                    store.selectShape(shapeConf)
                  }
                }}
              />

              <MenuItemWithDescription
                title="Icon"
                description="Choose one of thousands icons and emoticons"
                onClick={() => {
                  leftPanelShapesState.shapeKind = 'icon'
                  const shapeConf = store.getIconShapeConfById(
                    leftPanelShapesState.icon.selected
                  )
                  if (shapeConf) {
                    store.selectShape(shapeConf)
                  }
                }}
              />

              <MenuItemWithDescription
                title="Text"
                description="Use custom text as shape"
                onClick={() => {
                  leftPanelShapesState.shapeKind = 'text'
                }}
              />

              <MenuItemWithDescription
                title="Custom image"
                description="Upload your own image!"
                onClick={() => {
                  leftPanelShapesState.shapeKind = 'custom image'
                }}
              />

              <MenuItemWithDescription
                title="Full canvas"
                description="Fill the entire canvas"
                onClick={() => {
                  leftPanelShapesState.shapeKind = 'full canvas'
                }}
              />
            </MenuList>
          )}
        </MenuTransition>
      </Portal>
    </Menu>
  )
})
