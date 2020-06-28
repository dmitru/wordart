import {
  InputProps as CInputProps,
  InputGroup,
  InputLeftElement,
  Icon,
  InputRightElement,
} from '@chakra-ui/core'
import css from '@emotion/css'
import { DeleteButton } from 'components/shared/DeleteButton'
import { Input } from 'components/shared/Input'

export const SearchInput: React.FC<
  Omit<CInputProps, 'onChange'> & { onChange: (value: string) => void }
> = ({ onChange, ...props }) => (
  <InputGroup flex={1} size="sm">
    <InputLeftElement children={<Icon color="gray.400" name="search" />} />
    <Input
      paddingLeft="30px"
      {...props}
      onChange={(e: any) => onChange(e.target.value as string)}
      css={css`
        border: none;
        border-bottom: 1px solid transparent !important;
        &:not(:focus) {
          border-bottom: 1px solid #eee !important;
        }
      `}
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
