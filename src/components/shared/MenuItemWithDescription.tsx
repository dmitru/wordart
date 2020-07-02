import { Text, Box, MenuItem, MenuItemProps } from '@chakra-ui/core'
import React from 'react'

export const MenuItemWithDescription = React.forwardRef<
  MenuItemProps & {
    icon: React.ReactNode
    title: string
    description?: string
  },
  any
>(({ icon, title, description, children, ...props }, ref) => (
  <MenuItem {...props} ref={ref}>
    <Box mr="2" fontSize="lg" color="gray.500">
      {icon}
    </Box>
    <Box display="flex" flexDirection="column" py="2">
      <Text my="0" fontWeight="semibold">
        {title}
      </Text>
      {description && (
        <Text my="0" fontSize="xs" color="gray.500">
          {description}
        </Text>
      )}
      {children}
    </Box>
  </MenuItem>
))
