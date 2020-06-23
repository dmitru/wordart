import { Button, ButtonProps } from 'components/shared/Button'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import css from '@emotion/css'

export const MenuDotsButton: React.FC<ButtonProps> = (props) => (
  <Button
    variant="ghost"
    aria-label="Menu"
    {...props}
    px="2"
    css={css`
      box-shadow: none !important;
      border: none;
    `}
  >
    <DotsThreeVertical size={18} />
  </Button>
)
