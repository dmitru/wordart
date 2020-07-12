import { SignupCompletedVerifyEmailPage } from 'components/pages/SignupFlowPages/SignupCompletedVerifyEmailPage'
import { NonLoggedInPageGuard } from 'components/helpers/NonLoggedInPageGuard'
import { LoggedInAndVerifiedPageGuard } from 'components/helpers/LoggedInAndVerifiedPageGuard'

export default LoggedInAndVerifiedPageGuard(SignupCompletedVerifyEmailPage)
