import React from 'react'

/**
 * Shim for MenuTransition which was removed in Chakra UI v1 RC.
 * MenuList now handles its own transitions internally.
 */
export const MenuTransition: React.FC<{
  children: (styles: any) => React.ReactNode
}> = ({ children }) => <>{children({})}</>
