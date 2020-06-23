import { Button, ButtonProps } from 'components/shared/Button'
import { Icon } from '@chakra-ui/core'
import css from '@emotion/css'

export const DeleteButton: React.FC<Omit<ButtonProps, 'children'>> = (
  props
) => (
  <Button
    size="xs"
    variant="ghost"
    {...props}
    css={css`
      box-shadow: none !important;
      border: none;
    `}
  >
    <Icon name="close" />
  </Button>
)
