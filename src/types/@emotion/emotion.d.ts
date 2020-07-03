import '@emotion/core'
import 'emotion-theming'
import { Theme as MyTheme } from 'chakra'

declare module '@emotion/core' {
  export interface Theme extends MyTheme {}
}

declare module 'emotion-theming' {
  export interface Theme extends MyTheme {}
}
