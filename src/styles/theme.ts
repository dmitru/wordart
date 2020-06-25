import { theme as chakraTheme } from '@chakra-ui/core'

const primary = {
  50: 'hsl(200, 45%, 90%)',
  100: 'hsl(200, 45%, 75%)',
  200: 'hsl(200, 45%, 67%)',
  300: 'hsl(200, 45%, 60%)',
  400: 'hsl(200, 45%, 54%)',
  500: 'hsl(200, 50%, 52%)',
  600: 'hsl(200, 45%, 45%)',
  700: 'hsl(200, 45%, 40%)',
  800: 'hsl(200, 45%, 35%)',
  900: 'hsl(200, 45%, 30%)',
}

const secondary = {
  50: 'hsl(200, 45%, 90%)',
  100: 'hsl(200, 45%, 75%)',
  200: 'hsl(200, 45%, 67%)',
  300: 'hsl(200, 45%, 60%)',
  400: 'hsl(200, 45%, 54%)',
  500: 'hsl(187, 53%, 55%);',
  600: 'hsl(200, 45%, 75%)',
  700: 'hsl(200, 45%, 40%)',
  800: 'hsl(200, 45%, 35%)',
  900: 'hsl(200, 45%, 30%)',
}

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
      bg: 'linear-gradient(90deg,hsl(200,45%,48%),hsla(219, 45%, 54%, 1))',
    },
    leftPanel: {
      bg: 'hsla(200, 15%, 33%, 1)',
      bgHover: 'hsla(200, 15%, 28%, 1)',
      bgActive: 'hsla(200, 45%, 48%, 1)',
      bgActiveHover: 'hsla(200, 45%, 43%, 1)',
      textInactive: 'hsl(200,10%,91%)',
      textActive: '#fff',
    },
    ...chakraTheme.colors,
    primary,
    accent,
    secondary,
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
