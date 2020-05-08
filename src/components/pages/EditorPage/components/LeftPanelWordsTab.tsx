import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { useState, useCallback, useRef } from 'react'
import { Label } from './shared'
import { Button } from 'components/shared/Button'
import { Box } from 'components/shared/Box'
import { BaseBtn } from 'components/shared/BaseBtn'
import { TextInput } from 'components/shared/TextInput'

export type LeftPanelWordsTabProps = {
  type: 'shape' | 'background'
}

const Toolbar = styled(Box)``

const WordList = styled(Box)``

const WordRow = styled(Box)`
  width: 100%;
  padding: 4px 0;
  display: flex;
`

const WordTitleWrapper = styled(BaseBtn)`
  width: 100%;
  text-align: left;
`

const WordTitleInput = styled(TextInput)`
  width: 100%;
  /* padding: 3px; */
`

const WordTitleInlineEditor: React.FC<{
  value: string
  onChange: (value: string) => void
}> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState<string | null>(null)

  const finishEditing = useCallback(() => {
    if (inputValue != null) {
      onChange(inputValue)
    }
    setInputValue(null)
  }, [inputValue])

  const startEditing = useCallback(() => {
    setInputValue(value)
  }, [value])

  const isEditing = value === '' || inputValue != null

  return (
    <>
      {!isEditing && (
        <WordTitleWrapper px={2} onClick={startEditing}>
          {value || <em>Type word here...</em>}
        </WordTitleWrapper>
      )}
      {isEditing && (
        <WordTitleInput
          autoFocus
          placeholder="Type word here..."
          onChange={setInputValue}
          value={inputValue || ''}
          onBlur={finishEditing}
        />
      )}
    </>
  )
}

export const LeftPanelWordsTab: React.FC<LeftPanelWordsTabProps> = observer(
  (props) => {
    const { editorPageStore } = useStore()
    const style = props.type
      ? editorPageStore.shapeStyle
      : editorPageStore.backgroundStyle
    const words = style.words

    return (
      <>
        <Label>Words</Label>
        <Toolbar mt={2}>
          <Button
            px={1}
            py={1}
            primary
            onClick={() => editorPageStore.addEmptyWord(props.type)}
          >
            <evaicons.PlusOutline size="20" /> Add
          </Button>
        </Toolbar>

        <WordList mt={2}>
          {words.map((word) => (
            <WordRow key={word.id}>
              <WordTitleInlineEditor
                value={word.text}
                onChange={(value) => {
                  editorPageStore.updateWord(props.type, word.id, {
                    text: value,
                  })
                }}
              />

              <Button
                px={2}
                py={2}
                secondary
                outline
                onClick={() => editorPageStore.deleteWord(props.type, word.id)}
              >
                <evaicons.CloseOutline size="20" />
              </Button>
            </WordRow>
          ))}
        </WordList>
      </>
    )
  }
)
