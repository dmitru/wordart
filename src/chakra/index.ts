import theme, { Theme as ChakraTheme } from '@chakra-ui/theme'
import colors from './foundations/colors'

const myTheme: ChakraTheme = {
  ...theme,
  colors,
  components: {
    ...theme.components,
    Input: {
      ...theme.components.Input,
      baseStyle: {
        ...theme.components.Input.baseStyle,
        field: {
          // @ts-ignore
          ...theme.components.Input.baseStyle.field,
          // @ts-ignore
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
        // @ts-ignore
        textDecoration: 'none !important',
        fontWeight: '500',
      },
    },
    Menu: {
      ...theme.components.Menu,
      baseStyle: (props) => {
        // @ts-ignore
        const baseStyle = theme.components.Menu.baseStyle(props)
        return {
          ...baseStyle,
          list: {
            ...baseStyle.list,
            zIndex: 1000,
          },
        }
      },
    },
    Popover: {
      ...theme.components.Popover,
      // @ts-ignore
      baseStyle: (props) => {
        // @ts-ignore
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
        // @ts-ignore
        const baseStyle = theme.components.Tooltip.baseStyle(props)
        return {
          ...baseStyle,
          zIndex: 1003,
        }
      },
    },
    Modal: {
      ...theme.components.Modal,
      baseStyle: (props) => {
        // @ts-ignore
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
