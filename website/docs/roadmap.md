---
title: Roadmap
---

## Completed

- [x] **Code Quality Improvements**: Improved type safety, error handling, and code documentation
- [x] **Type Safety**: Fixed conditional casting warnings and type conversion issues
- [x] **Code Organization**: Added MARK comments and improved code structure
- [x] **Enhanced Testing**: Expanded unit test coverage and added integration tests
- [x] **Centralized Logging**: Implemented comprehensive logging and error reporting system
- [x] **Advanced Security Features**: Enhanced security measures and validation
- [x] **Key Type Support**: Added support for EC256 and RSA2048 key types in createKeys function
- [x] **Biometrics Change Event Handling**: Implement event listeners for biometric changes (e.g., new enrollment, removal)
- [x] **StrongBox Support**: Automatic StrongBox hardware security on Android with TEE fallback
- [x] **AuthType Reporting**: `AuthType` enum and opt-in `authType` field in authentication and signing results
- [x] **Native SHA-256**: Exported `sha256()` function using platform-native cryptography
- [x] **Device Credential Keys**: `allowDeviceCredentials` parameter for `createKeys` to allow PIN/passcode-bound keys
- [x] **Duplicate Key Protection**: `failIfExists` parameter for `createKeys` to prevent accidental key overwrites
- [x] **Device Security Check**: `isDeviceSecure` field in `isSensorAvailable` result
- [x] **iOS Simulator Support**: Full biometric prompt support on iOS Simulator via LAContext workarounds
- [x] **Non-Biometric Signing**: Keystore/Keychain-backed, prompt-free RSA/EC signing (`createKeysWithOptions`, `keyExists`, `getPublicKey`, `sign`) with SHA-256/SHA-512, hardware-backed where supported — a modern `react-native-rsa-native` alternative ([#90](https://github.com/sbaiahmed1/react-native-biometrics/issues/90))

## In Progress

- [ ] **Performance Optimization**: Optimize biometric operations and reduce latency
