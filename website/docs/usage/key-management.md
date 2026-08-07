---
title: Key Management
---

Manage cryptographic keys for secure biometric operations.

```typescript
import {
  createKeys,
  deleteKeys,
  getAllKeys,
  isSensorAvailable,
  authenticateWithOptions,
} from '@sbaiahmed1/react-native-biometrics';

// Create biometric keys for secure operations
const createBiometricKeys = async () => {
  try {
    // Create keys with the platform default type
    // (EC256 on iOS, RSA2048 on Android — pass 'ec256' explicitly if you need it everywhere)
    const result = await createKeys();
    console.log('✅ Keys created successfully');
    console.log('🔑 Public key:', result.publicKey);

    // Store the public key for server-side verification
    await storePublicKeyOnServer(result.publicKey);
  } catch (error) {
    console.error('💥 Failed to create keys:', error);
  }
};

// Create RSA keys for legacy system compatibility
const createRSAKeys = async () => {
  try {
    const result = await createKeys('com.myapp.rsa.key', 'rsa2048');
    console.log('✅ RSA2048 keys created successfully');
    console.log('🔑 Public key:', result.publicKey);
  } catch (error) {
    console.error('💥 Failed to create RSA keys:', error);
  }
};

// Delete biometric keys when no longer needed
const deleteBiometricKeys = async () => {
  try {
    const result = await deleteKeys();

    if (result.success) {
      console.log('✅ Keys deleted successfully');
      // Clean up any stored references
      await removePublicKeyFromServer();
    } else {
      console.log('❌ Failed to delete keys');
    }
  } catch (error) {
    console.error('💥 Failed to delete keys:', error);
  }
};

// Retrieve the library's stored biometric keys
const getAllBiometricKeys = async () => {
  try {
    // With no alias, returns the key(s) under the default (configured) alias
    const result = await getAllKeys();

    console.log(`📋 Found ${result.keys.length} stored keys`);

    result.keys.forEach((key, index) => {
      console.log(`🔑 Key ${index + 1}:`);
      console.log(`   Alias: ${key.alias}`);
      console.log(`   Public Key: ${key.publicKey.substring(0, 50)}...`);
      // For metadata such as creation date, use getKeyAttributes(key.alias)
    });

    return result.keys;
  } catch (error) {
    console.error('💥 Failed to retrieve keys:', error);
    return [];
  }
};

// Example: Complete key lifecycle management
const keyLifecycleExample = async () => {
  try {
    // 1. Check if biometrics are available
    const sensorInfo = await isSensorAvailable();
    if (!sensorInfo.available) {
      throw new Error('Biometric authentication not available');
    }

    // 2. Create keys for the user (platform default key type)
    const keyResult = await createKeys();
    console.log('🔐 Biometric keys created for user');

    // 3. Perform authenticated operations
    const authResult = await authenticateWithOptions({
      title: 'Verify Identity',
      subtitle: 'Authenticate to access secure features',
    });

    if (authResult.success) {
      console.log('🎉 User authenticated with biometric keys');
    }

    // 4. Clean up when user logs out
    // await deleteKeys();
  } catch (error) {
    console.error('💥 Key lifecycle error:', error);
  }
};
```
