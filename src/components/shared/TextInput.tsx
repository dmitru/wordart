import styled from '@emotion/styled'
import { noop } from 'lodash'
import * as ss from 'styled-system'
import { textColor } from 'styles/system'
import { BoxProps, Box } from 'components/shared/Box'
import { css } from '@emotion/react'

export type TextInputProps = Omit<StyledTextInputProps, 'onChange'> & {
  value: string
  children?: React.ReactNode
  onChange?: (value: string) => void
  containerProps?: BoxProps & any
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  children = null,
  onChange = noop,
  containerProps = {},
  ...otherProps
}) => {
  return (
    <Box {...containerProps}>
      {children}
      <StyledTextInput
        {...otherProps}
        px={2}
        py={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
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
