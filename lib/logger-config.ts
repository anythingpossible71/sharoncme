/**
 * Logger Configuration
 * Centralized configuration for application logging
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "json" | "pretty";

export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  sanitizePii: boolean;
  includeStackTrace: boolean;
  useLocalTime: boolean;
  cyclicLog: boolean;
}

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Get the current log level from environment
 */
export function getLogLevel(): LogLevel {
  const level = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
  return LOG_LEVELS[level] !== undefined ? level : "info";
}

/**
 * Get the log format from environment
 */
export function getLogFormat(): LogFormat {
  const format = (process.env.LOG_FORMAT || "").toLowerCase() as LogFormat;

  // Default to pretty in development, json in production
  if (format === "json" || format === "pretty") {
    return format;
  }

  return process.env.NODE_ENV === "production" ? "json" : "pretty";
}

/**
 * Check if PII sanitization is enabled
 */
export function getSanitizePii(): boolean {
  const sanitize = process.env.LOG_SANITIZE_PII;

  // Default to true in production, false in development
  if (sanitize === "true" || sanitize === "false") {
    return sanitize === "true";
  }

  return process.env.NODE_ENV === "production";
}

/**
 * Check if a log level should be output based on current config
 */
export function shouldLog(level: LogLevel, configLevel: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[configLevel];
}

/**
 * Check if local time should be used for timestamps
 */
export function getUseLocalTime(): boolean {
  const useLocalTime = process.env.LOG_USE_LOCALTIME;

  // Default to false (UTC)
  if (useLocalTime === "true" || useLocalTime === "false") {
    return useLocalTime === "true";
  }

  return false;
}

/**
 * Check if cyclic file logging is enabled
 */
export function getCyclicLog(): boolean {
  const cyclicLog = process.env.CYCLIC_LOG;

  // Default to false (disabled)
  if (cyclicLog === "true" || cyclicLog === "false") {
    return cyclicLog === "true";
  }

  return false;
}

/**
 * Get the current logger configuration
 */
export function getLoggerConfig(): LoggerConfig {
  return {
    level: getLogLevel(),
    format: getLogFormat(),
    sanitizePii: getSanitizePii(),
    includeStackTrace: process.env.NODE_ENV === "development",
    useLocalTime: getUseLocalTime(),
    cyclicLog: getCyclicLog(),
  };
}
