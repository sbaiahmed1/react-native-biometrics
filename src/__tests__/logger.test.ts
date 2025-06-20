/**
 * Tests for the centralized logging system
 */

import {
  logger,
  LogLevel,
  enableLogging,
  setLogLevel,
  configureLogger,
} from '../logger';

describe('Centralized Logging', () => {
  beforeEach(() => {
    // Reset logger state before each test
    logger.clearLogs();
    logger.configure({
      enabled: true,
      level: LogLevel.DEBUG,
      prefix: '[ReactNativeBiometrics]',
      includeTimestamp: true,
      includeContext: true,
    });
  });

  afterEach(() => {
    // Clean up after each test
    logger.clearLogs();
  });

  describe('Basic Logging', () => {
    it('should log debug messages', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      logger.debug('Test debug message', 'testContext', { test: 'data' });

      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]!.level).toBe(LogLevel.DEBUG);
      expect(logs[0]!.message).toBe('Test debug message');
      expect(logs[0]!.context).toBe('testContext');

      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      logger.info('Test info message', 'testContext');

      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]!.level).toBe(LogLevel.INFO);

      consoleSpy.mockRestore();
    });

    it('should log warning messages', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      logger.warn('Test warning message');

      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]!.level).toBe(LogLevel.WARN);

      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Test error');

      logger.error('Test error message', 'testContext', testError);

      expect(consoleSpy).toHaveBeenCalled();
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]!.level).toBe(LogLevel.ERROR);
      expect(logs[0]!.error).toBe(testError);

      consoleSpy.mockRestore();
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect minimum log level', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();

      logger.setLevel(LogLevel.INFO);

      logger.debug('Debug message'); // Should not be logged
      logger.info('Info message'); // Should be logged

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]!.level).toBe(LogLevel.INFO);

      debugSpy.mockRestore();
      infoSpy.mockRestore();
    });

    it('should not log when disabled', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      logger.setEnabled(false);
      logger.info('Test message');

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(logger.getLogs()).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Log Management', () => {
    it('should store and retrieve logs', () => {
      logger.info('Message 1');
      logger.warn('Message 2');
      logger.error('Message 3');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0]!.message).toBe('Message 1');
      expect(logs[1]!.message).toBe('Message 2');
      expect(logs[2]!.message).toBe('Message 3');
    });

    it('should filter logs by level', () => {
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0]!.message).toBe('Error message');
    });

    it('should filter logs by context', () => {
      logger.info('Message 1', 'context1');
      logger.info('Message 2', 'context2');
      logger.info('Message 3', 'context1');

      const context1Logs = logger.getLogsByContext('context1');
      expect(context1Logs).toHaveLength(2);
      expect(context1Logs[0]!.message).toBe('Message 1');
      expect(context1Logs[1]!.message).toBe('Message 3');
    });

    it('should clear logs', () => {
      logger.info('Message 1');
      logger.info('Message 2');

      expect(logger.getLogs()).toHaveLength(2);

      logger.clearLogs();

      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        enabled: false,
        level: LogLevel.ERROR,
        prefix: '[TestPrefix]',
        includeTimestamp: false,
        includeContext: false,
        useColors: false,
      };

      logger.configure(newConfig);
      const config = logger.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.prefix).toBe('[TestPrefix]');
      expect(config.includeTimestamp).toBe(false);
      expect(config.includeContext).toBe(false);
      expect(config.useColors).toBe(false);
    });
  });

  describe('Convenience Functions', () => {
    it('should enable/disable logging', () => {
      enableLogging(false);
      expect(logger.getConfig().enabled).toBe(false);

      enableLogging(true);
      expect(logger.getConfig().enabled).toBe(true);
    });

    it('should set log level', () => {
      setLogLevel(LogLevel.WARN);
      expect(logger.getConfig().level).toBe(LogLevel.WARN);
    });

    it('should configure logger', () => {
      configureLogger({
        prefix: '[CustomPrefix]',
        level: LogLevel.ERROR,
        useColors: false,
      });

      const config = logger.getConfig();
      expect(config.prefix).toBe('[CustomPrefix]');
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.useColors).toBe(false);
    });
  });

  describe('Log Entry Structure', () => {
    it('should create proper log entries', () => {
      const testData = { key: 'value' };
      const testError = new Error('Test error');

      logger.error('Test message', 'testContext', testError, testData);

      const logs = logger.getLogs();
      const logEntry = logs[0]!;

      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.level).toBe(LogLevel.ERROR);
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.context).toBe('testContext');
      expect(logEntry.data).toBe(testData);
      expect(logEntry.error).toBe(testError);

      // Validate timestamp format (ISO string)
      expect(new Date(logEntry.timestamp).toISOString()).toBe(
        logEntry.timestamp
      );
    });
  });

  describe('Color Support', () => {
    it('should support enabling and disabling colors', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      // Test with colors enabled (default)
      logger.configure({ useColors: true });
      logger.info('Colored message');

      // Test with colors disabled
      logger.configure({ useColors: false });
      logger.info('Non-colored message');

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(logger.getConfig().useColors).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should use different colors for different log levels', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      const infoSpy = jest.spyOn(console, 'info').mockImplementation();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      logger.configure({ useColors: true, level: LogLevel.DEBUG });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(debugSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
