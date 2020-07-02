import React from 'react'
import { TooltipProps, BoxProps, Box } from '@chakra-ui/core'
import { Tooltip } from 'components/shared/Tooltip'
import { FaQuestionCircle } from 'react-icons/fa'

export const HelpTooltipIcon: React.FC<
  { label: string; tooltipProps?: Partial<TooltipProps> } & Partial<BoxProps>
> = ({ label, tooltipProps = {}, ...props }) => (
  <Tooltip label={label} zIndex={100} showDelay={200} {...tooltipProps}>
    <Box my="0" cursor="help" ml="2" fontSize="lg" color="gray.400" {...props}>
      <FaQuestionCircle />
    </Box>
  </Tooltip>
)
