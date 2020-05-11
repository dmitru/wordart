export const theme = {
  colors: {
    primary: '#17a2b8',
    accent: '#F45B5C',
    secondary: '#575a7b',
    success: '#2cd4a2',
    danger: '#f9655b',
    info: '#17a2b8',
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
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'inherit',
    monospace: 'Menlo, monospace',
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64, 96],
  fontWeights: {
    body: 400,
    normal: 400,
    semibold: 500,
    heading: 700,
    bold: 700,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.25,
  },
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  sizes: {
    avatar: 48,
  },
  radii: {
    none: 0,
    default: 4,
    circle: 99999,
  },
  shadows: {
    card: '0 0 4px rgba(0, 0, 0, .125)',
  },
  // rebass variants
  // text: {
  //   heading: {
  //     fontFamily: 'heading',
  //     lineHeight: 'heading',
  //     fontWeight: 'heading',
  //   },
  //   display: {
  //     fontFamily: 'heading',
  //     fontWeight: 'heading',
  //     lineHeight: 'heading',
  //     fontSize: [5, 6, 7],
  //   },
  //   caps: {
  //     textTransform: 'uppercase',
  //     letterSpacing: '0.1em',
  //   },
  // },
  // variants: {
  //   avatar: {
  //     width: 'avatar',
  //     height: 'avatar',
  //     borderRadius: 'circle',
  //   },
  //   card: {
  //     p: 2,
  //     bg: 'background',
  //     boxShadow: 'card',
  //   },
  //   link: {
  //     color: 'primary',
  //   },
  //   nav: {
  //     fontSize: 1,
  //     fontWeight: 'bold',
  //     display: 'inline-block',
  //     p: 2,
  //     color: 'inherit',
  //     textDecoration: 'none',
  //     ':hover,:focus,.active': {
  //       color: 'primary',
  //     },
  //   },
  // },
  // buttons: {
  //   primary: {
  //     fontSize: 2,
  //     fontWeight: 'bold',
  //     color: 'background',
  //     bg: 'primary',
  //     borderRadius: 'default',
  //   },
  //   outline: {
  //     variant: 'buttons.primary',
  //     color: 'primary',
  //     bg: 'transparent',
  //     boxShadow: 'inset 0 0 2px',
  //   },
  //   secondary: {
  //     variant: 'buttons.primary',
  //     color: 'background',
  //     bg: 'secondary',
  //   },
  // },
  // styles: {
  //   root: {
  //     fontFamily: 'body',
  //     fontWeight: 'body',
  //     lineHeight: 'body',
  //   },
  // },
  // forms: {
  //   input: {
  //     color: 'primary',
  //     px: 4,
  //     mt: 3,
  //     borderColor: 'primary',
  //   },
  //   select: {
  //     borderRadius: 9999,
  //   },
  //   textarea: {},
  //   label: {},
  //   radio: {},
  //   checkbox: {},
  // },
}

export type Theme = typeof theme
