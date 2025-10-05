# Cryptographic Key Management Guide

This guide provides comprehensive information about cryptographic key management in React Native Biometrics, including detailed comparisons, platform-specific behaviors, and advanced usage patterns.

## Overview

React Native Biometrics supports two types of cryptographic keys for secure biometric operations:

- **EC256** (Elliptic Curve P-256): Modern, efficient, and secure
- **RSA2048** (RSA 2048-bit): Legacy-compatible and widely supported

## Key Types Comparison

### EC256 (Elliptic Curve P-256)

**Advantages:**
- **Smaller key size**: More efficient storage and transmission
- **Better performance**: Faster key generation and cryptographic operations
- **Modern security**: Based on elliptic curve cryptography standards
- **Hardware acceleration**: Optimized support on modern devices
- **Secure Enclave support**: On iOS, keys are stored in hardware-protected Secure Enclave

**Use Cases:**
- New applications without legacy constraints
- High-performance requirements
- Mobile-first applications
- When hardware security is prioritized

**Platform Behavior:**
- **iOS**: Default key type, stored in Secure Enclave when available
- **Android**: Supported, stored in Android Keystore

### RSA2048 (RSA 2048-bit)

**Advantages:**
- **Wide compatibility**: Supported by virtually all systems and libraries
- **Legacy support**: Compatible with older infrastructure
- **Industry standard**: Well-established in enterprise environments
- **Proven security**: Long track record of secure implementations

**Use Cases:**
- Integration with legacy systems
- Enterprise environments with RSA requirements
- Compliance with specific security standards
- Backward compatibility needs

**Platform Behavior:**
- **iOS**: Stored in regular keychain (not Secure Enclave)
- **Android**: Default key type, stored in Android Keystore

## Platform-Specific Defaults

### Why Different Defaults?

Each platform uses the key type that best leverages its security capabilities:

- **iOS defaults to EC256**: Takes advantage of Secure Enclave hardware security
- **Android defaults to RSA2048**: Maintains backward compatibility with existing Android implementations

### Security Implications

| Platform | Default | Storage Location | Hardware Protection |
|----------|---------|------------------|-------------------|
| iOS | EC256 | Secure Enclave | ✅ Yes (when available) |
| iOS | RSA2048 | Keychain | ❌ No |
| Android | RSA2048 | Android Keystore | ✅ Yes |
| Android | EC256 | Android Keystore | ✅ Yes |

## Advanced Usage Patterns

### Explicit Key Type Selection

```javascript
import { createKeys } from '@sbaiahmed1/react-native-biometrics';

// Force EC256 on both platforms (recommended for new apps)
const result = await createKeys(undefined, 'ec256');

// Force RSA2048 on both platforms (for legacy compatibility)
const result = await createKeys(undefined, 'rsa2048');
```

### Platform-Specific Key Selection

```javascript
import { Platform } from 'react-native';
import { createKeys } from '@sbaiahmed1/react-native-biometrics';

// Use optimal key type for each platform
const keyType = Platform.OS === 'ios' ? 'ec256' : 'rsa2048';
const result = await createKeys(undefined, keyType);
```

### Custom Key Aliases with Types

```javascript
// Different key types for different purposes
const primaryKeys = await createKeys('primary.biometric', 'ec256');
const backupKeys = await createKeys('backup.biometric', 'rsa2048');
```

### Migration Strategy

When migrating from RSA to EC keys:

```javascript
import { deleteKeys, createKeys, keyExists } from '@sbaiahmed1/react-native-biometrics';

async function migrateToEC256() {
  try {
    // Check if old RSA keys exist
    const hasOldKeys = await keyExists('legacy.rsa.key');
    
    if (hasOldKeys) {
      // Create new EC256 keys
      await createKeys('modern.ec.key', 'ec256');
      
      // Verify new keys work, then delete old ones
      await deleteKeys('legacy.rsa.key');
      
      console.log('Successfully migrated to EC256 keys');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

## Performance Considerations

### Key Generation Speed

| Key Type | iOS | Android | Notes |
|----------|-----|---------|-------|
| EC256 | ~50-100ms | ~100-200ms | Faster on iOS with Secure Enclave |
| RSA2048 | ~200-500ms | ~300-600ms | Slower due to larger key size |

### Memory Usage

- **EC256**: ~32 bytes private key, ~65 bytes public key
- **RSA2048**: ~256 bytes private key, ~256 bytes public key

### Cryptographic Operations

EC256 operations are generally 2-4x faster than RSA2048 for:
- Signature generation
- Signature verification
- Key derivation

## Security Best Practices

### Key Storage Security

1. **iOS EC256**: Automatically uses Secure Enclave when available
2. **Android**: Both key types benefit from Android Keystore hardware backing
3. **Key Aliases**: Use descriptive, unique aliases to avoid conflicts

### Key Lifecycle Management

```javascript
// Good: Explicit key management
async function setupBiometrics() {
  try {
    // Check if keys already exist
    const exists = await keyExists();
    
    if (!exists) {
      // Create keys with appropriate type
      await createKeys(undefined, 'ec256');
    }
    
    return true;
  } catch (error) {
    console.error('Biometric setup failed:', error);
    return false;
  }
}

// Good: Cleanup on logout/uninstall
async function cleanupBiometrics() {
  try {
    await deleteKeys();
    console.log('Biometric keys cleaned up');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}
```

### Error Handling

```javascript
import { createKeys, BiometricError } from '@sbaiahmed1/react-native-biometrics';

async function createKeysWithFallback() {
  try {
    // Try EC256 first (recommended)
    return await createKeys(undefined, 'ec256');
  } catch (error) {
    if (error.code === 'KeyGenerationFailed') {
      console.warn('EC256 failed, falling back to RSA2048');
      // Fallback to RSA2048
      return await createKeys(undefined, 'rsa2048');
    }
    throw error;
  }
}
```

## Troubleshooting

### Common Issues

1. **Key generation fails on older devices**: Use RSA2048 as fallback
2. **Secure Enclave unavailable**: EC256 will fall back to regular keychain on iOS
3. **Key alias conflicts**: Use unique, descriptive aliases
4. **Performance issues**: Consider key type and device capabilities

### Debugging Key Types

```javascript
import { createKeys } from '@sbaiahmed1/react-native-biometrics';

async function debugKeyCreation() {
  const startTime = Date.now();
  
  try {
    const result = await createKeys('debug.key', 'ec256');
    const duration = Date.now() - startTime;
    
    console.log(`EC256 key created in ${duration}ms`);
    console.log('Public key length:', result.publicKey.length);
    
    return result;
  } catch (error) {
    console.error('Key creation debug info:', {
      error: error.message,
      code: error.code,
      duration: Date.now() - startTime
    });
    throw error;
  }
}
```

## Migration Guide

### From Legacy Implementations

If you're upgrading from an older version that only supported RSA:

1. **Assess current usage**: Determine if you need backward compatibility
2. **Choose strategy**: Gradual migration vs. clean slate
3. **Test thoroughly**: Verify key operations on target devices
4. **Plan rollback**: Keep RSA2048 as fallback option

### Version Compatibility

- **v3.0+**: Full support for both EC256 and RSA2048
- **v2.x**: RSA2048 only
- **v1.x**: Limited key management features

## Related Documentation

- [Main README](../README.md) - Basic usage and API reference
- [Key Alias Security](../KEY_ALIAS_SECURITY.md) - Security considerations for key aliases
- [Logging Guide](./LOGGING.md) - Debugging and troubleshooting