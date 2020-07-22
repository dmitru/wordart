import {
  Tooltip as CTooltip,
  TooltipProps as CTooltipProps,
} from '@chakra-ui/core'

export const Tooltip: React.FC<
  Omit<CTooltipProps, 'aria-label' | 'children'> & {
    'aria-label'?: string
    isDisabled?: boolean
    children: React.ReactNode
  }
> = ({ isDisabled = false, ...props }) =>
  // @ts-ignore
  isDisabled ? (
    props.children || null
  ) : (
    <CTooltip
      openDelay={250}
      hasArrow
      placement="bottom"
      aria-label={props.label || ''}
      {...props}
    />
  )
