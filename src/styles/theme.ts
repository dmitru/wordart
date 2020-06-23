import { theme as chakraTheme } from '@chakra-ui/core'

const teal = {
  ...chakraTheme.colors.teal,
  // 500: 'hsla(178, 39%, 51%, 1)',
}

const accent = {
  ...chakraTheme.colors.orange,
  500: 'rgb(237, 93, 97)',
}

export const theme = {
  ...chakraTheme,
  colors: {
    leftPanel: {
      textInactive: 'hsl(240, 10%, 91%)',
      200: 'hsla(240, 42%, 64%, 1)',
      300: 'hsla(240, 42%, 60%, 1)',
      600: 'hsla(240, 33%, 51%, 1)',
      700: 'hsla(240, 33%, 47%, 1)',
    },
    ...chakraTheme.colors,
    primary: {
      ...chakraTheme.colors.purple,
      500: 'hsla(239, 44%, 57%, 1)',
    },
    accent,
    secondary: chakraTheme.colors.whatsapp,
    success: chakraTheme.colors.green,
    danger: chakraTheme.colors.red,
    info: chakraTheme.colors.blue,
    //
    textLight: 'white',
    text: '#222',
    teal: chakraTheme.colors.whatsapp,
    //
    light: 'white',
    light1: '#eaeaea',
    light100: '#eee',
    dark: '#222',
    dark1: '#333',
    dark2: '#444',
    dark3: '#555',
    dark4: '#666',
    muted: {
      500: '#666',
    },
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
