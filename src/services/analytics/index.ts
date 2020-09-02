import { reject } from 'lodash'
import { consoleLoggers } from 'utils/console-logger'
import { StructuredEvent } from './events'
import * as googleAnalytics from './google-analytics'

export { StructuredEvents } from './events'

type UserId = string

export type TimingEvent =
  | 'editor-interactive-complete'
  | 'design-saving-complete'
  | 'design-fetching-complete'
  | 'visualization-shape-complete'
  | 'visualization-bg-complete'
  | 'editor-undo-complete'

type CompletionEvent = { category: string; name: string }

const completionEvents: { [event in TimingEvent]?: CompletionEvent[] } = {}

let userId: UserId | 'anonymous'

const setUserId = (uid: UserId | 'anonymous') => {
  const logger = consoleLoggers.analytics
  logger.info('setUserId', uid)
  userId = uid
}

const trackPageView = () => {
  const logger = consoleLoggers.analytics
  logger.info('trackPageView', window.location)
  googleAnalytics.trackPageView({ location: window.location, userId })
}

const trackStructured = (analyticsEvent: StructuredEvent) => {
  const { category, action, label, property, value } = analyticsEvent
  const logger = consoleLoggers.analytics
  logger.info(
    'trackStructured',
    [category, action, label, property, value]
      .filter((x) => x != null)
      .join(' ')
  )
  googleAnalytics.trackStructured(category, action, label, value)
}

const setMetric = (metricIndex: number, value: number) => {
  const logger = consoleLoggers.analytics
  logger.info('setMetric', metricIndex, value)
  googleAnalytics.setMetric(metricIndex, value)
}

const setDimension = (dimensionIndex: number, value: string) => {
  const logger = consoleLoggers.analytics
  logger.info('setDimension', dimensionIndex, value)
  googleAnalytics.setDimension(dimensionIndex, value)
}

// Start tracking a measurement, which will be recorded once `completeMeasurements` has been
// called with the `completionEvent` specified here.
const startTiming = (category: string, name: string, event: TimingEvent) => {
  const logger = consoleLoggers.analytics
  logger.debug('startTiming', category, name, event)

  const markName = `${category}:${name}:start`
  window.performance.clearMarks(markName)
  window.performance.mark(markName)

  let newCompletionEvents = completionEvents[event] || []

  // Remove prior duplicate measurements
  newCompletionEvents = reject(
    newCompletionEvents,
    (measure) => category === measure.category && name === measure.name
  )
  newCompletionEvents.push({ category, name })

  completionEvents[event] = newCompletionEvents
}

const startOrContinueTiming = (
  category: string,
  name: string,
  event: TimingEvent
) => {
  const logger = consoleLoggers.analytics
  logger.debug('startOrContinueTiming', category, name, event)
  if (completionEvents[event]) {
    return
  }
  startTiming(category, name, event)
}

const endTiming = (completionEvent: TimingEvent) => {
  const analyticsLogger = consoleLoggers.analytics
  analyticsLogger.debug('endTiming', completionEvent)

  const measurements = completionEvents[completionEvent]
  // Nothing to do if no measurements are being tracked for this event
  if (!measurements) {
    return
  }

  const timingsLogger = consoleLoggers.timings

  measurements.forEach(({ category, name }) => {
    const measurementName = `${category}:${name}`
    window.performance.measure(measurementName, `${measurementName}:start`)
    const measure = window.performance.getEntriesByName(measurementName)[0]
    if (!measure) {
      return
    }

    const duration = Math.round(measure.duration)

    googleAnalytics.trackTiming(category, name, duration)

    timingsLogger.info(`${category} / ${name}, ${duration / 1000}s`)
    window.performance.clearMeasures(measurementName)
    window.performance.clearMarks(`${measurementName}:start`)
  })

  window.performance.clearMarks(completionEvent)
  delete completionEvents[completionEvent]
}

export const analytics = {
  setUserId,
  trackPageView,
  startTiming,
  startOrContinueTiming,
  endTiming,
  trackStructured,
  setMetric,
  setDimension,
}

export type Analytics = typeof analytics
