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

export type ImportWordsModalProps = {
  isOpen: boolean
  onClose: () => void
  onImported: (words: string[]) => void
}

const state = observable({
  textInput: '',
})

export const ImportWordsModal: React.FC<ImportWordsModalProps> = observer(
  ({ isOpen, onClose, onImported }) => {
    return (
      <Modal size="lg" isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Words</ModalHeader>

          <ModalBody>
            <Tabs size="md" variant="line">
              <TabList>
                <Tab>From Text</Tab>
                <Tab>From CSV / Excel</Tab>
                <Tab>From Web</Tab>
              </TabList>
              <TabPanels>
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
                  <Stack spacing="3" mt="4" mb="4">
                    <Checkbox>Remove common words</Checkbox>
                    <Checkbox>Remove numbers</Checkbox>
                    <Checkbox>
                      Word stemming (e.g. treat “love” and “loves” as one word)
                    </Checkbox>
                  </Stack>
                </TabPanel>
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
                      <Text>Or you can choose a CSV file: </Text>
                      <Button variantColor="secondary">Open CSV file...</Button>
                    </Box>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          <ModalFooter>
            <Checkbox marginRight="auto">
              Clear the words list before importing
            </Checkbox>
            <Button
              ml="3"
              variantColor="primary"
              onClick={() => {
                const rawWords = state.textInput
                  .split(' ')
                  .map((word) => word.toLocaleLowerCase().trim())
                const processedWords = stopword.removeStopwords(rawWords)
                onImported(processedWords)
              }}
            >
              Import
            </Button>
          </ModalFooter>

          <ModalCloseButton />
        </ModalContent>
      </Modal>
    )
  }
)
