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
  Box,
} from '@chakra-ui/core'
import { ChevronRightIcon } from '@chakra-ui/icons'
import { css } from '@emotion/core'
import { Spinner } from 'components/Editor/components/Spinner'
import { observer, useLocalStore } from 'mobx-react'
import React, { useEffect } from 'react'
import { useStore } from 'services/root-store'
import { useToasts } from 'use-toasts'
import { animateElement } from 'utils/animation'

export type WelcomeSettingsModalProps = {
  isOpen: boolean
  onSubmit: (params: { templateId: string | null }) => Promise<void>
}

export const WelcomeSettingsModal: React.FC<WelcomeSettingsModalProps> = observer(
  (props) => {
    const { wordcloudsStore } = useStore()
    const { templates } = wordcloudsStore

    const toasts = useToasts()
    const state = useLocalStore(() => ({
      isSubmitting: false,
      // selectedTemplate: null as string | null,
      selectedTemplate: 'a12fce2d-e538-42e7-a895-01f972f5570a' as string | null,
    }))

    // Init
    useEffect(() => {
      const init = async () => {
        await wordcloudsStore.fetchTemplates()
        if (wordcloudsStore.templates) {
          state.selectedTemplate = wordcloudsStore.templates[0].id
        }
      }
      init()
    }, [])

    const handleSubmit = async () => {
      state.isSubmitting = true
      await props.onSubmit({ templateId: state.selectedTemplate })
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
              Choose a starting template
            </ModalHeader>
            <ModalBody>
              <Text mb="4" fontSize="lg" textAlign="center" color="gray.500">
                Don't sweat it! You can customize everything later.
              </Text>
              <Box display="flex" flexWrap="wrap">
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
                        boxShadow="lg"
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
