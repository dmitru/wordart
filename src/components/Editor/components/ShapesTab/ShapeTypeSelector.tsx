import {
  Menu,
  MenuButton,
  MenuList,
  MenuTransition,
  Portal,
} from '@chakra-ui/core'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import { leftPanelShapesState } from 'components/Editor/components/ShapesTab/state'
import { Button } from 'components/shared/Button'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import { observer } from 'mobx-react'
import React from 'react'

export const ShapeTypeSelector: React.FC<{}> = observer(() => (
  <Menu placement="bottom-end">
    <MenuButton
      as={Button}
      colorScheme="secondary"
      rightIcon={<ChevronDownIcon />}
      py="2"
      px="3"
    >
      {'Shape type: '}
      {leftPanelShapesState.shapeVariety === 'blob' && 'Blob'}
      {leftPanelShapesState.shapeVariety === 'image' && 'Clip art'}
      {leftPanelShapesState.shapeVariety === 'icon' && 'Icon'}
      {leftPanelShapesState.shapeVariety === 'custom image' && 'Custom image'}
      {leftPanelShapesState.shapeVariety === 'text' && 'Text'}
      {leftPanelShapesState.shapeVariety === 'full canvas' && 'Full canvas'}
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
                leftPanelShapesState.shapeVariety = 'blob'
              }}
            />

            <MenuItemWithDescription
              title="Clip Art"
              description="Choose one of hundreds images"
              onClick={() => {
                leftPanelShapesState.shapeVariety = 'image'
              }}
            />

            <MenuItemWithDescription
              title="Icon"
              description="Choose one of thousands icons and emoticons"
              onClick={() => {
                leftPanelShapesState.shapeVariety = 'icon'
              }}
            />

            <MenuItemWithDescription
              title="Text"
              description="Use custom text as shape"
              onClick={() => {
                leftPanelShapesState.shapeVariety = 'text'
              }}
            />

            <MenuItemWithDescription
              title="Custom image"
              description="Upload your own image!"
              onClick={() => {
                leftPanelShapesState.shapeVariety = 'custom image'
              }}
            />

            <MenuItemWithDescription
              title="Full canvas"
              description="Fill the entire canvas"
              onClick={() => {
                leftPanelShapesState.shapeVariety = 'full canvas'
              }}
            />
          </MenuList>
        )}
      </MenuTransition>
    </Portal>
  </Menu>
))
