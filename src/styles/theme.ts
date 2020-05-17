import { theme as chakraTheme } from '@chakra-ui/core'

export const theme = {
  ...chakraTheme,
  colors: {
    ...chakraTheme.colors,
    primary: chakraTheme.colors.blue,
    accent: chakraTheme.colors.teal,
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
}

export type Theme = typeof theme
