import { Box, MenuItem, MenuItemProps } from '@chakra-ui/core'
import React from 'react'

export const MenuItemWithIcon = React.forwardRef<
  MenuItemProps & { icon: React.ReactNode },
  any
>(({ icon, children, ...props }, ref) => (
  <MenuItem {...props} ref={ref}>
    <Box mr="2" fontSize="lg" color="gray.500">
      {icon}
    </Box>
    {children}
  </MenuItem>
))
