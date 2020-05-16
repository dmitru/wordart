import { Box } from 'components/shared/Box'
import { SiteLayout } from 'components/layouts/SiteLayout/SiteLayout'

export const SpinnerSplashScreen = () => (
  <SiteLayout>
    <Box p={5} fontSize={4}>
      Loading...
    </Box>
  </SiteLayout>
)
