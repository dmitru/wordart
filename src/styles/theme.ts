import { theme as chakraTheme } from '@chakra-ui/core'

const teal = {
  ...chakraTheme.colors.teal,
  500: 'hsl(180, 52%, 47%)',
}

const accent = {
  ...chakraTheme.colors.orange,
  500: 'hsl(358, 80%, 65%)',
}

export const theme = {
  ...chakraTheme,
  colors: {
    header: {
      bg: 'linear-gradient( -90deg,hsl(231, 35%, 39%),hsla(231, 35%, 49%, 1))',
    },
    leftPanel: {
      bg: 'hsla(231, 15%, 33%, 1)',
      bgHover: 'hsla(231, 15%, 28%, 1)',
      bgActive: 'hsla(227, 40%, 63%, 1)',
      bgActiveHover: 'hsla(227, 40%, 56%, 1)',
      textInactive: 'hsl(240,10%,91%)',
      textActive: '#fff',
    },
    ...chakraTheme.colors,
    primary: {
      ...chakraTheme.colors.purple,
      100: 'hsl(231, 30%, 78%)',
      200: 'hsl(231, 30%, 74%)',
      300: 'hsl(231, 30%, 69%)',
      400: 'hsl(231, 30%, 66%)',
      500: 'hsl(231, 30%, 61%)',
      600: 'hsl(231, 30%, 51%)',
      700: 'hsl(231, 30%, 46%)',
      800: 'hsl(231, 30%, 41%)',
      900: 'hsl(231, 30%, 37%)',
    },
    accent,
    secondary: teal,
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
