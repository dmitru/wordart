import styled from '@emotion/styled'
import { noop } from 'lodash'
import * as ss from 'styled-system'
import { textColor } from 'styles/system'
import { BoxProps } from 'components/shared/Box'

export type TextInputProps = Omit<StyledTextInputProps, 'onChange'> & {
  value: string
  onChange?: (value: string) => void
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange = noop,
  ...otherProps
}) => {
  return (
    <StyledTextInput
      px={2}
      py={1}
      value={value}
      {...otherProps}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

type StyledTextInputProps = BoxProps & JSX.IntrinsicElements['input']

const StyledTextInput = styled('input')<StyledTextInputProps>(
  ss.compose(
    ss.flexbox,
    ss.typography,
    ss.space,
    ss.layout,
    ss.color,
    ss.border,
    textColor
  )
)
