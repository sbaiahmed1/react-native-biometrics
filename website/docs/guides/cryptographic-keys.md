---
sidebar_label: Cryptographic Keys
---

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
const ecResult = await createKeys(undefined, 'ec256');

// Force RSA2048 on both platforms (for legacy compatibility)
const rsaResult = await createKeys(undefined, 'rsa2048');
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

## Non-Biometric Signing (Keystore/Keychain Keys Without Prompts)

For device-bound signing without any user interaction — server authentication,
request signing, attestation — keys can be created with no user-authentication
requirement. The private key still never leaves the Android Keystore / iOS
Keychain; only the prompt is removed. Hardware backing follows the same
platform matrix as biometric keys (see the table above): Android keys are
TEE/StrongBox-backed, iOS EC keys use the Secure Enclave on device, and iOS
RSA keys reside in the regular Keychain without hardware protection —
non-exportable via the API, but not hardware-resident. This covers the use
cases previously served by `react-native-rsa-native`.

```javascript
import {
  createKeysWithOptions,
  keyExists,
  getPublicKey,
  sign,
  deleteKeys,
  SignatureAlgorithm,
} from '@sbaiahmed1/react-native-biometrics';

// 1. Create a hardware-backed key that never prompts
const { publicKey } = await createKeysWithOptions({
  keyAlias: 'server-auth-key',
  keyType: 'rsa2048',
  requireAuthentication: false,
});

// 2. Prompt-free existence check
const exists = await keyExists('server-auth-key');

// 3. Public key as base64 X.509 SubjectPublicKeyInfo DER (both platforms)
const { publicKey: spki } = await getPublicKey('server-auth-key');

// 4. Sign without any prompt
const result = await sign({
  keyAlias: 'server-auth-key',
  data: payload,
  algorithm: SignatureAlgorithm.SHA512withRSA, // optional, defaults to SHA-256
});

// 5. Cleanup
await deleteKeys('server-auth-key');
```

### Behavior Notes

- `createKeysWithOptions` defaults to `requireAuthentication: true`, which is
  identical to `createKeys` — the non-biometric mode is strictly opt-in.
- `sign()` never shows a prompt. Called on a biometric-gated key it resolves
  with `{ success: false, errorCode: 'KEY_REQUIRES_AUTHENTICATION' }` — use
  `signWithOptions()` for those keys.
- The reverse works: `signWithOptions()` on a no-auth key signs silently and
  resolves with `authType: 0`.
- On iOS, no-auth keys use `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`:
  they don't depend on a passcode being set, but are unusable while the
  device is locked and never migrate to another device.

### Signature Algorithms

`sign()` accepts `SHA256withRSA`, `SHA512withRSA`, `SHA256withECDSA`, and
`SHA512withECDSA` (the algorithm must match the key type). Constraints:

- **Android**: keys created before SHA-512 support was added, and keys
  generated inside **StrongBox**, only permit SHA-256. Requesting SHA-512 on
  such a key fails with `UNSUPPORTED_ALGORITHM`; recreate the key to enable
  SHA-512 (StrongBox keys stay SHA-256 only).
- **iOS**: the algorithm is chosen per call, so SHA-512 works with existing
  keys too.

### Public Key Formats

`getPublicKey()` always returns base64-encoded X.509 SubjectPublicKeyInfo
(SPKI) DER, directly consumable by standard tooling
(`openssl pkey -pubin -inform DER`). Note that the `publicKey` returned by
`createKeys`/`createKeysWithOptions`/`getAllKeys` is unchanged for backward
compatibility: on Android and for iOS EC keys it is also SPKI, but **iOS RSA
keys are returned as raw PKCS#1 DER** there. Prefer `getPublicKey()` when a
server needs to consume the key.

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

### iOS Access-Control Migration (`.biometryAny` vs `.biometryCurrentSet`)

On iOS, key access-control policy is fixed at key creation time:

- Existing keys remain bound to the policy they were created with.
- New keys can use:
  - `.biometryAny` (default/backward-compatible)
  - `.biometryCurrentSet` (use `biometricStrength: 'strong'` during `createKeys`)
  - `.userPresence` (when `allowDeviceCredentials` is `true`)

Migration recommendations:

1. Keep existing aliases on `.biometryAny` for compatibility unless stricter behavior is required.
2. To adopt `.biometryCurrentSet`, roll keys by alias (`deleteKeys` then `createKeys` with `biometricStrength: 'strong'`).
3. Communicate to users that `.biometryCurrentSet` keys are invalidated after biometric enrollment changes and require key re-enrollment.

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

- [API Reference](../api/index.md) - Basic usage and API reference
- [Key Alias Security](./key-alias-security.md) - Security considerations for key aliases
- [Logging Guide](./logging.md) - Debugging and troubleshooting