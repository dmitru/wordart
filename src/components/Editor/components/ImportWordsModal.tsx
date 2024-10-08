import {
  Box,
  Checkbox,
  Collapse,
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
import { uniq } from 'lodash'
import { ChevronDownIcon, ChevronUpIcon, SettingsIcon } from '@chakra-ui/icons'
import { Button } from 'components/shared/Button'
import { Input } from 'components/shared/Input'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import papaparse from 'papaparse'
import { useDropzone } from 'react-dropzone'
import { Api } from 'services/api/api'
import stopword from 'stopword'
import pluralize from 'pluralize'
import { ImportedWord } from '../editor-store'
import { csvDataToWords } from '../words-import-export'
import { HelpTooltipIcon } from 'components/shared/HelpTooltipIcon'
import { FaSlidersH } from 'react-icons/fa'

const stopwordList = [
  ...stopword.en,
  ...stopword.es,
  ...stopword.fr,
  ...stopword.de,
  ...stopword.it,
  ...stopword.ru,
  'not',
  'one',
  'de',
  'it',
  'so',
  'la',
  'among',
]

export type ImportWordsModalProps = {
  isOpen: boolean
  onClose: () => void
  onImported: (data: {
    words: ImportedWord[]
    clearExistingBeforeImporting: boolean
  }) => void
}

const state = observable({
  isImporting: false,
  textInput: '',
  csvInput: '',
  urlInput: '',
  tabIndex: 0,
  removeNumbers: true,
  singularize: true,
  removeCommon: true,
  clearExistingBeforeImporting: true,
  isShowingOptions: false,
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
            return w.replace(/'s$/, '').replace(/\W+$/, '').replace(/^\W+/, '')
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
          words = stopword.removeStopwords(words, stopwordList)
        }

        // Singularize
        if (state.singularize) {
          words = words.map((w) => pluralize.singular(w))
        }

        // Make unique
        words = uniq(words)

        // Limit to 100 words
        words = words.slice(0, 100)

        onImported({
          words: words.map((text) => ({ text })),
          clearExistingBeforeImporting: state.clearExistingBeforeImporting,
        })
        state.textInput = ''
        return
      }

      // CSV
      if (state.tabIndex === 1) {
        const parsedData = papaparse.parse(state.csvInput, {
          header: true,
          dynamicTyping: {
            angle: true,
            repeats: true,
          },
        })

        onImported({
          words: csvDataToWords(parsedData.data),
          clearExistingBeforeImporting: state.clearExistingBeforeImporting,
        })
        state.csvInput = ''
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
          const result = await Api.extractor.wordsFromUrl({
            url,
            removeCommon: state.removeCommon,
            removeNumbers: state.removeNumbers,
            singularize: state.singularize,
            limit: 100,
          })
          onImported({
            words: result.words.map((text) => ({ text })),
            clearExistingBeforeImporting: state.clearExistingBeforeImporting,
          })
          state.urlInput = ''
        } finally {
          state.isImporting = false
        }
        return
      }
    }

    const { getRootProps, getInputProps } = useDropzone({
      onDropAccepted: (files) => {
        const file = files[0]

        const reader = new FileReader()
        reader.onload = async () => {
          const text = reader.result as string
          state.csvInput = text
        }

        reader.readAsText(file)
      },
    })

    const parsingControls = (
      <>
        <Button
          variant="outline"
          onClick={() => {
            state.isShowingOptions = !state.isShowingOptions
          }}
          rightIcon={
            state.isShowingOptions ? <ChevronUpIcon /> : <ChevronDownIcon />
          }
          leftIcon={<FaSlidersH />}
        >
          Options
        </Button>

        <Collapse isOpen={state.isShowingOptions}>
          <Stack mt="4" spacing="3" mb="4">
            <Checkbox
              isChecked={state.removeCommon}
              onChange={(e) => {
                state.removeCommon = e.target.checked
              }}
            >
              Remove common words ("and", "a", "the", etc)
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
              isChecked={state.singularize}
              onChange={(e) => {
                state.singularize = e.target.checked
              }}
            >
              Make all words singular
              <HelpTooltipIcon label="Normalizes words, e.g. turns the word “dogs“ into “dog“" />
            </Checkbox>
          </Stack>
        </Collapse>
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
                        <Link>Learn more</Link> about importing words from CSV
                        files, Excel or Google Sheets.
                      </Text>

                      <Box mt="3" {...getRootProps()}>
                        <input {...getInputProps()} />
                        <Button colorScheme="secondary">
                          Open CSV file...
                        </Button>
                      </Box>

                      <Text mt="6" mb="0">
                        ...or paste CSV below:
                      </Text>

                      <Textarea
                        mt="3"
                        placeholder="Paste CSV here..."
                        value={state.csvInput}
                        onChange={(evt: any) => {
                          state.csvInput = evt.target.value
                        }}
                      />
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
