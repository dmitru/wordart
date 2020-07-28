import { Notifier } from '@airbrake/browser'
import { config } from 'config'

const airbrake = new Notifier(config.airbrake)

class ErrorTracker {
  trackError = (error: Error) => {
    airbrake.notify(error)
  }
}

export const errorTracker = new ErrorTracker()
