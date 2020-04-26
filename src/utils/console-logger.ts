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
  const editor = createConsoleLogger('editor')
  const generator = createConsoleLogger('generator')

  return {
    editor,
    generator,
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
  consoleLoggers.editor.enable('debug')
  consoleLoggers.generator.enable('debug')
  return consoleLoggers
}

export const consoleLoggers = initConsoleLoggers()
