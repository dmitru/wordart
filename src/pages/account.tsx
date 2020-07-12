import { AccountPage } from 'components/pages/AccountPage/AccountPage'
import { LoggedInAndVerifiedPageGuard } from 'components/helpers/LoggedInAndVerifiedPageGuard'

export default LoggedInAndVerifiedPageGuard(AccountPage)
