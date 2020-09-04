import { BoxProps, Button, ButtonProps, Flex } from '@chakra-ui/core'

export type Choice = {
  title: string
  value: string
}

export const ChoiceButtons: React.FC<
  {
    choices: Choice[]
    value: string
    onChange: (value: string) => void
    size?: ButtonProps['size']
  } & Omit<BoxProps, 'size' | 'onChange'>
> = ({ size = 'md', choices, value, onChange, ...props }) => {
  return (
    <Flex direction="row" {...props}>
      {choices.map((choice, index) => (
        <Button
          {...(index < choices.length - 1
            ? {
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
              }
            : {})}
          {...(index > 0
            ? {
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }
            : {})}
          px="2"
          py="1"
          size={size}
          mr="0"
          variant="solid"
          colorScheme={choice.value === value ? 'primary' : undefined}
          onClick={() => {
            onChange(choice.value)
          }}
        >
          {choice.title}
        </Button>
      ))}
    </Flex>
  )
}
