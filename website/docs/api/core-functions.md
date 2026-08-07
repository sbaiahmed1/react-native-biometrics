---
title: Core Functions
---

## `isSensorAvailable()`

Checks if biometric authentication is available on the device.

```typescript
const isSensorAvailable = (options?: {
  biometricStrength?: BiometricStrength;  // Android only — the strength class to check for (defaults to Strong)
}): Promise<BiometricSensorInfo> => {
};

type BiometricSensorInfo = {
  available: boolean;        // Whether biometric auth is available
  biometryType?: 'Biometrics' | 'FaceID' | 'TouchID' | 'None' | 'Unknown';
  isDeviceSecure: boolean;   // Whether the device has a passcode/PIN/password set
  error?: string;            // Error message if not available
  errorCode?: string;        // Error code if not available (platform-specific)
  fallbackUsed?: boolean;
  biometricStrength?: BiometricStrength;
}
```

**Platform Notes:**

- `biometricStrength` is Android-only; iOS ignores it
- Android reports `'Biometrics'` for available sensors; `'FaceID'`/`'TouchID'` are iOS values
- `errorCode` is available on both iOS and Android platforms
- iOS returns specific error codes like `"BiometryNotAvailable"`, `"BiometryNotEnrolled"`, etc.
- Android returns descriptive error codes like `"BiometricErrorNoHardware"`, `"BiometricErrorNoneEnrolled"`, etc.
- The `error` property provides human-readable messages on both platforms

## `simplePrompt()`

Performs basic biometric authentication with a custom message.

```typescript
const simplePrompt = (
  promptMessage: string,
  options?: { biometricStrength?: BiometricStrength }  // Android only
): Promise<BiometricAuthResult> => {
};
```

**Parameters:**

- `promptMessage` (string): Message to display to the user
- `options.biometricStrength` (optional, Android only): `BiometricStrength.Strong` or `BiometricStrength.Weak`

**Returns:** `Promise<BiometricAuthResult>` — check `result.success` for the outcome

## `authenticateWithOptions()`

Enhanced authentication with customizable options and detailed results.

```typescript
const authenticateWithOptions = (options: BiometricAuthOptions): Promise<BiometricAuthResult> => {
};

type BiometricAuthOptions = {
  title?: string;                    // Dialog title
  subtitle?: string;                 // Dialog subtitle
  description?: string;              // Additional description
  cancelLabel?: string;              // Cancel button text
  fallbackLabel?: string;            // Fallback button text
  allowDeviceCredentials?: boolean;  // Allow PIN/password fallback
  disableDeviceFallback?: boolean;   // Disable fallback options
  biometricStrength?: BiometricStrength;  // Android only
  returnAuthType?: boolean;          // Include authType in result (see AuthType enum)
}

type BiometricAuthResult = {
  success: boolean;          // Authentication result
  error?: string;            // Error message if failed
  errorCode?: string;        // Error code if failed
  fallbackUsed?: boolean;    // Whether a fallback method was used
  authType?: AuthType;       // How the user authenticated (only when returnAuthType is true)
}
```
