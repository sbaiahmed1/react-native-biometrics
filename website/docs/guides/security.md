---
title: Security
---

This library implements several security measures:

- **Hardware-backed keys**: Uses the device's secure hardware when available
- **Biometric validation**: Requires actual biometric authentication
- **Key isolation**: Keys are stored in the device's secure keystore
- **No key export**: Private keys never leave the secure hardware
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
// Configure app-specific key alias
await configureKeyAlias('com.myapp.biometric.main');

// Get current default alias (auto-generated if not configured)
const alias = await getDefaultKeyAlias();
// Returns: "com.myapp.ReactNativeBiometrics"
```

For detailed security information, see the [Key Alias Security Guide](./key-alias-security.md).
