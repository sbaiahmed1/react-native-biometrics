---
title: Quick Start
---

```typescript
import {
  isSensorAvailable,
  simplePrompt,
  authenticateWithOptions,
  setDebugMode
} from '@sbaiahmed1/react-native-biometrics';

const BiometricAuth = () => {
  const authenticate = async () => {
    try {
      // Enable debug mode for development
      await setDebugMode(true);

      // Check if biometric authentication is available
      const sensorInfo = await isSensorAvailable();

      if (sensorInfo.available) {
        console.log(`✅ ${sensorInfo.biometryType} available`);

        // Perform authentication
        const result = await simplePrompt('Please authenticate to continue');

        if (result) {
          console.log('🎉 Authentication successful!');
          // Navigate to secure content
        } else {
          console.log('❌ Authentication failed');
        }
      } else {
        console.log('❌ Biometric authentication not available:', sensorInfo.error);
        // Show alternative authentication method
      }
    } catch (error) {
      console.error('💥 Authentication error:', error);
    }
  };

  return authenticate;
};
```

## Next steps

- Explore the [Usage guides](../usage/authentication.md) for authentication flows, key management, and debugging
- Browse the full [API Reference](../api/index.md)
- Coming from the unmaintained `react-native-biometrics`? See the [Migration guide](./migration.md)
