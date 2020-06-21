import { ThemePreset } from 'components/Editor/style'

export const themePresets: ThemePreset[] = [
  {
    title: 'Dark',
    bgDimSmallerItems: 20,
    shapeDimSmallerItems: 20,
    shapeOpacity: 0.2,
    itemsOpacity: 1.0,
    bgFill: '#252431',
    shapeFill: 'red',
    bgItemsColoring: {
      kind: 'color',
      colors: ['white'],
    },
    shapeItemsColoring: {
      kind: 'shape',
      shapeBrightness: 0,
    },
  },
  {
    title: 'Dark 2',
    bgDimSmallerItems: 20,
    shapeDimSmallerItems: 20,
    shapeOpacity: 0.2,
    itemsOpacity: 1.0,
    bgFill: '#252431',
    shapeFill: 'yellow',
    bgItemsColoring: {
      kind: 'color',
      colors: ['white'],
    },
    shapeItemsColoring: {
      kind: 'shape',
      shapeBrightness: 0,
    },
  },
  {
    title: 'Light',
    bgDimSmallerItems: 20,
    shapeDimSmallerItems: 20,
    shapeOpacity: 0.2,
    itemsOpacity: 1.0,
    bgFill: 'white',
    shapeFill: 'blue',
    bgItemsColoring: {
      kind: 'color',
      colors: ['#aaa'],
    },
    shapeItemsColoring: {
      kind: 'gradient',
      gradient: {
        assignBy: 'random',
        from: 'green',
        to: 'yellow',
      },
    },
  },
  {
    title: 'Light 2',
    bgDimSmallerItems: 20,
    shapeDimSmallerItems: 20,
    shapeOpacity: 0.2,
    itemsOpacity: 1.0,
    bgFill: 'white',
    shapeFill: 'magenta',
    bgItemsColoring: {
      kind: 'color',
      colors: ['#aaa'],
    },
    shapeItemsColoring: {
      kind: 'gradient',
      gradient: {
        assignBy: 'random',
        from: 'blue',
        to: 'salmon',
      },
    },
  },
]
