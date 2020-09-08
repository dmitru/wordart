import {
  AspectRatio,
  Box,
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/core'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import {
  PageSizeValue,
  PageSizePicker,
} from 'components/Editor/components/PageSizePicker'
import {
  pageSizePresets,
  defaultPageSizePreset,
} from 'components/Editor/page-size-presets'
import { observer, useLocalStore } from 'mobx-react'
import React, { useEffect } from 'react'
import { useStore } from 'services/root-store'
import { useToasts } from 'use-toasts'
import { animateElement } from 'utils/animation'

export type WelcomeSettingsModalProps = {
  isOpen: boolean
  onSubmit: (params: {
    templateId: string | null
    pageSize: PageSizeValue
  }) => Promise<void>
}

export const WelcomeSettingsModal: React.FC<WelcomeSettingsModalProps> = observer(
  (props) => {
    const { wordcloudsStore } = useStore()
    const { templates } = wordcloudsStore

    const state = useLocalStore(() => ({
      pageSize: {
        kind: 'preset',
        preset: defaultPageSizePreset,
        custom: {
          height: 9,
          width: 16,
          unit: 'in',
        },
      } as PageSizeValue,
      isSubmitting: false,
      selectedTemplate: 'a12fce2d-e538-42e7-a895-01f972f5570a' as string | null,
    }))

    // Select first template
    useEffect(() => {
      const init = async () => {
        if (wordcloudsStore.templates) {
          state.selectedTemplate = wordcloudsStore.templates[0].id
        }
      }
      init()
    }, [])

    const handleSubmit = async () => {
      state.isSubmitting = true
      await props.onSubmit({
        templateId: state.selectedTemplate,
        pageSize: state.pageSize,
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

              <Box>
                <Box pb="3" pl="3" maxWidth="370px">
                  <PageSizePicker
                    value={state.pageSize}
                    onChange={(value) => {
                      state.pageSize = value
                    }}
                  />
                </Box>

                <Box
                  flex="1"
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
