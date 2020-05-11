import styled from '@emotion/styled'
import { noop } from 'lodash'
import * as ss from 'styled-system'
import { textColor } from 'styles/system'
import { BoxProps, Box } from 'components/shared/Box'
import { css } from '@emotion/react'
import { TextInputProps } from 'components/shared/TextInput'
import { TextInput } from 'components/shared/TextInput'
import { Search } from '@styled-icons/material/Search'

export const SearchInput: React.FC<TextInputProps> = (props) => (
  <TextInput
    containerProps={{
      width: '90px',
      css: css`
        position: relative;
      `,
    }}
    placeholder="Search shapes..."
    css={css`
      padding-left: 32px;
    `}
    {...props}
  >
    <Search
      size={24}
      css={css`
        left: 8px;
        top: 8px;
        position: absolute;
      `}
    />
  </TextInput>
)
