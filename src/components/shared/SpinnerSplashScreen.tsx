import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'
import { Spinner, Box, Heading } from '@chakra-ui/core'

export const SpinnerSplashScreen = () => (
  <SiteLayout>
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Spinner size="xl" color="gray.300" />
      <Heading color="gray.500" size="lg">
        Wordcloudy
      </Heading>
    </Box>
  </SiteLayout>
)
