import { Box, MenuItem, MenuItemProps } from '@chakra-ui/core'
import React from 'react'

export const MenuItemWithIcon = React.forwardRef<
  Omit<MenuItemProps, 'title'> & { icon?: React.ReactNode; title?: string },
  any
>(({ icon, title, children, ...props }, ref) => (
  <MenuItem {...props} ref={ref}>
    {icon && (
      <Box mr="2" fontSize="lg" color="gray.500">
        {icon}
      </Box>
    )}
    {title}
    {children}
  </MenuItem>
))
