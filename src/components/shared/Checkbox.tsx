import React from 'react'
import styled from '@emotion/styled'
import { Box, BoxProps } from 'components/shared/Box'
import { opacify } from 'polished'

export type CheckboxProps = {
  value: boolean
  onChange?: (value: boolean) => void
  id?: string
  className?: string
  label?: React.ReactNode
  inputProps?: Omit<React.HTMLProps<HTMLInputElement>, 'as' | 'type' | 'ref'>
} & BoxProps

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  value,
  onChange,
  id,
  inputProps,
  ...props
}) => (
  <Box display="inline-flex" fontSize={2} alignItems="flex-start" {...props}>
    <HiddenCheckboxInput
      type="checkbox"
      {...inputProps}
      id={id}
      checked={value}
      onChange={(e) => {
        const value = e.target.checked
        console.log(e.target.checked)
        if (onChange) {
          onChange(value)
        }
      }}
    />
    <StyledCheckbox
      checked={value}
      onClick={() => {
        if (onChange) {
          onChange(!value)
        }
      }}
    >
      <Icon viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </Icon>
    </StyledCheckbox>
    {label && <label htmlFor={id}>{label}</label>}
  </Box>
)

const HiddenCheckboxInput = styled.input<{
  checked: boolean
}>`
  // Hide checkbox visually but remain accessible to screen readers.
  // Source: https://polished.js.org/docs/#hidevisually
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`

const Icon = styled.svg`
  fill: none;
  stroke: white;
  stroke-width: 2px;
`

const StyledCheckbox = styled.div<{ checked: boolean }>`
  display: inline-block;
  width: 24px;
  min-width: 24px;
  height: 24px;
  background: ${(p) =>
    p.checked ? p.theme.colors.primary : p.theme.colors.light};
  border-radius: 3px;
  border: 2px solid
    ${(p) => (p.checked ? p.theme.colors.primary : p.theme.colors.primary)};
  transition: all 150ms;
  margin-right: 8px;

  ${HiddenCheckboxInput}:focus + & {
    box-shadow: 0 0 0 3px ${(p) => opacify(0.7, p.theme.colors.primary)};
  }

  ${Icon} {
    visibility: ${(props) => (props.checked ? 'visible' : 'hidden')};
  }
`
