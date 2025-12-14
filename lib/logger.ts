/**
 * Centralized Logger Utility
 * Provides structured logging with timestamps, severity levels, and context
 * Compatible with both server and client environments
 */

import { getLoggerConfig, shouldLog, type LogLevel } from "./logger-config";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
  requestId?: string;
}

/**
 * Patterns for PII data that should be sanitized
 */
const PII_PATTERNS = [
  { pattern: /password/i, replacement: "[REDACTED_PASSWORD]" },
  { pattern: /token/i, replacement: "[REDACTED_TOKEN]" },
  { pattern: /secret/i, replacement: "[REDACTED_SECRET]" },
  { pattern: /api[_-]?key/i, replacement: "[REDACTED_API_KEY]" },
  { pattern: /auth/i, replacement: "[REDACTED_AUTH]" },
];

/**
 * ANSI color codes for pretty printing
 */
const COLORS = {
  reset: "\x1b[0m",
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m", // Green
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  timestamp: "\x1b[90m", // Gray
  context: "\x1b[35m", // Magenta
};

// Check if we're running on the server (Node.js environment)
const isServer = typeof window === "undefined";

// Constants for cyclic logging (server-only)
const MAX_LOG_LINES = 10000;

class Logger {
  private config = getLoggerConfig();
  private logLineCount = 0;
  private isInitialized = false;

  /**
   * Sanitize PII data from objects
   */
  private sanitize(data: unknown): unknown {
    if (!this.config.sanitizePii) {
      return data;
    }

    if (typeof data === "string") {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (data && typeof data === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        // Check if key matches PII pattern
        const isPii = PII_PATTERNS.some((p) => p.pattern.test(key));
        if (isPii) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Sanitize PII from strings
   */
  private sanitizeString(str: string): string {
    if (!this.config.sanitizePii) {
      return str;
    }

    // Simple email detection and redaction
    return str.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, "[REDACTED_EMAIL]");
  }

  /**
   * Format log entry as JSON
   */
  private formatJson(entry: LogEntry): string {
    return JSON.stringify(this.sanitize(entry));
  }

  /**
   * Format log entry as pretty-printed text
   */
  private formatPretty(entry: LogEntry): string {
    const { timestamp, level, message, context, stack } = entry;
    const color = COLORS[level] || COLORS.reset;
    const levelStr = level.toUpperCase().padEnd(5);

    let output = `${COLORS.timestamp}${timestamp}${COLORS.reset} ${color}${levelStr}${COLORS.reset} ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += `\n${COLORS.context}Context:${COLORS.reset} ${JSON.stringify(
        this.sanitize(context),
        null,
        2
      )}`;
    }

    if (stack && this.config.includeStackTrace) {
      output += `\n${COLORS.error}Stack:${COLORS.reset}\n${stack}`;
    }

    return output;
  }

  /**
   * Initialize cyclic log file (server-only)
   */
  private initializeCyclicLog(): void {
    // Skip if not on server, already initialized, or cyclic log disabled
    if (!isServer || this.isInitialized || !this.config.cyclicLog) {
      return;
    }

    try {
      // Dynamic import of Node.js modules (server-only)

      const fs = require("fs");

      const path = require("path");

      const CYCLIC_LOG_FILE = path.join(process.cwd(), "app.log");

      // Count existing lines in log file
      if (fs.existsSync(CYCLIC_LOG_FILE)) {
        const content = fs.readFileSync(CYCLIC_LOG_FILE, "utf-8");
        this.logLineCount = content.split("\n").filter((line: string) => line.trim()).length;
      } else {
        this.logLineCount = 0;
      }

      this.isInitialized = true;
    } catch (error) {
      // Silently fail initialization, cyclic log will be disabled
      // Only log on server to avoid client-side errors
      if (isServer) {
        console.error("Failed to initialize cyclic log:", error);
      }
    }
  }

  /**
   * Write to cyclic log file (server-only)
   */
  private writeToCyclicLog(formatted: string): void {
    // Skip if not on server or cyclic log disabled
    if (!isServer || !this.config.cyclicLog) {
      return;
    }

    try {
      this.initializeCyclicLog();

      // Dynamic import of Node.js modules (server-only)

      const fs = require("fs");

      const path = require("path");

      const CYCLIC_LOG_FILE = path.join(process.cwd(), "app.log");

      // If we've reached the max lines, reset the file
      if (this.logLineCount >= MAX_LOG_LINES) {
        fs.writeFileSync(CYCLIC_LOG_FILE, formatted + "\n", "utf-8");
        this.logLineCount = 1;
      } else {
        // Append to existing file
        fs.appendFileSync(CYCLIC_LOG_FILE, formatted + "\n", "utf-8");
        this.logLineCount++;
      }
    } catch (error) {
      // Silently fail file writing, don't interrupt console logging
      // Only log on server to avoid client-side errors
      if (isServer) {
        console.error("Failed to write to cyclic log:", error);
      }
    }
  }

  /**
   * Write log entry to output
   */
  private write(entry: LogEntry): void {
    const formatted =
      this.config.format === "json" ? this.formatJson(entry) : this.formatPretty(entry);

    // Write to console
    switch (entry.level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "debug":
      case "info":
      default:
        console.log(formatted);
        break;
    }

    // Write to cyclic log file if enabled
    this.writeToCyclicLog(formatted);
  }

  /**
   * Format timestamp based on configuration
   */
  private formatTimestamp(): string {
    const now = new Date();

    if (this.config.useLocalTime) {
      // Format in local time with timezone
      return now
        .toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
          hour12: false,
        })
        .replace(/(\d+)\/(\d+)\/(\d+),\s(\d+:\d+:\d+\.\d+)/, "$3-$1-$2T$4");
    }

    // Default: UTC ISO 8601
    return now.toISOString();
  }

  /**
   * Create a log entry
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Check if this log level should be output
    if (!shouldLog(level, this.config.level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message: this.sanitizeString(message),
      context: context ? (this.sanitize(context) as LogContext) : undefined,
    };

    // Add stack trace for errors
    if (error && error.stack) {
      entry.stack = error.stack;
    }

    this.write(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log("error", message, context, error);
  }

  /**
   * Create a child logger with persistent context
   */
  child(persistentContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);

    // Override log method to merge persistent context
    childLogger.log = (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
      const mergedContext = { ...persistentContext, ...context };
      originalLog(level, message, mergedContext, error);
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogContext };
