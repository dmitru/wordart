import theme, { Theme as ChakraTheme } from '@chakra-ui/theme'
import colors from './foundations/colors'

export type Theme = ChakraTheme

const myTheme: ChakraTheme = {
  ...theme,
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
        // @ts-ignore
        textDecoration: 'none !important',
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
