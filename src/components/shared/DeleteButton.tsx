import { Button, ButtonProps } from 'components/shared/Button'
import { CloseIcon } from '@chakra-ui/icons'
import css from '@emotion/css'

export const DeleteButton: React.FC<Omit<ButtonProps, 'children' | 'ref'>> = (
  props
) => (
  <Button
    size="xs"
    variant="ghost"
    color="gray.500"
    {...props}
    css={css`
      box-shadow: none !important;
      border: none;
    `}
  >
    <CloseIcon />
  </Button>
)
