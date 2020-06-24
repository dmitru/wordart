import { Button, ButtonProps } from 'components/shared/Button'
import { DotsThreeVertical } from '@styled-icons/entypo/DotsThreeVertical'
import css from '@emotion/css'

export const MenuDotsButton: React.FC<
  ButtonProps & { noShadows?: boolean }
> = ({ noShadows = true, ...props }) => (
  <Button
    variant="ghost"
    aria-label="Menu"
    {...props}
    px="2"
    css={css`
      ${noShadows &&
      `
      box-shadow: none !important;
      border: none;
    `}
    `}
  >
    <DotsThreeVertical size={18} />
  </Button>
)
