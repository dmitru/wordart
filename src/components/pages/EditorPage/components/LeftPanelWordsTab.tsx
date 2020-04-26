import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import styled from 'styled-components'
import { BaseBtn } from 'components/shared/BaseBtn/BaseBtn'
import * as evaicons from '@styled-icons/evaicons-outline'
import { useState, useCallback, useRef } from 'react'

export type LeftPanelWordsTabProps = {}

const Toolbar = styled.div``

const WordList = styled.div``

const WordRow = styled.div`
  width: 100%;
  padding: 4px 0;
  display: flex;
`

const DeleteBtn = styled(BaseBtn)`
  padding: 5px;
  background: red;
  color: white;
`

const AddBtn = styled(BaseBtn)`
  padding: 5px;
  background: green;
  color: white;
`

const WordTitleWrapper = styled(BaseBtn)`
  width: 100%;
  padding: 3px;
`

const WordTitleInput = styled.input`
  width: 100%;
  padding: 3px;
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

  const isEditing = inputValue != null

  return (
    <>
      {!isEditing && (
        <WordTitleWrapper onClick={startEditing}>
          {value || <em>Type in word here...</em>}
        </WordTitleWrapper>
      )}
      {isEditing && (
        <WordTitleInput
          autoFocus
          placeholder="Type in word here..."
          onChange={(e) => {
            setInputValue(e.target.value)
          }}
          value={inputValue || ''}
          onBlur={finishEditing}
        />
      )}
    </>
  )
}

export const LeftPanelWordsTab: React.FC<LeftPanelWordsTabProps> = observer(
  () => {
    const { editorPageStore } = useStore()
    return (
      <>
        <Toolbar>
          <AddBtn onClick={() => editorPageStore.addEmptyWord()}>
            <evaicons.PlusOutline size="20" /> Add
          </AddBtn>
        </Toolbar>

        <WordList>
          {editorPageStore.getWords().map((word) => (
            <WordRow key={word.id}>
              <WordTitleInlineEditor
                value={word.text}
                onChange={(value) => {
                  editorPageStore.updateWord(word.id, { text: value })
                }}
              />

              <DeleteBtn onClick={() => editorPageStore.deleteWord(word.id)}>
                <evaicons.CloseOutline size="20" />
              </DeleteBtn>
            </WordRow>
          ))}
        </WordList>
      </>
    )
  }
)
