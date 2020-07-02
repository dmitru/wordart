import { theme as chakraTheme } from '@chakra-ui/core'

const primary = {
  50: 'hsl(202, 58%, 92%)',
  100: 'hsl(202, 58%, 85%)',
  200: 'hsl(204, 58%, 75%)',
  300: 'hsl(203, 57%, 68%)',
  400: 'hsl(205, 53%, 62%)',
  500: 'hsl(205, 50%, 55%)',
  600: 'hsl(205, 57%, 46%)',
  700: 'hsl(206, 56%, 37%)',
  800: 'hsl(207, 56%, 30%)',
  900: 'hsl(210, 63%, 26%);',
}

const secondary = {
  50: 'hsl(182, 63%, 92%)',
  100: 'hsl(187, 62%, 85%)',
  200: 'hsl(187, 60%, 75%)',
  300: 'hsl(187, 57%, 68%)',
  400: 'hsl(187, 53%, 62%)',
  500: 'hsl(187, 53%, 55%)',
  600: 'hsl(187, 57%, 45%)',
  700: 'hsl(187, 56%, 40%)',
  800: 'hsl(190, 56%, 37%)',
  900: 'hsl(193, 73%, 30%);',
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
      bg: 'linear-gradient(-90deg,hsl(200,45%,48%),hsla(219, 45%, 54%, 1))',
    },
    leftPanel: {
      bg: 'hsla(205,15%, 33%, 1)',
      bgHover: 'hsla(205,15%, 28%, 1)',
      bgActive: 'hsla(205,45%, 48%, 1)',
      bgActiveHover: 'hsla(205,45%, 43%, 1)',
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
