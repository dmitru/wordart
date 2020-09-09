import loglevel, { LogLevelDesc } from 'loglevel'
import { $Keys } from 'utility-types'

export type LogLevel = loglevel.LogLevelDesc

export type ConsoleLoggerKey = $Keys<ReturnType<typeof createConsoleLoggers>>

export interface ConsoleLogger extends loglevel.Logger {
  enable: (loglevel: LogLevel) => void
  disable: () => void
  enabled: () => boolean
}

const createConsoleLoggers = () => {
  const editorStore = createConsoleLogger('editorStore')
  const editor = createConsoleLogger('editor')
  const authStore = createConsoleLogger('auth-store')
  const generator = createConsoleLogger('generator')
  const analytics = createConsoleLogger('analytics')
  const timings = createConsoleLogger('timings')

  authStore.enable('info')
  timings.enable('info')
  analytics.enable('info')
  generator.enable('info')
  editorStore.enable('info')
  editor.enable('info')
  // authStore.enable('debug')
  // generator.enable('info')
  // analytics.enable('debug')
  // timings.enable('debug')

  return {
    authStore,
    editorStore,
    editor,
    generator,
    analytics,
    timings,
  }
}

const createConsoleLogger = (
  name: string,
  defaultLevel: LogLevelDesc = 'silent'
): ConsoleLogger => {
  const logger = loglevel.getLogger(name)
  const consoleLogger = logger as ConsoleLogger

  consoleLogger.setLevel(defaultLevel)
  consoleLogger.enabled = () =>
    consoleLogger.getLevel() !== loglevel.levels.SILENT
  consoleLogger.enable = (logLevel = 'info') => {
    consoleLogger.setLevel(logLevel)
  }
  consoleLogger.disable = () => {
    consoleLogger.setLevel(loglevel.levels.SILENT)
  }

  return consoleLogger as ConsoleLogger
}

const initConsoleLoggers = () => {
  const consoleLoggers = createConsoleLoggers()
  // consoleLoggers.editor.enable('debug')
  // consoleLoggers.editorStore.enable('debug')
  // consoleLoggers.generator.enable('debug')
  return consoleLoggers
}

export const consoleLoggers = initConsoleLoggers()
