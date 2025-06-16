# @sbaiahmed1/react-native-biometrics

A lightweight and unified React Native library for biometric authentication across iOS and Android. Supports Face ID, Touch ID, and Fingerprint with a simple JavaScript API.

## Installation

```sh
npm install @sbaiahmed1/react-native-biometrics
```

## Usage

### Check Sensor Availability

```js
import { isSensorAvailable } from '@sbaiahmed1/react-native-biometrics';

const checkBiometrics = async () => {
  try {
    const sensorInfo = await isSensorAvailable();
    console.log('Available:', sensorInfo.available);
    console.log('Type:', sensorInfo.biometryType); // 'FaceID', 'TouchID', 'Fingerprint', etc.
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Simple Authentication

```js
import { simplePrompt } from '@sbaiahmed1/react-native-biometrics';

const authenticate = async () => {
  try {
    const result = await simplePrompt('Please authenticate to continue');
    console.log('Authentication successful:', result);
  } catch (error) {
    console.error('Authentication failed:', error);
  }
};
```

### Enhanced Authentication (New!)

```js
import { authenticateWithOptions } from '@sbaiahmed1/react-native-biometrics';

const enhancedAuth = async () => {
  try {
    const result = await authenticateWithOptions({
      title: 'Secure Login',
      subtitle: 'Verify your identity',
      description: 'Use your biometric to access your account',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
      allowDeviceCredentials: true,
      disableDeviceFallback: false,
    });
    
    if (result.success) {
      console.log('Authentication successful!');
    } else {
      console.log('Authentication failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Key Management

```js
import { createKeys, deleteKeys } from '@sbaiahmed1/react-native-biometrics';

// Create biometric keys
const createBiometricKeys = async () => {
  try {
    const result = await createKeys();
    console.log('Keys created:', result);
  } catch (error) {
    console.error('Failed to create keys:', error);
  }
};

// Delete biometric keys
const deleteBiometricKeys = async () => {
  try {
    const result = await deleteKeys();
    console.log('Keys deleted:', result);
  } catch (error) {
    console.error('Failed to delete keys:', error);
  }
};
```

## API Reference

### `authenticateWithOptions(options)`

Enhanced authentication with customizable options.

**Parameters:**
- `options` (object):
  - `title` (string, optional): Dialog title
  - `subtitle` (string, optional): Dialog subtitle
  - `description` (string, optional): Additional description
  - `cancelLabel` (string, optional): Cancel button text
  - `fallbackLabel` (string, optional): Fallback button text
  - `allowDeviceCredentials` (boolean, optional): Allow PIN/password fallback
  - `disableDeviceFallback` (boolean, optional): Disable fallback options

**Returns:** Promise<BiometricAuthResult>
- `success` (boolean): Authentication result
- `error` (string, optional): Error message if failed
- `errorCode` (string, optional): Error code if failed


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
