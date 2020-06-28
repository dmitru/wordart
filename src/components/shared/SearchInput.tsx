import {
  InputProps as CInputProps,
  InputGroup,
  InputLeftElement,
  Icon,
  InputRightElement,
  InputGroupProps,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { DeleteButton } from 'components/shared/DeleteButton'
import { Input } from 'components/shared/Input'

export const SearchInput: React.FC<
  Omit<CInputProps, 'onChange' | 'size'> & {
    size?: InputGroupProps['size']
    onChange: (value: string) => void
  }
> = ({ onChange, size = 'sm', ...props }) => (
  <InputGroup flex={1} size={size}>
    <InputLeftElement children={<Icon color="gray.400" name="search" />} />
    <Input
      paddingLeft={size === 'sm' ? '30px' : '38px'}
      onChange={(e: any) => onChange(e.target.value as string)}
      css={css`
        background: transparent;
        border: none;
        border-bottom: 1px solid transparent !important;
        &:not(:focus) {
          border-bottom: 1px solid #eee;
        }
      `}
      {...props}
    />
    {!!props.value && (
      <InputRightElement
        onClick={() => onChange('')}
        children={
          <DeleteButton color="gray.400" size="sm" aria-label="Clear" />
        }
      />
    )}
  </InputGroup>
)
