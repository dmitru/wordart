import React from 'react'
import { TooltipProps, BoxProps, Box } from '@chakra-ui/core'
import { Tooltip } from 'components/shared/Tooltip'
import { FaQuestionCircle } from 'react-icons/fa'
import css from '@emotion/css'

export const HelpTooltipIcon: React.FC<
  { label: React.ReactNode; tooltipProps?: Partial<TooltipProps> } & Partial<
    BoxProps
  >
> = ({ label, tooltipProps = {}, ...props }) => (
  <Tooltip
    // @ts-ignore
    label={label}
    {...tooltipProps}
  >
    <Box
      my="0"
      cursor="help"
      ml="2"
      fontSize="lg"
      color="blue.200"
      display="inline-block"
      {...props}
    >
      <FaQuestionCircle />
    </Box>
  </Tooltip>
)
