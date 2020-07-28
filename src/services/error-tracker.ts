import * as Sentry from '@sentry/react'
// @ts-ignore
import { RewriteFrames } from '@sentry/integrations'
import { config } from 'config'
import { uuid } from 'utils/uuid'

if (config.sentry.enabled) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    release: config.release.hash,
    maxBreadcrumbs: 300,
    beforeBreadcrumb(breadcrumb, hint) {
      if (breadcrumb.category === 'ui.click') {
        const target = hint ? (hint.event.target as Element) : undefined
        if (target) {
          let currentElement: Element | undefined = target
          let cutoffCount = 0
          while (
            cutoffCount < 10 &&
            currentElement &&
            currentElement !== document.body &&
            !currentElement.id
          ) {
            currentElement = currentElement.parentElement || undefined
            cutoffCount += 1
          }
          if (currentElement && currentElement.id) {
            breadcrumb.message = `#${currentElement.id}`
          }
        }
      }
      return breadcrumb
    },
    integrations:
      typeof window === 'undefined'
        ? []
        : [
            // @ts-ignore
            new RewriteFrames({
              // @ts-ignore
              iteratee: (frame) => {
                if (typeof frame.filename !== 'undefined') {
                  frame.filename = frame.filename
                    .replace('%5D', ']')
                    .replace('%5B', '[')
                }
                return frame
              },
            }),
          ],
  })

  Sentry.configureScope((scope) => {
    // Generate a unique ID for the current "user session" (i.e. before the page reloads)
    // and set it as a Sentry tag.
    // Hopefully it'll make it easier to group & debug errors on Sentry
    scope.setTag('session_id', uuid())
    scope.setTag('app_hash', config.release.hash)
    scope.setTag('app_version', config.release.version)
    if (typeof navigator !== 'undefined') {
      // @ts-ignore
      scope.setTag('hw_memory', navigator['deviceMemory'] || '-')
      // @ts-ignore
      scope.setTag('hw_concurrency', `${navigator.hardwareConcurrency || '-'}`)
    }
    if (typeof window !== 'undefined') {
      scope.setTag('hw_px_ratio', `${window.devicePixelRatio || '-'}`)
    }
  })
}
