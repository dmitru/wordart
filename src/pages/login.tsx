import { LoginPage } from 'components/pages/LoginPage/LoginPage'
import { NonLoggedInPageGuard } from 'components/helpers/NonLoggedInPageGuard'

export default NonLoggedInPageGuard(LoginPage)
