import theme, { Theme as ChakraTheme } from '@chakra-ui/theme'
import colors from './foundations/colors'

export type Theme = ChakraTheme

const myTheme: ChakraTheme = {
  ...theme,
  fonts: {
    ...theme.fonts,
    // heading: `Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    // body: `"Maven Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  },
  colors,
  components: {
    ...theme.components,
    Input: {
      ...theme.components.Input,
      baseStyle: {
        ...theme.components.Input.baseStyle,
      },
    },
    Button: {
      ...theme.components.Button,
      baseStyle: {
        ...theme.components.Button.baseStyle,
        container: {
          ...theme.components.Button.baseStyle.container,
          textDecoration: 'none !important',
          fontWeight: '500',
        },
      },
    },
    Menu: {
      ...theme.components.Menu,
      baseStyle: (props) => {
        const baseStyle = theme.components.Menu.baseStyle(props)
        return {
          ...baseStyle,
          menuList: {
            ...baseStyle.menuList,
            zIndex: 1000,
          },
        }
      },
    },
    Popover: {
      ...theme.components.Popover,
      baseStyle: (props) => {
        const baseStyle = theme.components.Popover.baseStyle(props)
        return {
          ...baseStyle,
          content: {
            ...baseStyle.content,
            zIndex: 1000,
          },
        }
      },
    },
    Modal: {
      ...theme.components.Modal,
      baseStyle: (props) => {
        const baseStyle = theme.components.Modal.baseStyle(props)
        return {
          ...baseStyle,
          overlay: {
            ...baseStyle.overlay,
            zIndex: 1000,
          },
        }
      },
    },
  },
}

export default myTheme
