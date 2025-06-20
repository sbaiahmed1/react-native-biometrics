# Centralized Logging

The React Native Biometrics library includes a comprehensive centralized logging system that helps developers debug issues, monitor performance, and track biometric operations in their applications.

## Features

- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR
- **Contextual Logging**: Each log entry includes context information
- **Configurable Output**: Customize log format, prefix, and visibility
- **Log Storage**: Store logs in memory for analysis
- **Debug Mode Integration**: Automatically enables logging when debug mode is active
- **Performance Optimized**: Minimal overhead when logging is disabled

## Quick Start

### Basic Usage

```typescript
import { enableLogging, setLogLevel, LogLevel, isSensorAvailable } from '@sbaiahmed1/react-native-biometrics';

// Enable logging
enableLogging(true);
setLogLevel(LogLevel.DEBUG);

// All biometric operations will now be logged
const sensorInfo = await isSensorAvailable();
```

### Debug Mode Integration

```typescript
import { setDebugMode } from '@sbaiahmed1/react-native-biometrics';

// Enable debug mode (automatically enables logging)
await setDebugMode(true);

// All operations will be logged with DEBUG level
// Disable debug mode to reduce logging
await setDebugMode(false);
```

## Configuration

### Logger Configuration

```typescript
import { configureLogger, LogLevel } from '@sbaiahmed1/react-native-biometrics';

configureLogger({
  enabled: true,
  level: LogLevel.INFO,
  prefix: '[MyApp-Biometrics]',
  includeTimestamp: true,
  includeContext: true
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable logging |
| `level` | LogLevel | `INFO` | Minimum log level to output |
| `prefix` | string | `[ReactNativeBiometrics]` | Prefix for all log messages |
| `includeTimestamp` | boolean | `true` | Include timestamp in log output |
| `includeContext` | boolean | `true` | Include context information |
| `useColors` | boolean | `true` | Enable colored console output |

## Log Levels

### LogLevel Enum

```typescript
enum LogLevel {
  DEBUG = 0,  // Detailed debugging information
  INFO = 1,   // General information
  WARN = 2,   // Warning conditions
  ERROR = 3,  // Error conditions
  NONE = 4    // Disable all logging
}
```

### Level Descriptions

- **DEBUG**: Detailed information for debugging, including function entry/exit and parameter values
- **INFO**: General operational information about successful operations
- **WARN**: Warning conditions that don't prevent operation but should be noted
- **ERROR**: Error conditions that prevent normal operation
- **NONE**: Completely disable logging

## Log Management

### Retrieving Logs

```typescript
import { getLogs, LogEntry } from '@sbaiahmed1/react-native-biometrics';

// Get all stored logs
const allLogs: LogEntry[] = getLogs();

// Filter logs by level
const errorLogs = allLogs.filter(log => log.level === LogLevel.ERROR);

// Filter logs by context
const authLogs = allLogs.filter(log => log.context === 'authenticateWithOptions');
```

### Clearing Logs

```typescript
import { clearLogs } from '@sbaiahmed1/react-native-biometrics';

// Clear all stored logs
clearLogs();
```

### Log Entry Structure

```typescript
interface LogEntry {
  timestamp: string;    // ISO timestamp
  level: LogLevel;      // Log level
  message: string;      // Log message
  context?: string;     // Function/operation context
  data?: any;          // Additional data
  error?: Error;       // Error object (for error logs)
}
```

## Advanced Usage

### Color Support

The logging system supports colored console output to improve readability:

- **DEBUG**: Gray text for debug information
- **INFO**: Blue text for informational messages  
- **WARN**: Yellow/Orange text for warnings
- **ERROR**: Red text for errors
- **Prefix**: Cyan text for the logger prefix
- **Timestamps/Context**: Dimmed text for metadata

```typescript
// Enable colors (default)
configureLogger({ useColors: true });

// Disable colors for production or unsupported terminals
configureLogger({ useColors: false });

// Colors are automatically disabled in environments that don't support ANSI codes
```

### Custom Log Analysis

```typescript
import { getLogs, LogLevel } from '@sbaiahmed1/react-native-biometrics';

function analyzePerformance() {
  const logs = getLogs();
  
  // Group by operation
  const operationStats = logs.reduce((stats, log) => {
    if (log.context) {
      if (!stats[log.context]) {
        stats[log.context] = { total: 0, errors: 0 };
      }
      stats[log.context].total++;
      if (log.level === LogLevel.ERROR) {
        stats[log.context].errors++;
      }
    }
    return stats;
  }, {} as Record<string, { total: number; errors: number }>);
  
  return operationStats;
}
```

### Production Monitoring

```typescript
import { configureLogger, LogLevel, getLogs } from '@sbaiahmed1/react-native-biometrics';

// Production configuration - only log warnings and errors
configureLogger({
  enabled: true,
  level: LogLevel.WARN,
  prefix: '[BiometricsSDK]',
  includeTimestamp: true,
  includeContext: true,
  useColors: false // Disable colors in production
});

// Monitor for critical issues
function checkForCriticalIssues() {
  const logs = getLogs();
  const recentErrors = logs
    .filter(log => log.level === LogLevel.ERROR)
    .filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return logTime > oneHourAgo;
    });
  
  if (recentErrors.length > 5) {
    // Alert: High error rate detected
    console.warn('High biometric error rate detected:', recentErrors.length);
  }
}
```

## Integration Examples

### React Native Component

```typescript
import React, { useEffect, useState } from 'react';
import { 
  isSensorAvailable, 
  enableLogging, 
  setLogLevel, 
  LogLevel,
  getLogs,
  LogEntry 
} from '@sbaiahmed1/react-native-biometrics';

const BiometricComponent: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    // Enable logging for development
    if (__DEV__) {
      enableLogging(true);
      setLogLevel(LogLevel.DEBUG);
    }
  }, []);
  
  const handleBiometricCheck = async () => {
    try {
      const result = await isSensorAvailable();
      
      // Update logs display
      setLogs(getLogs());
      
      return result;
    } catch (error) {
      // Logs will automatically capture the error
      setLogs(getLogs());
      throw error;
    }
  };
  
  return (
    <View>
      <Button title="Check Biometrics" onPress={handleBiometricCheck} />
      
      {__DEV__ && (
        <ScrollView style={{ maxHeight: 200 }}>
          {logs.map((log, index) => (
            <Text key={index} style={{ fontSize: 10 }}>
              [{LogLevel[log.level]}] {log.message}
            </Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
```

### Error Reporting Integration

```typescript
import { getLogs, LogLevel } from '@sbaiahmed1/react-native-biometrics';
import crashlytics from '@react-native-firebase/crashlytics';

function reportBiometricIssue(error: Error) {
  // Get recent biometric logs
  const logs = getLogs();
  const recentLogs = logs.slice(-10); // Last 10 logs
  
  // Format logs for crash reporting
  const logContext = recentLogs.map(log => 
    `[${LogLevel[log.level]}] ${log.timestamp} ${log.context}: ${log.message}`
  ).join('\n');
  
  // Report to crash analytics with context
  crashlytics().recordError(error);
  crashlytics().setAttributes({
    biometric_logs: logContext,
    error_context: 'biometric_operation'
  });
}
```

## Best Practices

### Development

1. **Enable Debug Logging**: Use `LogLevel.DEBUG` during development
2. **Monitor All Operations**: Enable logging for all biometric operations
3. **Regular Log Review**: Periodically review logs for patterns

```typescript
// Development setup
if (__DEV__) {
  enableLogging(true);
  setLogLevel(LogLevel.DEBUG);
}
```

### Production

1. **Limit Log Levels**: Use `LogLevel.WARN` or `LogLevel.ERROR` only
2. **Monitor Critical Issues**: Set up alerts for error patterns
3. **Regular Cleanup**: Clear logs periodically to manage memory

```typescript
// Production setup
configureLogger({
  enabled: true,
  level: LogLevel.WARN,
  includeTimestamp: true,
  includeContext: true,
  useColors: false // Disable colors in production
});

// Clear logs daily
setInterval(() => {
  clearLogs();
}, 24 * 60 * 60 * 1000);
```

### Performance

1. **Disable When Not Needed**: Turn off logging in production if not required
2. **Use Appropriate Levels**: Higher log levels have less performance impact
3. **Limit Log Storage**: Logs are stored in memory, so clear them regularly

## Troubleshooting

### Common Issues

**Logs Not Appearing**
- Ensure logging is enabled: `enableLogging(true)`
- Check log level: `setLogLevel(LogLevel.DEBUG)`
- Verify console output in your development environment

**Too Many Logs**
- Increase log level: `setLogLevel(LogLevel.INFO)` or higher
- Disable debug mode: `setDebugMode(false)`
- Clear logs regularly: `clearLogs()`

**Performance Issues**
- Reduce log level in production
- Disable logging entirely if not needed
- Clear logs more frequently

### Debug Commands

```typescript
// Check current logger configuration
import { logger } from '@sbaiahmed1/react-native-biometrics';
console.log('Logger config:', logger.getConfig());

// Get log statistics
const logs = getLogs();
console.log('Total logs:', logs.length);
console.log('Error logs:', logs.filter(l => l.level === LogLevel.ERROR).length);
```

## API Reference

### Functions

- `enableLogging(enabled: boolean)`: Enable/disable logging
- `setLogLevel(level: LogLevel)`: Set minimum log level
- `configureLogger(config: Partial<LoggerConfig>)`: Configure logger settings
- `getLogs(): LogEntry[]`: Get all stored logs
- `clearLogs(): void`: Clear all stored logs

### Types

- `LogLevel`: Enumeration of log levels
- `LogEntry`: Structure of a log entry
- `LoggerConfig`: Logger configuration interface

### Logger Instance

```typescript
import { logger } from '@sbaiahmed1/react-native-biometrics';

// Direct logger methods
logger.debug('Debug message', 'context', data);
logger.info('Info message', 'context', data);
logger.warn('Warning message', 'context', data);
logger.error('Error message', 'context', error, data);
```