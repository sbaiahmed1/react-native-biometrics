---
title: Authentication
---

## Check Sensor Availability

Before attempting authentication, check if biometric sensors are available on the device.

```typescript
import { isSensorAvailable } from '@sbaiahmed1/react-native-biometrics';

const checkBiometrics = async () => {
  try {
    const sensorInfo = await isSensorAvailable();

    if (sensorInfo.available) {
      console.log('✅ Biometric authentication available');
      console.log('📱 Type:', sensorInfo.biometryType);
      // Possible values: 'FaceID', 'TouchID', 'Fingerprint', 'Biometrics'
    } else {
      console.log('❌ Biometric authentication not available');
      console.log('🚫 Reason:', sensorInfo.error);
    }
  } catch (error) {
    console.error('💥 Error checking biometrics:', error);
  }
};
```

## Simple Authentication

Perform basic biometric authentication with a custom message.

```typescript
import { simplePrompt } from '@sbaiahmed1/react-native-biometrics';

const authenticate = async () => {
  try {
    const result = await simplePrompt('Please authenticate to continue');

    if (result) {
      console.log('✅ Authentication successful!');
      // Proceed with authenticated action
    } else {
      console.log('❌ Authentication failed or cancelled');
    }
  } catch (error) {
    console.error('💥 Authentication error:', error);
  }
};
```

> Android: choose biometric strength using an enum

```typescript
import { simplePrompt, BiometricStrength } from '@sbaiahmed1/react-native-biometrics';

await simplePrompt('Please authenticate to continue', {
  biometricStrength: BiometricStrength.Weak, // or BiometricStrength.Strong
});
```

## Enhanced Authentication

Use advanced authentication options with customizable prompts and fallback mechanisms.

```typescript
import { authenticateWithOptions } from '@sbaiahmed1/react-native-biometrics';

const enhancedAuth = async () => {
  try {
    const result = await authenticateWithOptions({
      title: '🔐 Secure Login',
      subtitle: 'Verify your identity',
      description: 'Use your biometric to access your account securely',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
      allowDeviceCredentials: true,    // Allow PIN/password fallback
      disableDeviceFallback: false,    // Enable fallback options
    });

    if (result.success) {
      console.log('✅ Authentication successful!');
      // User authenticated successfully
      navigateToSecureArea();
    } else {
      console.log('❌ Authentication failed:', result.error);
      console.log('🔢 Error code:', result.errorCode);
      // Handle authentication failure
      handleAuthFailure(result.errorCode);
    }
  } catch (error) {
    console.error('💥 Authentication error:', error);
  }
};

// Example: Different authentication scenarios
const authScenarios = {
  // Strict biometric only (no fallback)
  strictBiometric: {
    title: 'Biometric Required',
    subtitle: 'Touch sensor or look at camera',
    allowDeviceCredentials: false,
    disableDeviceFallback: true,
  },

  // Flexible authentication (with fallbacks)
  flexibleAuth: {
    title: 'Secure Access',
    subtitle: 'Use biometric or device passcode',
    allowDeviceCredentials: true,
    disableDeviceFallback: false,
    fallbackLabel: 'Use Passcode',
  },

  // Custom branded experience
  brandedAuth: {
    title: 'MyApp Security',
    subtitle: 'Protect your data',
    description: 'Authenticate to access your personal information',
    cancelLabel: 'Not Now',
    fallbackLabel: 'Enter PIN',
  },
 };
```
