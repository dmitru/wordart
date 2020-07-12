import { SignupPage } from 'components/pages/SignupFlowPages/SignupPage'
import { NonLoggedInPageGuard } from 'components/helpers/NonLoggedInPageGuard'

export default NonLoggedInPageGuard(SignupPage)
