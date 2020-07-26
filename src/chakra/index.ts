import theme, { Theme as ChakraTheme } from '@chakra-ui/theme'
import colors from './foundations/colors'

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
        field: {
          ...theme.components.Input.baseStyle.field,
          _placeholder: {
            // @ts-ignore
            ...theme.components.Input.baseStyle.field._placeholder,
            opacity: 1,
            color: 'gray.500',
          },
        },
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
    Tooltip: {
      ...theme.components.Tooltip,
      baseStyle: (props) => {
        const baseStyle = theme.components.Tooltip.baseStyle(props)
        return {
          ...baseStyle,
          container: {
            ...baseStyle.container,
            zIndex: 1003,
          },
          arrow: {
            ...baseStyle.arrow,
            zIndex: 1003,
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
          header: {
            ...baseStyle.header,
            fontWeight: 'normal',
          },
          overlay: {
            ...baseStyle.overlay,
            zIndex: 1002,
          },
        }
      },
    },
  },
}

export type Theme = typeof myTheme

export default myTheme
