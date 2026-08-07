---
title: Debugging & Diagnostics
---

## `getDiagnosticInfo()`

Returns comprehensive diagnostic information about the device's biometric capabilities.

```typescript
const getDiagnosticInfo = (): Promise<DiagnosticInfo> => {
};

type DiagnosticInfo = {
  platform: string;                 // 'iOS' or 'Android'
  osVersion: string;                // Operating system version
  deviceModel: string;              // Device model information
  biometricCapabilities: string[];  // Available biometric types
  securityLevel: string;            // 'SecureHardware' or 'Software'
  keyguardSecure: boolean;          // Whether device lock is secure
  enrolledBiometrics: string[];     // Currently enrolled biometric types
  lastError?: string;               // Last error encountered (if any)
}
```

## `runBiometricTest()`

Runs a comprehensive test of biometric functionality and returns detailed results.

```typescript
const runBiometricTest = (): Promise<BiometricTestResult> => {
};

type BiometricTestResult = {
  success: boolean;                 // Overall test success
  results: {
    sensorAvailable: boolean;         // Biometric sensor availability
    canAuthenticate: boolean;         // Authentication capability
    hardwareDetected: boolean;        // Hardware detection
    hasEnrolledBiometrics: boolean;   // Enrolled biometrics check
    secureHardware: boolean;          // Secure hardware availability
  };
  errors: string[];                 // Critical errors found
  warnings: string[];               // Non-critical warnings
}
```

## `setDebugMode()`

Enables or disables debug logging for the biometric library.

```typescript
const setDebugMode = (enabled: boolean): Promise<void> => {
};
```

**Parameters:**

- `enabled` (boolean): Whether to enable debug mode

**Usage:**

- When enabled, all library operations will log detailed information
- **iOS**: Check Xcode console for `[ReactNativeBiometrics Debug]` messages
- **Android**: Check Logcat for `ReactNativeBiometrics Debug` tags
