---
title: Core Functions
---

## `isSensorAvailable()`

Checks if biometric authentication is available on the device.

```typescript
const isSensorAvailable = (): Promise<SensorInfo> => {
};

type SensorInfo = {
  available: boolean;        // Whether biometric auth is available
  biometryType?: string;     // Type of biometry ('FaceID', 'TouchID', 'Fingerprint', etc.)
  isDeviceSecure: boolean;  // Whether the device has a passcode/PIN/password set
  error?: string;            // Error message if not available
  errorCode?: string;        // Error code if not available (platform-specific)
}
```

**Platform Notes:**

- `errorCode` is available on both iOS and Android platforms
- iOS returns specific error codes like `"BiometryNotAvailable"`, `"BiometryNotEnrolled"`, etc.
- Android returns descriptive error codes like `"BiometricErrorNoHardware"`, `"BiometricErrorNoneEnrolled"`, etc.
- The `error` property provides human-readable messages on both platforms

## `simplePrompt()`

Performs basic biometric authentication with a custom message.

```typescript
const simplePrompt = (reason: string): Promise<boolean> => {
};
```

**Parameters:**

- `reason` (string): Message to display to the user

**Returns:** `Promise<boolean>` - `true` if authentication succeeded, `false` otherwise

## `authenticateWithOptions()`

Enhanced authentication with customizable options and detailed results.

```typescript
const authenticateWithOptions = (options: AuthOptions): Promise<AuthResult> => {
};

type AuthOptions = {
  title?: string;                    // Dialog title
  subtitle?: string;                 // Dialog subtitle
  description?: string;              // Additional description
  cancelLabel?: string;              // Cancel button text
  fallbackLabel?: string;            // Fallback button text
  allowDeviceCredentials?: boolean;  // Allow PIN/password fallback
  disableDeviceFallback?: boolean;   // Disable fallback options
  returnAuthType?: boolean;          // Include authType in result (see AuthType enum)
}

type AuthResult = {
  success: boolean;          // Authentication result
  error?: string;            // Error message if failed
  errorCode?: string;        // Error code if failed
  authType?: AuthType;       // How the user authenticated (only when returnAuthType is true)
}
```
