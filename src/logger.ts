/**
 * Centralized logging utility for React Native Biometrics
 * Provides structured logging with different levels and optional debug mode
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
  includeTimestamp: boolean;
  includeContext: boolean;
  useColors: boolean;
}

class BiometricLogger {
  private config: LoggerConfig = {
    enabled: false,
    level: LogLevel.INFO,
    prefix: '[ReactNativeBiometrics]',
    includeTimestamp: true,
    includeContext: true,
    useColors: true,
  };

  private logs: LogEntry[] = [];
  private maxLogEntries = 100;

  /**
   * Configure the logger settings
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): void {
    if (!this.config.enabled || level < this.config.level) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      data,
      error,
    };

    // Store log entry
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift();
    }

    // Format and output to console
    this.outputToConsole(logEntry);
  }

  /**
   * ANSI color codes for console output
   */
  private colors = {
    reset: '\x1b[0m',
    gray: '\x1b[90m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
  };

  /**
   * Get color for log level
   */
  private getColorForLevel(level: LogLevel): string {
    if (!this.config.useColors) {
      return '';
    }

    switch (level) {
      case LogLevel.DEBUG:
        return this.colors.gray;
      case LogLevel.INFO:
        return this.colors.blue;
      case LogLevel.WARN:
        return this.colors.yellow;
      case LogLevel.ERROR:
        return this.colors.red;
      default:
        return '';
    }
  }

  /**
   * Apply color formatting to text
   */
  private colorize(text: string, color: string): string {
    if (!this.config.useColors || !color) {
      return text;
    }
    return `${color}${text}${this.colors.reset}`;
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const parts: string[] = [];
    const levelColor = this.getColorForLevel(entry.level);

    // Add prefix with cyan color
    parts.push(this.colorize(this.config.prefix, this.colors.cyan));

    // Add timestamp with dim color
    if (this.config.includeTimestamp) {
      const timestamp = `[${entry.timestamp}]`;
      parts.push(this.colorize(timestamp, this.colors.dim));
    }

    // Add level with appropriate color
    const levelText = `[${LogLevel[entry.level]}]`;
    parts.push(this.colorize(levelText, levelColor));

    // Add context with dim color
    if (this.config.includeContext && entry.context) {
      const contextText = `[${entry.context}]`;
      parts.push(this.colorize(contextText, this.colors.dim));
    }

    // Add message with level color
    parts.push(this.colorize(entry.message, levelColor));

    const logMessage = parts.join(' ');

    // Output based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, entry.data, entry.error);
        break;
    }
  }

  /**
   * Get all stored log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get logs filtered by context
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter((log) => log.context === context);
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get current logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = new BiometricLogger();

// Export convenience functions
export const enableLogging = (enabled: boolean = true) =>
  logger.setEnabled(enabled);
export const setLogLevel = (level: LogLevel) => logger.setLevel(level);
export const configureLogger = (config: Partial<LoggerConfig>) =>
  logger.configure(config);

// Export default logger instance
export default logger;
