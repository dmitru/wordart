import { theme as chakraTheme } from '@chakra-ui/core'

export const theme = {
  ...chakraTheme,
  colors: {
    ...chakraTheme.colors,
    primary: chakraTheme.colors.teal,
    accent: chakraTheme.colors.pink,
    secondary: chakraTheme.colors.gray,
    success: chakraTheme.colors.green,
    danger: chakraTheme.colors.red,
    info: chakraTheme.colors.blue,
    //
    textLight: 'white',
    text: '#222',
    //
    light: 'white',
    light1: '#eaeaea',
    light100: '#eee',
    dark: '#222',
    dark1: '#333',
    dark2: '#444',
    dark3: '#555',
    dark4: '#666',
    muted: '#ccc',
  },
  zIndices: {
    ...chakraTheme.zIndices,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 2000,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
}

export type Theme = typeof theme
