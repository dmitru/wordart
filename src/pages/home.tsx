import { DashboardPage } from 'components/pages/DashboardPage/DashboardPage'
import { LoggedInAndVerifiedPageGuard } from 'components/helpers/LoggedInAndVerifiedPageGuard'

export default LoggedInAndVerifiedPageGuard(DashboardPage)
