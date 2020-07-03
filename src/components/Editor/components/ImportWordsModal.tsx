import {
  Box,
  Checkbox,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/core'
import { Button } from 'components/shared/Button'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import stopword from 'stopword'
import { Input } from 'components/shared/Input'
import { Api } from 'services/api/api'
import { boolean } from 'yup'

export type ImportWordsModalProps = {
  isOpen: boolean
  onClose: () => void
  onImported: (data: {
    words: string[]
    clearExistingBeforeImporting: boolean
  }) => void
}

const state = observable({
  isImporting: false,
  textInput: '',
  urlInput: '',
  tabIndex: 0,
  removeNumbers: true,
  stemming: true,
  removeCommon: true,
  clearExistingBeforeImporting: true,
})

export const ImportWordsModal: React.FC<ImportWordsModalProps> = observer(
  ({ isOpen, onClose, onImported }) => {
    const handleImport = async () => {
      // Words
      if (state.tabIndex === 0) {
        const text = state.textInput

        // Tokenize
        let words = text.split(/\s+/)

        // Remove non-words symbols
        words = words
          .map((w) => {
            return w.replace(/\W+$/, '').replace(/^\W+/, '')
          })
          .filter((w) => w)

        words = words
          .map((w) => {
            if (w.match(/^\d+$/)) {
              // it's a number, leave it
              return state.removeNumbers ? '' : w
            }

            return w.replace(/[\W\d]+$/, '').replace(/^[\W\d]+/, '')
          })
          .filter((w) => w)

        // Remove stop-words
        if (state.removeCommon) {
          words = stopword.removeStopwords(words)
        }

        onImported({
          words,
          clearExistingBeforeImporting: state.clearExistingBeforeImporting,
        })
        state.textInput = ''
        return
      }

      // CSV
      if (state.tabIndex === 1) {
        // TODO
        return
      }

      // Web
      if (state.tabIndex === 2) {
        state.isImporting = true
        try {
          let url = state.urlInput.trim()
          if (!url.startsWith('http')) {
            url = `https://${url}`
          }
          const result = await Api.extractor.fromUrl({
            url,
            removeCommon: state.removeCommon,
            removeNumbers: state.removeNumbers,
            stemming: state.stemming,
          })
          onImported({
            words: result.words,
            clearExistingBeforeImporting: state.clearExistingBeforeImporting,
          })
          state.urlInput = ''
        } finally {
          state.isImporting = false
        }
        return
      }
    }

    const parsingControls = (
      <>
        <Text fontWeight="semibold" mb="1" mt="5" color="gray.500">
          Options
        </Text>

        <Stack spacing="3" mb="4">
          <Checkbox
            isChecked={state.removeCommon}
            onChange={(e) => {
              state.removeCommon = e.target.checked
            }}
          >
            Remove common words (e.g. "and", "a", "the", etc)
          </Checkbox>

          <Checkbox
            isChecked={state.removeNumbers}
            onChange={(e) => {
              state.removeNumbers = e.target.checked
            }}
          >
            Remove numbers
          </Checkbox>

          <Checkbox
            isChecked={state.stemming}
            onChange={(e) => {
              state.stemming = e.target.checked
            }}
          >
            Word stemming (e.g. treat “love” and “loves” as one word)
          </Checkbox>
        </Stack>
      </>
    )

    return (
      <Modal size="lg" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>Import Words</ModalHeader>

            <ModalBody>
              <Tabs
                size="md"
                colorScheme="line"
                onChange={(index) => {
                  state.tabIndex = index
                }}
                index={state.tabIndex}
              >
                <TabList>
                  <Tab>From Text</Tab>
                  <Tab>From CSV / Excel</Tab>
                  <Tab>From Web</Tab>
                </TabList>
                <TabPanels>
                  {/* From Text */}
                  <TabPanel>
                    <Textarea
                      mt="4"
                      autoFocus
                      minHeight="200px"
                      placeholder="Enter text..."
                      value={state.textInput}
                      onChange={(evt: any) => {
                        state.textInput = evt.target.value
                      }}
                    />

                    <Box mt="3">{parsingControls}</Box>
                  </TabPanel>

                  {/* From CSV */}
                  <TabPanel>
                    <Box mt="4">
                      <Text>
                        <Link>Learn more</Link> about importing words from CSV,
                        Excel or Google Sheets.
                      </Text>
                      <Textarea
                        mt="3"
                        placeholder="Paste CSV..."
                        value={state.textInput}
                        onChange={(evt: any) => {
                          state.textInput = evt.target.value
                        }}
                      />
                      <Box mt="3">
                        <Text>...or choose a CSV file: </Text>
                        <Button colorScheme="secondary">
                          Open CSV file...
                        </Button>
                      </Box>
                    </Box>
                  </TabPanel>

                  {/* From URL */}
                  <TabPanel>
                    <Box mt="4">
                      <Text>Paste a link to extract words from it:</Text>
                      <Input
                        mt="3"
                        placeholder="Enter URL, e.g. https://news.google.com/"
                        value={state.urlInput}
                        onChange={(evt: any) => {
                          state.urlInput = evt.target.value
                        }}
                      />

                      <Box mt="3">{parsingControls}</Box>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Checkbox
                marginRight="auto"
                isChecked={state.clearExistingBeforeImporting}
                onChange={(e) => {
                  state.clearExistingBeforeImporting = e.target.checked
                }}
              >
                Clear the words list before importing
              </Checkbox>
              <Button
                size="lg"
                ml="3"
                colorScheme="accent"
                isLoading={state.isImporting}
                onClick={handleImport}
              >
                Import
              </Button>
            </ModalFooter>

            <ModalCloseButton />
          </ModalContent>
        </ModalOverlay>
      </Modal>
    )
  }
)
