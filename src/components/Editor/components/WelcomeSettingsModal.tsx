import {
  Modal,
  Button,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  AspectRatio,
  Image,
  ModalCloseButton,
  Text,
  Menu,
  MenuButton,
  Portal,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuTransition,
  Box,
} from '@chakra-ui/core'
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import { Spinner } from 'components/Editor/components/Spinner'
import { observer, useLocalStore } from 'mobx-react'
import React, { useEffect } from 'react'
import { pageSizePresets } from 'components/Editor/editor-store'
import { useStore } from 'services/root-store'
import { useToasts } from 'use-toasts'
import { animateElement } from 'utils/animation'

export type WelcomeSettingsModalProps = {
  isOpen: boolean
  onSubmit: (params: {
    templateId: string | null
    presetId: string | null
    aspect: number
  }) => Promise<void>
}

export const WelcomeSettingsModal: React.FC<WelcomeSettingsModalProps> = observer(
  (props) => {
    const { wordcloudsStore } = useStore()
    const { templates } = wordcloudsStore

    const toasts = useToasts()
    const state = useLocalStore(() => ({
      pageSizePreset: pageSizePresets[0].id as string | null,
      customWidth: 4,
      customHeight: 3,
      isSubmitting: false,
      // selectedTemplate: null as string | null,
      selectedTemplate: 'a12fce2d-e538-42e7-a895-01f972f5570a' as string | null,
    }))

    // Init
    useEffect(() => {
      const init = async () => {
        if (wordcloudsStore.templates) {
          state.selectedTemplate = wordcloudsStore.templates[0].id
        }
      }
      init()
    }, [])

    const selectedPreset = pageSizePresets.find(
      (p) => p.id === state.pageSizePreset
    )

    let customAspect = state.customWidth / state.customHeight
    if (Number.isNaN(customAspect) || !Number.isFinite(customAspect)) {
      customAspect = 1
    }

    const handleSubmit = async () => {
      state.isSubmitting = true
      await props.onSubmit({
        templateId: state.selectedTemplate,
        presetId: selectedPreset?.id || null,
        aspect: selectedPreset?.aspect || customAspect || 1,
      })
      state.isSubmitting = false
      Object.assign(state, {
        selectedTemplate: null,
      })
    }

    if (!templates) {
      return null
    }

    return (
      <Modal
        onClose={handleSubmit}
        isOpen={props.isOpen}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalOverlay>
          <ModalContent maxWidth="1200px">
            <ModalHeader textAlign="center">
              Choose a Starting Template
            </ModalHeader>
            <ModalBody>
              <Text mb="4" fontSize="lg" textAlign="center" color="gray.500">
                Don't sweat it! You can customize everything later.
              </Text>

              <Box pb="4" pl="3">
                <Menu isLazy>
                  <MenuButton
                    as={Button}
                    variant="outline"
                    rightIcon={<ChevronDownIcon />}
                  >
                    <Box display="flex" alignItems="center" flexDirection="row">
                      <Text mb="0" mr="2">
                        Page size:
                      </Text>
                      <Text mb="0" fontWeight="normal">
                        {selectedPreset?.title || 'custom'}
                      </Text>
                      <Text mb="0" color="gray.500" ml="4" fontWeight="normal">
                        {selectedPreset?.subtitle || null}
                      </Text>
                    </Box>
                  </MenuButton>

                  <MenuTransition>
                    {(styles) => (
                      // @ts-ignore
                      <MenuList css={styles} zIndex={4}>
                        {pageSizePresets.map((preset) => (
                          <MenuItem
                            key={preset.id}
                            onClick={() => {
                              state.pageSizePreset = preset.id
                            }}
                          >
                            <Box flexDirection="column">
                              <Box fontWeight="medium">{preset.title}</Box>
                              <Box color="gray.500">{preset.subtitle}</Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </MenuList>
                    )}
                  </MenuTransition>
                </Menu>
              </Box>

              <Box
                display="flex"
                flexWrap="wrap"
                overflow="auto"
                height="calc(100vh - 380px)"
              >
                {templates &&
                  templates.map((template) => (
                    <Box
                      key={template.id}
                      maxWidth="300px"
                      minWidth="150px"
                      width={['50%', '50%', '33%', '25%']}
                      p="3"
                    >
                      <Box
                        onClick={() => {
                          state.selectedTemplate = template.id
                          animateElement(
                            document.getElementById(
                              'create-btn'
                            ) as HTMLButtonElement
                          )
                        }}
                        boxShadow="md"
                        transition="transform 0.2s"
                        _hover={{
                          boxShadow: 'lg',
                          transform: 'translateY(-4px)',
                        }}
                        cursor="pointer"
                        borderStyle="solid"
                        borderWidth="2px"
                        borderRadius="lg"
                        borderColor={
                          state.selectedTemplate === template.id
                            ? 'accent.500'
                            : 'transparent'
                        }
                      >
                        <AspectRatio
                          borderRadius="8px"
                          borderBottomLeftRadius="0"
                          borderBottomRightRadius="0"
                          maxW="380px"
                          ratio={4 / 3}
                          overflow="hidden"
                          border="none"
                        >
                          <Image
                            src={template.thumbnail}
                            css={css`
                              object-fit: contain !important;
                            `}
                          />
                        </AspectRatio>
                        <Text p="3" mb="0" fontSize="lg" fontWeight="medium">
                          {template.title}
                        </Text>
                      </Box>
                    </Box>
                  ))}
              </Box>
            </ModalBody>

            <ModalFooter justifyContent="center">
              <Button
                onClick={handleSubmit}
                isLoading={state.isSubmitting}
                colorScheme="accent"
                size="lg"
                id="create-btn"
                rightIcon={<ChevronRightIcon />}
              >
                Start creating
              </Button>
            </ModalFooter>
            <ModalCloseButton />
          </ModalContent>
        </ModalOverlay>
      </Modal>
    )
  }
)
