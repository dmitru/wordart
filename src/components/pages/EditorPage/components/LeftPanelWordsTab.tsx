import { observer } from 'mobx-react'
import { useStore } from 'root-store'
import styled from '@emotion/styled'
import * as evaicons from '@styled-icons/evaicons-outline'
import { useState, useCallback } from 'react'
import { Label } from './shared'
import { Button } from 'components/shared/Button'
import { Box } from 'components/shared/Box'
import { BaseBtn } from 'components/shared/BaseBtn'
import { TextInput } from 'components/shared/TextInput'
import { observable } from 'mobx'
import { uniq } from 'lodash'
import { TargetKind } from 'components/pages/EditorPage/editor'

export type LeftPanelWordsTabProps = {
  target: TargetKind
}

const WordList = styled(Box)``

const WordDeleteButton = styled(Button)``

const WordRow = styled(Box)`
  width: 100%;
  padding: 4px 0;
  display: flex;

  ${WordDeleteButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  &:hover {
    ${WordDeleteButton} {
      opacity: 1;
    }
  }
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

const FontDeleteButton = styled(Button)``

const FontButton = styled(BaseBtn)`
  border: none;
  flex: 1;
  display: inline-flex;
  height: 38px;

  img {
    height: 30px;
    margin: 0;
    object-fit: contain;
  }
`
FontButton.defaultProps = {
  px: 2,
  py: 1,
}

const FontButtonContainer = styled(Box)`
  ${FontDeleteButton} {
    opacity: 0;
    transition: 0.2s opacity;
  }

  transition: 0.1s background;

  &:hover {
    background: ${(p) => p.theme.colors.light1};
    ${FontDeleteButton} {
      opacity: 1;
    }
  }
`
FontButtonContainer.defaultProps = {
  display: 'flex',
  alignItems: 'center',
}

const state = observable({
  isAddingFont: false,
  replacingFontIndex: undefined as undefined | number,
})

const Toolbar = styled(Box)``

export const LeftPanelWordsTab: React.FC<LeftPanelWordsTabProps> = observer(
  ({ target }) => {
    const { editorPageStore: store } = useStore()
    const style = store.styles[target]
    const words = style.words

    const fonts = store.getAvailableFonts()

    return (
      <>
        <Box mb={4}>
          {state.isAddingFont && (
            <>
              <Toolbar mb={3} display="flex" alignItems="center">
                <Label flex={1}>Choose Font</Label>
                <Button
                  px={2}
                  py={1}
                  mr={2}
                  secondary
                  outline
                  onClick={() => {
                    state.isAddingFont = false
                    state.replacingFontIndex = undefined
                  }}
                >
                  <evaicons.ArrowIosBackOutline className="icon" size="20" />{' '}
                  Back
                </Button>
              </Toolbar>
              {fonts.map((font) => {
                const { style: fontStyle } = font
                return (
                  <FontButtonContainer key={fontStyle.fontId}>
                    <FontButton
                      onClick={() => {
                        if (state.replacingFontIndex != null) {
                          style.words.fonts = uniq(
                            style.words.fonts.map((f, index) =>
                              index === state.replacingFontIndex
                                ? fontStyle.fontId
                                : f
                            )
                          )
                        } else {
                          style.words.fonts = uniq([
                            ...style.words.fonts,
                            fontStyle.fontId,
                          ])
                        }
                        state.isAddingFont = false
                        state.replacingFontIndex = undefined
                      }}
                    >
                      <img src={fontStyle.thumbnail} />
                    </FontButton>
                  </FontButtonContainer>
                )
              })}
            </>
          )}
          {!state.isAddingFont && (
            <>
              <Toolbar mb={3} display="flex" alignItems="center">
                <Label flex={1}>Fonts</Label>
                <Button
                  px={2}
                  py={1}
                  mr={2}
                  primary
                  onClick={() => {
                    state.isAddingFont = true
                  }}
                >
                  <evaicons.PlusOutline size="20" /> Add
                </Button>
                <Button
                  px={2}
                  py={1}
                  outline
                  onClick={() => {
                    style.words.fonts = [style.words.fonts[0]]
                  }}
                >
                  Clear
                </Button>
              </Toolbar>

              {/* Added fonts */}
              {style.words.fonts.map((fontId, index) => {
                const { style: fontStyle } = store.getFontById(fontId)!
                return (
                  <FontButtonContainer key={fontId}>
                    <FontButton
                      onClick={() => {
                        state.replacingFontIndex = index
                        state.isAddingFont = true
                      }}
                    >
                      <img src={fontStyle.thumbnail} />
                    </FontButton>

                    <FontDeleteButton
                      px={2}
                      py={0}
                      ml={3}
                      secondary
                      outline
                      onClick={() => {
                        style.words.fonts = style.words.fonts.filter(
                          (fId) => fId !== fontId
                        )
                      }}
                    >
                      <evaicons.CloseOutline size="20" />
                    </FontDeleteButton>
                  </FontButtonContainer>
                )
              })}
            </>
          )}
        </Box>

        {!state.isAddingFont && (
          <Box>
            <Toolbar display="flex" alignItems="center">
              <Label flex={1}>Words</Label>
              <Button
                px={2}
                py={1}
                mr={2}
                primary
                onClick={() => store.addEmptyWord(target)}
              >
                <evaicons.PlusOutline size="20" /> Add
              </Button>
              <Button
                px={2}
                py={1}
                outline
                onClick={() => store.clearWords(target)}
              >
                Clear
              </Button>
            </Toolbar>

            <WordList mt={2}>
              {words.wordList.map((word) => (
                <WordRow key={word.id}>
                  <WordTitleInlineEditor
                    value={word.text}
                    onChange={(value) => {
                      store.updateWord(target, word.id, {
                        text: value,
                      })
                    }}
                  />

                  <WordDeleteButton
                    px={2}
                    py={2}
                    secondary
                    outline
                    onClick={() => store.deleteWord(target, word.id)}
                  >
                    <evaicons.CloseOutline size="20" />
                  </WordDeleteButton>
                </WordRow>
              ))}
            </WordList>
          </Box>
        )}
      </>
    )
  }
)
