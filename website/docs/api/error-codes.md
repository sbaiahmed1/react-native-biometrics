---
title: Error Codes
---

Error codes are platform-specific. iOS and Android often use different names for the same condition (for example `USER_CANCEL` on iOS and `USER_CANCELED` on Android), so check for both when you branch on a code.

## How codes are returned

- **Rejected promise, code in `error.code`:** `simplePrompt()`, `authenticateWithOptions()`, `createKeys()`, `createKeysWithOptions()`, `deleteKeys()`, `getPublicKey()`, `getAllKeys()` and `configureKeyAlias()`.
- **Resolved result, code in `result.errorCode`:** `isSensorAvailable()` (with `available: false`), `signWithOptions()`, `verifyKeySignature()` and `sign()` (with `success: false`), and `getKeyAttributes()` on iOS.

`validateKeyIntegrity()` and `validateSignature()` report failures only as an `error` message, without a code.

```typescript
try {
  await simplePrompt('Confirm your identity');
} catch (error: any) {
  if (error.code === 'USER_CANCEL' || error.code === 'USER_CANCELED') {
    // The user dismissed the prompt
  }
}

const result = await signWithOptions({ data: payload });
if (!result.success && result.errorCode === 'KEY_NOT_FOUND') {
  // Create the key first
}
```

## Same condition, different code

| Condition | iOS | Android |
|-----------|-----|---------|
| User canceled the prompt | `USER_CANCEL` | `USER_CANCELED` |
| System canceled the prompt | `SYSTEM_CANCEL` | `SYSTEM_CANCELED` |
| Too many failed attempts | `BIOMETRY_LOCKOUT` | `BIOMETRIC_LOCKOUT`, `BIOMETRIC_LOCKOUT_PERMANENT` |
| No biometrics enrolled | `BIOMETRY_NOT_ENROLLED` | `NO_BIOMETRICS_ENROLLED` (prompts), `BiometricErrorNoneEnrolled` (`isSensorAvailable`) |
| No biometric hardware | `BIOMETRY_NOT_AVAILABLE` | `NO_BIOMETRIC_HARDWARE` (prompts), `BiometricErrorNoHardware` (`isSensorAvailable`) |
| No passcode / device credential set | `PASSCODE_NOT_SET` | `NO_DEVICE_CREDENTIAL` |

## Authentication codes

`simplePrompt()` and `authenticateWithOptions()` reject with these codes. `signWithOptions()` and `verifyKeySignature()` resolve with the Android codes in `errorCode` when the prompt fails. On iOS, `isSensorAvailable()` reports its `errorCode` from the same iOS set.

| Code | Description | Platform |
|------|-------------|----------|
| `USER_CANCEL` | The user canceled authentication. | iOS |
| `USER_FALLBACK` | The user tapped the fallback button (for example "Enter Password"). | iOS |
| `SYSTEM_CANCEL` | The system canceled authentication, for example because the app moved to the background. | iOS |
| `AUTHENTICATION_FAILED` | The user did not provide valid credentials. | iOS |
| `BIOMETRY_NOT_AVAILABLE` | Biometry can't be used. `simplePrompt()` and `authenticateWithOptions()` return this for any failed pre-check, including no enrollment; call `isSensorAvailable()` for the specific reason. | iOS |
| `BIOMETRY_NOT_ENROLLED` | No Face ID, Touch ID or Optic ID identity is enrolled. | iOS |
| `BIOMETRY_LOCKOUT` | Biometry is locked after too many failed attempts; the passcode is needed to unlock it. | iOS |
| `PASSCODE_NOT_SET` | No device passcode is set. | iOS |
| `INVALID_CONTEXT` | The authentication context was invalidated. | iOS |
| `NOT_INTERACTIVE` | Authentication needs UI, but showing UI is not allowed. | iOS |
| `UNKNOWN_ERROR` | Any other LocalAuthentication error (for example an app cancel); the message includes the native code. | iOS |
| `USER_CANCELED` | The user canceled authentication or tapped the cancel button. | Android |
| `SYSTEM_CANCELED` | The system canceled authentication, for example because the app moved to the background. | Android |
| `BIOMETRIC_UNAVAILABLE` | The biometric hardware is temporarily unavailable. | Android |
| `BIOMETRIC_TIMEOUT` | The prompt timed out. | Android |
| `BIOMETRIC_LOCKOUT` | Too many failed attempts; biometrics are locked for a while. | Android |
| `BIOMETRIC_LOCKOUT_PERMANENT` | Too many failed attempts; biometrics stay locked until the user unlocks the device with their PIN, pattern or password. | Android |
| `NO_BIOMETRICS_ENROLLED` | No biometric is enrolled. | Android |
| `NO_BIOMETRIC_HARDWARE` | The device has no biometric hardware. | Android |
| `NO_DEVICE_CREDENTIAL` | Device credentials were requested, but no PIN, pattern or password is set. | Android |
| `BIOMETRIC_ERROR` | Any other `BiometricPrompt` error (unable to process, no space, vendor error). `isSensorAvailable()` also rejects with it on an unexpected exception. | Android |
| `PROMPT_ERROR` | The biometric prompt could not be shown. | Android |
| `ACTIVITY_ERROR` | `simplePrompt()` only: there is no active activity to show the prompt in. | Android |
| `NO_ACTIVITY` | `authenticateWithOptions()` only: there is no active activity to show the prompt in. | Android |

## Sensor availability codes (Android)

On Android, `isSensorAvailable()` resolves with `available: false` and one of these `errorCode` values. iOS uses the codes from [Authentication codes](#authentication-codes).

| Code | Description | Platform |
|------|-------------|----------|
| `BiometricErrorNoHardware` | The device has no biometric hardware. | Android |
| `BiometricErrorHwUnavailable` | The biometric hardware is temporarily unavailable. | Android |
| `BiometricErrorNoneEnrolled` | No biometric of the requested strength is enrolled. | Android |
| `BiometricErrorSecurityUpdateRequired` | A security update is required before biometrics can be used. | Android |
| `BiometricErrorUnsupported` | The requested authenticator type is not supported on this Android version. | Android |
| `BiometricStatusUnknown` | Android could not determine biometric availability. | Android |

## Signing codes

`signWithOptions()`, `verifyKeySignature()` and `sign()` resolve with `success: false` and one of these codes in `errorCode`. On Android, prompt failures in `signWithOptions()` and `verifyKeySignature()` use the Android [authentication codes](#authentication-codes). On iOS, Keychain lookup failures use the [iOS Keychain status codes](#ios-keychain-status-codes).

| Code | Description | Platform |
|------|-------------|----------|
| `INVALID_INPUT` | `sign()` was called with empty `data`. | Both |
| `INVALID_INPUT_ENCODING` | `inputEncoding` is `'base64'`, but `data` is not valid base64. | Both |
| `KEY_NOT_FOUND` | No key exists for the alias. | Both |
| `KEY_REQUIRES_AUTHENTICATION` | `sign()` was called on a key that needs user authentication; use `signWithOptions()` for those keys. | Both |
| `INVALID_ALGORITHM` | `sign()`: the requested algorithm does not match the key type. | Both |
| `UNSUPPORTED_ALGORITHM` | `sign()`: the key does not support the requested algorithm (for example SHA-512 on an Android key created before SHA-512 support or inside StrongBox). | Both |
| `SIGNATURE_CREATION_FAILED` | Signing failed, including Keystore or Secure Enclave errors after a successful prompt; `error` contains the native message. | Both |
| `INVALID_KEY_TYPE` | The alias does not refer to a private key entry. | Android |
| `BIOMETRIC_NOT_AVAILABLE` | `signWithOptions()`: no authenticator the key accepts is available, or `disableDeviceFallback` is set for a key that only accepts device credentials. | Android |
| `ACTIVITY_NOT_AVAILABLE` | `signWithOptions()`: there is no active activity to show the prompt in. | Android |
| `PROMPT_ERROR` | `signWithOptions()`: the biometric prompt could not be shown. | Android |
| `KEY_USER_NOT_AUTHENTICATED` | Keystore rejected the signing operation despite successful authentication (OEM auth-token delivery bug; automatically retried before this is returned — prompt the user to try again) | Android |
| `BIOMETRY_CURRENT_SET_CHANGED` | `signWithOptions()`: biometric enrollment changed since a key created with `biometricStrength: 'strong'` was made, so the key must be recreated. | iOS |
| `USER_CANCEL` | `signWithOptions()`: the user canceled authentication. | iOS |
| `AUTHENTICATION_FAILED` | `signWithOptions()`: authentication failed. | iOS |
| `KEY_ACCESS_FAILED` | `signWithOptions()`: the Secure Enclave reported corrupted key data. | iOS |

On iOS, `signWithOptions()`, `verifyKeySignature()` and `sign()` reject with `DATA_ENCODING_FAILED` if UTF-8 `data` can't be encoded.

## Key management codes

`createKeys()`, `createKeysWithOptions()`, `deleteKeys()`, `getPublicKey()`, `getAllKeys()` and `configureKeyAlias()` reject with these codes.

| Code | Description | Platform |
|------|-------------|----------|
| `KEY_ALREADY_EXISTS` | `createKeys()` with `failIfExists: true` found an existing key with the alias. | Both |
| `KEY_NOT_FOUND` | `getPublicKey()`: no key exists for the alias. | Both |
| `CREATE_KEYS_ERROR` | Key creation failed: invalid key type or biometric strength, `allowDeviceCredentials` below API 30, no enrolled biometric, or a Keystore error. | Android |
| `DELETE_KEYS_ERROR` | Key deletion failed or could not be verified. | Android |
| `GET_PUBLIC_KEY_ERROR` | Reading the public key failed. | Android |
| `GET_ALL_KEYS_ERROR` | Listing keys failed. | Android |
| `INVALID_KEY_ALIAS` | `configureKeyAlias()` was called with an empty alias. | Android |
| `INVALID_PARAMETERS` | `createKeys()`: unsupported key type or biometric strength. | iOS |
| `DATA_ENCODING_FAILED` | The key alias could not be encoded. | iOS |
| `ACCESS_CONTROL_CREATION_FAILED` | The Keychain access control for the key could not be created. | iOS |
| `KEY_CREATION_FAILED` | The Secure Enclave or Keychain could not generate the key. | iOS |
| `PUBLIC_KEY_EXTRACTION_FAILED` | The public key could not be derived from the new or stored key. | iOS |
| `KEY_EXPORT_FAILED` | The public key could not be exported. | iOS |
| `KEY_DELETION_FAILED` | The key still exists after deletion. | iOS |
| `KEY_REQUIRES_AUTHENTICATION` | `getPublicKey()`: the Keychain refused a non-interactive lookup of a biometric-gated key; use the `publicKey` returned by `createKeys()`. | iOS |
| `KEYCHAIN_QUERY_FAILED` | `getAllKeys()`: the Keychain query returned an unexpected result. | iOS |
| `EMPTY_KEY_ALIAS` | `configureKeyAlias()` was called with an empty alias. | iOS |
| `INVALID_KEY_REFERENCE` | `getKeyAttributes()` (in `errorCode`): the Keychain returned an invalid key reference. | iOS |

## iOS Keychain status codes

When a Keychain call fails, iOS maps the status to one of these codes. `deleteKeys()`, `getPublicKey()` and `getAllKeys()` reject with them; `signWithOptions()`, `verifyKeySignature()`, `sign()` and `getKeyAttributes()` return them in `errorCode`.

| Code | Description | Platform |
|------|-------------|----------|
| `KEY_NOT_FOUND` | No Keychain item was found (`errSecItemNotFound`). | iOS |
| `AUTHENTICATION_FAILED` | The Keychain reported an authentication failure (`errSecAuthFailed`). | iOS |
| `USER_CANCEL` | The user canceled a Keychain operation (`errSecUserCanceled`). | iOS |
| `SECURE_ENCLAVE_NOT_AVAILABLE` | The Keychain or Secure Enclave is not available (`errSecNotAvailable`). | iOS |
| `INVALID_PARAMETERS` | The Keychain rejected the query parameters (`errSecParam`). | iOS |
| `MEMORY_ALLOCATION_FAILED` | The Keychain could not allocate memory (`errSecAllocate`). | iOS |
| `KEY_ALREADY_EXISTS` | A Keychain item already exists (`errSecDuplicateItem`). | iOS |
| `INVALID_SIGNATURE_FORMAT` | The Keychain could not decode the data (`errSecDecode`). | iOS |
| `UNKNOWN_ERROR` | Any other status; the message includes the numeric status. | iOS |
