/**
 * Structured logging utility for consistent, production-ready logs
 * Outputs JSON format for easy parsing in log management tools
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type LogData = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Formats a log entry as JSON string
 */
function formatLogEntry(level: LogLevel, message: string, data?: LogData): string {
  const logEntry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { ...data }),
  };
  return JSON.stringify(logEntry);
}

/**
 * Structured logger with info, warn, error, and debug levels
 */
export const logger = {
  /**
   * Log informational messages
   * @param message - The log message
   * @param data - Optional contextual data
   */
  info: (message: string, data?: LogData): void => {
    console.log(formatLogEntry('info', message, data));
  },

  /**
   * Log warning messages
   * @param message - The warning message
   * @param data - Optional contextual data
   */
  warn: (message: string, data?: LogData): void => {
    console.warn(formatLogEntry('warn', message, data));
  },

  /**
   * Log error messages with optional error object
   * @param message - The error message
   * @param error - Optional Error object to include stack trace
   * @param data - Optional contextual data
   */
  error: (message: string, error?: Error | unknown, data?: LogData): void => {
    const errorData: LogData = { ...data };

    if (error instanceof Error) {
      errorData.errorMessage = error.message;
      errorData.errorStack = error.stack;
    } else if (error) {
      errorData.error = String(error);
    }

    console.error(formatLogEntry('error', message, errorData));
  },

  /**
   * Log debug messages (only logs if DEBUG environment variable is set)
   * @param message - The debug message
   * @param data - Optional contextual data
   */
  debug: (message: string, data?: LogData): void => {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.debug(formatLogEntry('debug', message, data));
    }
  },
};
