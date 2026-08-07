---
title: Security
---

This library implements several security measures:

- **Hardware-backed keys**: Uses the device's secure hardware where the platform and key type support it (Android TEE/StrongBox for both key types, iOS Secure Enclave for EC keys; iOS RSA keys live in the regular Keychain)
- **Biometric validation**: Requires user authentication to use keys — biometric-only when device-credential fallback is disabled (`allowDeviceCredentials: false` / `disableDeviceFallback: true`)
- **Key isolation**: Keys are stored in the Android Keystore / iOS Keychain
- **No key export**: Private keys are non-exportable from the Keystore/Keychain on all paths; hardware residency depends on platform and key type
- **App-specific key aliases**: Each app uses unique key aliases to prevent cross-app key access

## Key Alias Security Enhancement

**Previous versions** used a hardcoded key alias (`"ReactNativeBiometricsKey"`) shared across all apps, which posed security risks:

- Multiple apps could potentially access each other's biometric keys
- Key collisions could occur between different applications

**Current version** implements secure, app-specific key aliases:

- **Default aliases** are automatically generated using bundle ID (iOS) or package name (Android)
- **Custom aliases** can be configured for different security contexts
- **Key isolation** ensures each app's biometric keys are properly separated

```javascript
// Without configuration, the default alias is auto-generated from the
// bundle ID (iOS) or package name (Android):
const alias = await getDefaultKeyAlias();
// e.g. "com.myapp.ReactNativeBiometrics"

// Configure an app-specific key alias — subsequent operations use it
await configureKeyAlias('com.myapp.biometric.main');
```

For detailed security information, see the [Key Alias Security Guide](./key-alias-security.md).
