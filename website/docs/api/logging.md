---
title: Logging & Monitoring
sidebar_label: Logging
---

The library includes a comprehensive centralized logging system for debugging and monitoring biometric operations.

## `enableLogging()`

Enables or disables the centralized logging system.

```typescript
const enableLogging = (enabled: boolean): void => {
};
```

## `setLogLevel()`

Sets the minimum log level for output.

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const setLogLevel = (level: LogLevel): void => {
};
```

## `configureLogger()`

Configures the logger with advanced options.

```typescript
type LoggerConfig = {
  enabled: boolean;
  level: LogLevel;
  useColors: boolean;
  prefix: string;
  includeTimestamp: boolean;
  includeContext: boolean;
  maxStoredLogs: number;
};

const configureLogger = (config: Partial<LoggerConfig>): void => {
};
```

## `getLogs()`

Retrieves stored log entries for analysis.

```typescript
type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
};

const getLogs = (): LogEntry[] => {
};
```

## `clearLogs()`

Clears all stored log entries.

```typescript
const clearLogs = (): void => {
};
```

## Example Usage

```typescript
import {
  enableLogging,
  setLogLevel,
  LogLevel,
  configureLogger,
  getLogs,
  isSensorAvailable
} from '@sbaiahmed1/react-native-biometrics';

// Enable logging with INFO level
enableLogging(true);
setLogLevel(LogLevel.INFO);

// Configure advanced logging options
configureLogger({
  useColors: true,
  prefix: '[MyApp]',
  includeTimestamp: true,
  includeContext: true,
  maxStoredLogs: 1000
});

// Perform biometric operations - they will be automatically logged
const sensorInfo = await isSensorAvailable();

// Retrieve logs for analysis
const logs = getLogs();
console.log('Recent logs:', logs);
```

**For detailed logging documentation, see the [Logging Guide](../guides/logging.md).**
