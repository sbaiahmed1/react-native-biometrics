---
title: API Reference
---

Complete reference for every function exported by `@sbaiahmed1/react-native-biometrics`, grouped by area.

## Configuration

| Function | Description |
|----------|-------------|
| [`configureKeyAlias()`](./configuration.md#configurekeyalias) | Configure a custom key alias for biometric key storage |
| [`getDefaultKeyAlias()`](./configuration.md#getdefaultkeyalias) | Get the current default key alias |
| [`configure()`](./configuration.md#configure) | Configure the library with a configuration object |

## Core Functions

| Function | Description |
|----------|-------------|
| [`isSensorAvailable()`](./core-functions.md#issensoravailable) | Check if biometric authentication is available |
| [`simplePrompt()`](./core-functions.md#simpleprompt) | Basic biometric authentication with a custom message |
| [`authenticateWithOptions()`](./core-functions.md#authenticatewithoptions) | Enhanced authentication with customizable options |

## Key Management

| Function | Description |
|----------|-------------|
| [`createKeys()`](./key-management.md#createkeys) | Generate cryptographic keys for biometric operations |
| [`createKeysWithOptions()`](./key-management.md#createkeyswithoptions) | Options-object variant, including prompt-free keys |
| [`keyExists()`](./key-management.md#keyexists) | Check whether a key exists without prompting |
| [`getPublicKey()`](./key-management.md#getpublickey) | Retrieve the public key without prompting |
| [`sign()`](./key-management.md#sign) | Sign data without any authentication prompt |
| [`deleteKeys()`](./key-management.md#deletekeys) | Delete previously created keys |
| [`getAllKeys()`](./key-management.md#getallkeys) | Retrieve all stored keys |

## Device Security

| Function | Description |
|----------|-------------|
| [`getDeviceIntegrityStatus()`](./device-security.md#getdeviceintegritystatus) | Detect rooted/jailbroken devices and runtime hooks |

## Debugging & Diagnostics

| Function | Description |
|----------|-------------|
| [`getDiagnosticInfo()`](./debugging.md#getdiagnosticinfo) | Comprehensive diagnostic information |
| [`runBiometricTest()`](./debugging.md#runbiometrictest) | Test biometric functionality end to end |
| [`setDebugMode()`](./debugging.md#setdebugmode) | Enable/disable debug logging |

## Logging & Monitoring

| Function | Description |
|----------|-------------|
| [`enableLogging()`](./logging.md#enablelogging) | Enable/disable the centralized logging system |
| [`setLogLevel()`](./logging.md#setloglevel) | Set the minimum log level |
| [`configureLogger()`](./logging.md#configurelogger) | Configure the logger with advanced options |
| [`getLogs()`](./logging.md#getlogs) | Retrieve stored log entries |
| [`clearLogs()`](./logging.md#clearlogs) | Clear stored log entries |

## Key Integrity Validation

| Function | Description |
|----------|-------------|
| [`validateKeyIntegrity()`](./key-integrity.md#validatekeyintegrity) | Comprehensive key integrity validation |
| [`verifyKeySignature()`](./key-integrity.md#verifykeysignature) | Generate a signature with the specified key |
| [`signWithOptions()`](./key-integrity.md#signwithoptions) | Sign with advanced security controls |
| [`validateSignature()`](./key-integrity.md#validatesignature) | Validate a signature against the original data |
| [`sha256()`](./key-integrity.md#sha256) | Native SHA-256 hashing |
| [`getKeyAttributes()`](./key-integrity.md#getkeyattributes) | Detailed attributes of a key |

## Biometric Change Detection

| Function | Description |
|----------|-------------|
| [`subscribeToBiometricChanges()`](./biometric-change-detection.md#subscribetobiometricchanges) | Subscribe to biometric change events |
| [`unsubscribeFromBiometricChanges()`](./biometric-change-detection.md#unsubscribefrombiometricchanges) | Unsubscribe from change events |
| [`startBiometricChangeDetection()`](./biometric-change-detection.md#startbiometricchangedetection) | Start monitoring for biometric changes |
| [`stopBiometricChangeDetection()`](./biometric-change-detection.md#stopbiometricchangedetection) | Stop monitoring for biometric changes |
| [`BiometricChangeEvent`](./biometric-change-detection.md#biometricchangeevent) | The change event type |

## Error Codes

See [Error Codes](./error-codes.md) for the common error codes returned by authentication methods.
