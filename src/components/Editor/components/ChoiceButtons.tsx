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
    <Flex direction="row">
      {choices.map((choice) => (
        <Button
          px="2"
          py="1"
          mr="0"
          size="sm"
          variant={choice.value === value ? 'solid' : 'outline'}
          variantColor={choice.value === value ? 'secondary' : undefined}
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
