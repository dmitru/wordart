import {
  InputProps as CInputProps,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  InputGroupProps,
} from '@chakra-ui/core'
import { SearchIcon } from '@chakra-ui/icons'
import css from '@emotion/css'
import { DeleteButton } from 'components/shared/DeleteButton'
import { Input } from 'components/shared/Input'

export const SearchInput: React.FC<
  Omit<CInputProps, 'onChange' | 'size' | 'ref'> & {
    size?: InputGroupProps['size']
    noBorder?: boolean
    onChange: (value: string) => void
  }
> = ({ onChange, noBorder = true, size = 'sm', ...props }) => (
  <InputGroup flex={1} size={size}>
    <InputLeftElement
      css={css`
        top: 12px;
      `}
    >
      <SearchIcon color="gray.400" />
    </InputLeftElement>

    <Input
      paddingLeft={size === 'sm' ? '30px' : '38px'}
      onChange={(e: any) => onChange(e.target.value as string)}
      css={
        noBorder &&
        css`
          background: transparent;
          border: none;
          border-bottom: 1px solid transparent !important;
          &:not(:focus) {
            border-bottom: 1px solid #eee;
          }
        `
      }
      {...props}
    />

    {!!props.value && (
      <InputRightElement
        onClick={() => onChange('')}
        css={css`
          top: 4px;
          padding: 0;
        `}
      >
        <DeleteButton color="gray.400" size="sm" aria-label="Clear" />
      </InputRightElement>
    )}
  </InputGroup>
)
