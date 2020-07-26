import React from 'react'
import { observer } from 'mobx-react'
import {
  Box,
  Menu,
  MenuButton,
  Button,
  Portal,
  MenuTransition,
  MenuList,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { MenuItemWithDescription } from 'components/shared/MenuItemWithDescription'
import { useStore } from 'services/root-store'

export const LeftPanelTargetLayerDropdown = () => (
  <Box
    mb="4"
    shadow="md"
    css={css`
      margin: -1.5rem -1.5rem 2rem;
      padding: 10px 1.5rem;
    `}
  >
    <TargetLayerDropdown />
  </Box>
)

export const TargetLayerDropdown = observer(() => {
  const { editorPageStore: store } = useStore()

  return (
    <Menu isLazy placement="bottom-start">
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        py="2"
        px="3"
        colorScheme="secondary"
      >
        {store.targetTab === 'shape' ? 'Shape layer' : ''}
        {store.targetTab === 'bg' ? 'Background layer' : ''}
      </MenuButton>

      <Portal>
        <MenuTransition>
          {(styles) => (
            <MenuList
              // @ts-ignore
              css={css`
                ${styles}
                max-height: 300px;
                max-width: 260px;
              `}
            >
              <MenuItemWithDescription
                title="Shape"
                description="Use this layer to place words and icons on the shape."
                onClick={() => {
                  store.targetTab = 'shape'
                }}
              />

              <MenuItemWithDescription
                title="Background"
                description="Use this layer to place words and icons on the background."
                onClick={() => {
                  if (store.getShapeConf()?.kind === 'full-canvas') {
                    alert(
                      'Background layer is not available when "Entire canvas" is selected in the "Shape" panel'
                    )
                    return
                  }
                  store.targetTab = 'bg'
                }}
              />
            </MenuList>
          )}
        </MenuTransition>
      </Portal>
    </Menu>
  )
})
