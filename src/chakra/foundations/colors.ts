export interface ColorHues {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

export type Colors = typeof colors

const colors = {
  transparent: 'transparent',
  current: 'currentColor',
  black: '#000',
  white: '#fff',

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
  primary: {
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
  },
  accent: {
    50: '#fff5f5',
    100: '#fed7d7',
    200: '#feb2b2',
    300: '#fc8181',
    400: '#f56565',
    500: 'hsl(358, 80%, 65%)',
    600: '#c53030',
    700: '#9b2c2c',
    800: '#822727',
    900: '#63171b',
  },

  secondary: {
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
  },

  whiteAlpha: {
    50: 'rgba(255, 255, 255, 0.04)',
    100: 'rgba(255, 255, 255, 0.06)',
    200: 'rgba(255, 255, 255, 0.08)',
    300: 'rgba(255, 255, 255, 0.16)',
    400: 'rgba(255, 255, 255, 0.24)',
    500: 'rgba(255, 255, 255, 0.36)',
    600: 'rgba(255, 255, 255, 0.48)',
    700: 'rgba(255, 255, 255, 0.64)',
    800: 'rgba(255, 255, 255, 0.80)',
    900: 'rgba(255, 255, 255, 0.92)',
  },

  blackAlpha: {
    50: 'rgba(0, 0, 0, 0.04)',
    100: 'rgba(0, 0, 0, 0.06)',
    200: 'rgba(0, 0, 0, 0.08)',
    300: 'rgba(0, 0, 0, 0.16)',
    400: 'rgba(0, 0, 0, 0.24)',
    500: 'rgba(0, 0, 0, 0.36)',
    600: 'rgba(0, 0, 0, 0.48)',
    700: 'rgba(0, 0, 0, 0.64)',
    800: 'rgba(0, 0, 0, 0.80)',
    900: 'rgba(0, 0, 0, 0.92)',
  },

  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },

  red: {
    50: '#fff5f5',
    100: '#fed7d7',
    200: '#feb2b2',
    300: '#fc8181',
    400: '#f56565',
    500: '#e53e3e',
    600: '#c53030',
    700: '#9b2c2c',
    800: '#822727',
    900: '#63171b',
  },

  orange: {
    50: '#FFFAF0',
    100: '#FEEBC8',
    200: '#FBD38D',
    300: '#F6AD55',
    400: '#ED8936',
    500: '#DD6B20',
    600: '#C05621',
    700: '#9C4221',
    800: '#7B341E',
    900: '#652B19',
  },

  yellow: {
    50: '#fffff0',
    100: '#fefcbf',
    200: '#faf089',
    300: '#f6e05e',
    400: '#ecc94b',
    500: '#d69e2e',
    600: '#b7791f',
    700: '#975a16',
    800: '#744210',
    900: '#5F370E',
  },

  green: {
    50: '#f0fff4',
    100: '#c6f6d5',
    200: '#9ae6b4',
    300: '#68d391',
    400: '#48bb78',
    500: '#38a169',
    600: '#2f855a',
    700: '#276749',
    800: '#22543d',
    900: '#1C4532',
  },

  teal: {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795',
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
  },

  blue: {
    50: '#ebf8ff',
    100: '#ceedff',
    200: '#90cdf4',
    300: '#63b3ed',
    400: '#4299e1',
    500: '#3182ce',
    600: '#2a69ac',
    700: '#1e4e8c',
    800: '#153e75',
    900: '#1a365d',
  },

  cyan: {
    50: '#EDFDFD',
    100: '#C4F1F9',
    200: '#9DECF9',
    300: '#76E4F7',
    400: '#0BC5EA',
    500: '#00B5D8',
    600: '#00A3C4',
    700: '#0987A0',
    800: '#086F83',
    900: '#065666',
  },

  purple: {
    50: '#faf5ff',
    100: '#e9d8fd',
    200: '#d6bcfa',
    300: '#b794f4',
    400: '#9f7aea',
    500: '#805ad5',
    600: '#6b46c1',
    700: '#553c9a',
    800: '#44337a',
    900: '#322659',
  },

  pink: {
    50: '#fff5f7',
    100: '#fed7e2',
    200: '#fbb6ce',
    300: '#f687b3',
    400: '#ed64a6',
    500: '#d53f8c',
    600: '#b83280',
    700: '#97266d',
    800: '#702459',
    900: '#521B41',
  },

  linkedin: {
    50: '#E8F4F9',
    100: '#CFEDFB',
    200: '#9BDAF3',
    300: '#68C7EC',
    400: '#34B3E4',
    500: '#00A0DC',
    600: '#008CC9',
    700: '#0077B5',
    800: '#005E93',
    900: '#004471',
  },

  facebook: {
    50: '#E8F4F9',
    100: '#D9DEE9',
    200: '#B7C2DA',
    300: '#6482C0',
    400: '#4267B2',
    500: '#385898',
    600: '#314E89',
    700: '#29487D',
    800: '#223B67',
    900: '#1E355B',
  },

  messenger: {
    50: '#D0E6FF',
    100: '#B9DAFF',
    200: '#A2CDFF',
    300: '#7AB8FF',
    400: '#2E90FF',
    500: '#0078FF',
    600: '#0063D1',
    700: '#0052AC',
    800: '#003C7E',
    900: '#002C5C',
  },

  whatsapp: {
    50: '#e2f7f4',
    100: '#c3f0e9',
    200: '#a0e7dc',
    300: '#76dccd',
    400: '#43cfba',
    500: '#00BFA5',
    600: '#00ac92',
    700: '#009780',
    800: '#007d6a',
    900: '#005a4c',
  },

  twitter: {
    50: '#e5f4fd',
    100: '#c8e9fb',
    200: '#a8dcfa',
    300: '#83cdf7',
    400: '#57bbf5',
    500: '#1DA1F2',
    600: '#1a94da',
    700: '#1681bf',
    800: '#136b9e',
    900: '#0d4d71',
  },

  telegram: {
    50: '#e3f2f9',
    100: '#c5e4f3',
    200: '#a2d4ec',
    300: '#7ac1e4',
    400: '#47a9da',
    500: '#0088CC',
    600: '#007ab8',
    700: '#006ba1',
    800: '#005885',
    900: '#003f5e',
  },
}

export default colors
