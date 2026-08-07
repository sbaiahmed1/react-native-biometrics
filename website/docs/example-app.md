---
title: Example App
---

The library includes a comprehensive example app demonstrating all features and capabilities. The example app contains several demo components:

## Available Demo Components

### AuthExample

Demonstrates basic authentication flows:

- Simple biometric prompts
- Enhanced authentication with custom options
- Error handling and fallback scenarios

### ColorExample

Shows UI customization capabilities:

- Custom prompt styling
- Theme integration
- Visual feedback examples

### CombinedBiometricsDemo

Comprehensive demonstration of key management and security features:

- **Key Management**: Create, delete, and list biometric keys with custom aliases
- **Integrity Validation**: Comprehensive key integrity checks and validation
- **Signature Operations**: Generate and verify cryptographic signatures
- **Security Testing**: Automated test suite for all security features
- **Real-time Results**: Live display of test results and security status

This component combines the functionality of key management and integrity testing into a single, unified interface, making it easy to test and understand all security features.

### DebuggingExample

Debugging and diagnostic utilities:

- Device capability detection
- Comprehensive diagnostic information
- Debug logging controls
- Test result analysis

## Running the Example App

The example is an Expo app using [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/) — the native projects are generated on first run, and Expo runs `pod install` for you on iOS. You still need [CocoaPods](https://cocoapods.org) installed (`pod` on your PATH) for the iOS build.

```bash
# from the repository root
yarn

# iOS
yarn example ios

# Android
yarn example android
```

The example app provides hands-on experience with all library features and serves as a reference implementation for integration patterns.
