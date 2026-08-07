---
title: Migrating from react-native-biometrics
sidebar_label: Migration
---

This guide is for users migrating from the popular but deprecated `react-native-biometrics` library by SelfLender. Our library offers a more modern, functional API with enhanced features, but the migration process is straightforward.

## 1. Installation

First, uninstall the old library and install ours:

**Uninstall `react-native-biometrics`:**

```bash
npm uninstall react-native-biometrics
# or
yarn remove react-native-biometrics
```

**Install `@sbaiahmed1/react-native-biometrics`:**

```bash
npm install @sbaiahmed1/react-native-biometrics
# or
yarn add @sbaiahmed1/react-native-biometrics
```

## 2. API Changes

The most significant change is the shift from a class-based API to a functional one. You no longer need to instantiate a class; simply import the functions you need.

### From Class to Functions

**Before (`react-native-biometrics`):**

```javascript
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();
rnBiometrics.isSensorAvailable().then(...);
```

**After (`@sbaiahmed1/react-native-biometrics`):**

```javascript
import { isSensorAvailable } from '@sbaiahmed1/react-native-biometrics';

isSensorAvailable().then(...);
```

### `isSensorAvailable`

The function signature and return value are very similar.

**Before:**

```javascript
rnBiometrics.isSensorAvailable()
  .then((resultObject) => {
    const { available, biometryType } = resultObject;
    // ...
  });
```

**After:**

```javascript
import { isSensorAvailable } from '@sbaiahmed1/react-native-biometrics';

isSensorAvailable()
  .then((sensorInfo) => {
    const { available, biometryType } = sensorInfo;
    // ...
  });
```

### `simplePrompt`

The `simplePrompt` function is now more direct.

**Before:**

```javascript
rnBiometrics.simplePrompt({ promptMessage: 'Authenticate' })
  .then((result) => {
    if (result.success) {
      // ...
    }
  });
```

**After:**

```javascript
import { simplePrompt } from '@sbaiahmed1/react-native-biometrics';

simplePrompt('Authenticate')
  .then((result) => {
    if (result.success) {
      // ...
    }
  });
```

### Key Management

The key management functions have been updated and are now named exports. Here are the most important changes:

| `react-native-biometrics` (Old) | `@sbaiahmed1/react-native-biometrics` (New) | Notes |
| ------------------------------- | ------------------------------------------- | ----- |
| `createKeys()`                  | `createKeys(keyAlias?, keyType?, biometricStrength?, allowDeviceCredentials?, failIfExists?)` | Supports key type, biometric strength, device credential fallback, and duplicate key protection. |
| `biometricKeysExist()`          | `validateKeyIntegrity()`                    | Check the `keyExists` boolean in the returned object. |
| `createSignature()`             | `verifyKeySignature()`                      | This function now creates the signature. The name is updated to reflect its primary use in verification flows. |
| `deleteKeys()`                  | `deleteKeys()`                              | No change in function name. |

Additionally, this library introduces several new key management functions:

- `getKeyAttributes()`: Get detailed attributes of a key.
- `getAllKeys(customAlias?)`: Retrieve all keys managed by the library, optionally filtered by custom alias.
- `configureKeyAlias()`: Set a default alias for keys.

### Using Fallback (Device Credentials)

In the old library, you would enable the device credential fallback in the constructor. In our library, you use the `authenticateWithOptions` function.

**Before:**

```javascript
const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
// All prompts will now have a fallback
```

**After:**

```javascript
import { authenticateWithOptions } from '@sbaiahmed1/react-native-biometrics';

authenticateWithOptions({
  title: 'Authenticate',
  allowDeviceCredentials: true,
}).then(...);
```

## 3. Configuration Changes

### Android

In your `android/app/src/main/AndroidManifest.xml`, it's recommended to add the `USE_BIOMETRIC` permission alongside `USE_FINGERPRINT` for broader compatibility with modern Android versions.

```xml
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

## Full Example: Before and After

Here's a complete example of a common authentication flow.

**Before (`react-native-biometrics`):**

```javascript
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

rnBiometrics.isSensorAvailable()
  .then((resultObject) => {
    const { available, biometryType } = resultObject;

    if (available && biometryType === BiometryTypes.TouchID) {
      console.log('TouchID is supported');
      return rnBiometrics.simplePrompt({ promptMessage: 'Confirm fingerprint' });
    }
    // ... handle other cases
  })
  .then((result) => {
    if (result && result.success) {
      console.log('Successful authentication');
    } else {
      console.log('User cancelled or authentication failed');
    }
  })
  .catch((error) => {
    console.log(error);
  });
```

**After (`@sbaiahmed1/react-native-biometrics`):**

```javascript
import { isSensorAvailable, simplePrompt } from '@sbaiahmed1/react-native-biometrics';

const authenticate = async () => {
  try {
    const sensorInfo = await isSensorAvailable();
    if (sensorInfo.available && sensorInfo.biometryType === 'TouchID') {
      console.log('TouchID is supported');
      const result = await simplePrompt('Confirm fingerprint');
      if (result.success) {
        console.log('Successful authentication');
      } else {
        console.log('User cancelled or authentication failed');
      }
    }
    // ... handle other cases
  } catch (error) {
    console.log(error);
  }
};

authenticate();
```
