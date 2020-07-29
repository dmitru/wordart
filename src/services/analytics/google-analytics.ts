declare global {
  interface Window {
    ga: any
  }
}

const metrics: { [key: string]: number } = {}

const isEnabled = () =>
  typeof window !== 'undefined' && typeof window.ga !== 'undefined'

export const trackPageView = ({
  location,
  userId,
}: {
  location: Location
  userId: string
}) => {
  if (isEnabled()) {
    Object.keys(metrics).forEach((metricKey) => {
      window.ga('set', metricKey, metrics[metricKey])
    })
    window.ga('set', 'page', location.pathname + location.search)
    window.ga('send', 'pageview', location.pathname + location.search, {
      userId: userId || undefined,
    })
  }
}

export const trackTiming = (
  timingCategory: string,
  timingVar: string,
  timingValue: number
) =>
  isEnabled() &&
  window.ga('send', 'timing', timingCategory, timingVar, timingValue)

export const trackStructured = (
  category: string,
  action?: string,
  label?: string,
  value?: number
) => {
  if (!isEnabled()) {
    return
  }

  Object.keys(metrics).forEach((metricKey) => {
    window.ga('set', metricKey, metrics[metricKey])
  })
  window.ga('send', 'event', category, action, label, value)
}

// https://developers.google.com/analytics/devguides/collection/analyticsjs/custom-dims-mets
export const setMetric = (metricIndex: number, value: number) => {
  metrics[`metric${metricIndex}`] = value
}

export const setDimension = (dimensionIndex: number, value: string) => {
  isEnabled() && window.ga('set', `dimension${dimensionIndex}`, value)
}
