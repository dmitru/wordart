import { Button, ButtonProps } from 'components/shared/Button'
import { Icon } from '@chakra-ui/core'

export const DeleteButton: React.FC<ButtonProps> = (props) => (
  <Button size="xs" variant="ghost" {...props}>
    <Icon name="close" />
  </Button>
)
