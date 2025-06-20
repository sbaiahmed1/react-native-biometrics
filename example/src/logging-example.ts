/**
 * Example demonstrating how to use the centralized logging system
 * in React Native Biometrics
 */

import {
  isSensorAvailable,
  simplePrompt,
  authenticateWithOptions,
  createKeys,
  setDebugMode,
  enableLogging,
  setLogLevel,
  configureLogger,
  getLogs,
  clearLogs,
  LogLevel,
} from '@sbaiahmed1/react-native-biometrics';
import type { LoggerConfig } from '@sbaiahmed1/react-native-biometrics';

// Example 1: Basic logging setup
export async function basicLoggingExample() {
  console.log('=== Basic Logging Example ===');

  // Enable logging
  enableLogging(true);
  setLogLevel(LogLevel.DEBUG);

  try {
    // Check sensor availability (will be logged)
    const sensorInfo = await isSensorAvailable();
    console.log('Sensor available:', sensorInfo.available);

    // Show logs
    const logs = getLogs();
    console.log('Current logs:', logs.length);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 2: Advanced logging configuration
export async function advancedLoggingExample() {
  console.log('=== Advanced Logging Example ===');

  // Configure logger with custom settings
  const loggerConfig: Partial<LoggerConfig> = {
    enabled: true,
    level: LogLevel.INFO,
    prefix: '[MyApp-Biometrics]',
    includeTimestamp: true,
    includeContext: true,
    useColors: true, // Enable colored output
  };

  configureLogger(loggerConfig);

  try {
    // Perform biometric operations
    await isSensorAvailable();

    // Create keys (will be logged with custom prefix)
    await createKeys('my-app-key');

    // Get logs filtered by context
    const logs = getLogs();
    const keyLogs = logs.filter((log) => log.context === 'createKeys');

    console.log('Key creation logs:', keyLogs.length);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 3: Debug mode integration
export async function debugModeExample() {
  console.log('=== Debug Mode Example ===');

  try {
    // Enable debug mode (automatically enables logging)
    await setDebugMode(true);

    // Perform authentication
    const authResult = await authenticateWithOptions({
      title: 'Authenticate',
      subtitle: 'Use your biometric to authenticate',
      description: 'Place your finger on the sensor',
    });

    console.log('Authentication result:', authResult.success);

    // Get all logs
    const logs = getLogs();
    console.log('Debug logs count:', logs.length);

    // Filter logs by level
    const debugLogs = logs.filter((log) => log.level === LogLevel.DEBUG);
    const errorLogs = logs.filter((log) => log.level === LogLevel.ERROR);

    console.log('Debug level logs:', debugLogs.length);
    console.log('Error level logs:', errorLogs.length);

    // Disable debug mode
    await setDebugMode(false);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 4: Log analysis and monitoring
export async function logAnalysisExample() {
  console.log('=== Log Analysis Example ===');

  enableLogging(true);
  setLogLevel(LogLevel.DEBUG);

  try {
    // Clear previous logs
    clearLogs();

    // Perform multiple operations
    await isSensorAvailable();
    await createKeys('test-key-1');
    await createKeys('test-key-2');

    // Simulate an error
    try {
      await simplePrompt(''); // This might fail
    } catch (error) {
      // Expected error
    }

    // Analyze logs
    const allLogs = getLogs();

    // Group logs by level
    const logsByLevel = {
      debug: allLogs.filter((log) => log.level === LogLevel.DEBUG),
      info: allLogs.filter((log) => log.level === LogLevel.INFO),
      warn: allLogs.filter((log) => log.level === LogLevel.WARN),
      error: allLogs.filter((log) => log.level === LogLevel.ERROR),
    };

    console.log('Log Analysis:');
    console.log('- Debug logs:', logsByLevel.debug.length);
    console.log('- Info logs:', logsByLevel.info.length);
    console.log('- Warning logs:', logsByLevel.warn.length);
    console.log('- Error logs:', logsByLevel.error.length);

    // Group logs by context
    const logsByContext = allLogs.reduce(
      (acc, log) => {
        const context = log.context || 'unknown';
        if (!acc[context]) acc[context] = [];
        acc[context].push(log);
        return acc;
      },
      {} as Record<string, typeof allLogs>
    );

    console.log('\nLogs by context:');
    Object.entries(logsByContext).forEach(([context, logs]) => {
      console.log(`- ${context}: ${logs.length} logs`);
    });

    // Show recent errors
    const recentErrors = logsByLevel.error.slice(-5);
    if (recentErrors.length > 0) {
      console.log('\nRecent errors:');
      recentErrors.forEach((log, index) => {
        console.log(`${index + 1}. [${log.timestamp}] ${log.message}`);
        if (log.error) {
          console.log(`   Error: ${log.error.message}`);
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 5: Production logging setup
export function productionLoggingSetup() {
  console.log('=== Production Logging Setup ===');

  // Configure for production use
  const productionConfig: Partial<LoggerConfig> = {
    enabled: true,
    level: LogLevel.WARN, // Only log warnings and errors in production
    prefix: '[BiometricsSDK]',
    includeTimestamp: true,
    includeContext: true,
    useColors: false, // Disable colors in production
  };

  configureLogger(productionConfig);

  console.log('Production logging configured');
  console.log('- Only warnings and errors will be logged');
  console.log('- Debug and info logs are disabled for performance');
}

// Example 6: Custom log monitoring
export class BiometricLogMonitor {
  private errorThreshold = 5;
  private warningThreshold = 10;

  checkLogHealth(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const logs = getLogs();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check error rate
    const errorLogs = logs.filter((log) => log.level === LogLevel.ERROR);
    if (errorLogs.length > this.errorThreshold) {
      issues.push(`High error count: ${errorLogs.length} errors`);
      recommendations.push('Review error logs and fix underlying issues');
    }

    // Check warning rate
    const warningLogs = logs.filter((log) => log.level === LogLevel.WARN);
    if (warningLogs.length > this.warningThreshold) {
      issues.push(`High warning count: ${warningLogs.length} warnings`);
      recommendations.push('Investigate warning conditions');
    }

    // Check for repeated errors
    const errorMessages = errorLogs.map((log) => log.message);
    const repeatedErrors = errorMessages.filter(
      (msg, index) => errorMessages.indexOf(msg) !== index
    );

    if (repeatedErrors.length > 0) {
      issues.push('Repeated error patterns detected');
      recommendations.push('Fix recurring issues to improve stability');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    };
  }

  generateReport(): string {
    const logs = getLogs();
    const health = this.checkLogHealth();

    const report = [
      '=== Biometric Logging Report ===',
      `Total logs: ${logs.length}`,
      `Health status: ${health.healthy ? 'HEALTHY' : 'ISSUES DETECTED'}`,
      '',
      'Log distribution:',
    ];

    // Add log level distribution
    Object.values(LogLevel)
      .filter((level) => typeof level === 'number')
      .forEach((level) => {
        const count = logs.filter((log) => log.level === level).length;
        const levelName = LogLevel[level as number];
        report.push(`- ${levelName}: ${count}`);
      });

    if (!health.healthy) {
      report.push('', 'Issues:');
      health.issues.forEach((issue) => report.push(`- ${issue}`));

      report.push('', 'Recommendations:');
      health.recommendations.forEach((rec) => report.push(`- ${rec}`));
    }

    return report.join('\n');
  }
}

// Export all examples for easy testing
export const examples = {
  basicLoggingExample,
  advancedLoggingExample,
  debugModeExample,
  logAnalysisExample,
  productionLoggingSetup,
  BiometricLogMonitor,
};
