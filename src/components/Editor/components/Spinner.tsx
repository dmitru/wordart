import { Spinner as SpinnerCh, SpinnerProps } from '@chakra-ui/core'

export const Spinner: React.FC<SpinnerProps> = ({ size = 'xl', ...props }) => {
  return (
    <SpinnerCh
      thickness="4px"
      speed="0.65s"
      emptyColor="gray.200"
      color="accent.500"
      size="xl"
      {...props}
    />
  )
}
