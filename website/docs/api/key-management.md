---
title: Key Management
---

**Important note:** RSA keys are stored in the regular keychain (not Secure Enclave on iOS) and may have different security characteristics compared to EC256 keys. For maximum security, EC256 keys are recommended as they can leverage hardware-backed storage when available.

## `createKeys()`

Generates cryptographic keys for secure biometric operations. Optionally accepts a custom key alias, key type, and additional options.

```typescript
const createKeys = (
  keyAlias?: string,
  keyType?: 'ec256' | 'rsa2048',
  biometricStrength?: BiometricStrength,
  allowDeviceCredentials?: boolean,
  failIfExists?: boolean
): Promise<KeyResult> => {
};

type KeyResult = {
  publicKey: string;         // Generated public key
}
```

**Parameters:**

- `keyAlias` (optional): Custom key identifier. If not provided, uses the configured default alias.
- `keyType` (optional): Type of cryptographic key to generate. Defaults to `'ec256'` on iOS and `'rsa2048'` on Android.
- `biometricStrength` (optional): Uses `BiometricStrength.Strong` or `BiometricStrength.Weak`. On iOS, `Strong` binds new keys to `.biometryCurrentSet`; `Weak`/unset uses `.biometryAny` for backward compatibility.
- `allowDeviceCredentials` (optional, default `false`): When `true`, the key can be unlocked by biometrics OR device credentials (PIN/passcode). On iOS this uses `.userPresence` to allow passcode fallback; on Android this requires API 30+.
- `failIfExists` (optional, default `false`): When `true`, rejects with `KEY_ALREADY_EXISTS` if a key with the alias already exists instead of overwriting it.

**iOS migration guidance**

- Existing keys keep the access-control policy they were created with; this setting only affects newly created keys.
- If you switch iOS key creation to `BiometricStrength.Strong`, recreate keys (`deleteKeys` + `createKeys`) to migrate.
- Keys created with `.biometryCurrentSet` are invalidated when biometric enrollment changes.

> 📖 **For detailed key type information, security considerations, and advanced usage patterns, see the [Cryptographic Keys Guide](../guides/cryptographic-keys.md)**

**Platform Behavior Notes:**

| Behavior | iOS | Android |
|----------|-----|---------|
| **Biometric prompt during `createKeys()`** | Silent - no prompt shown | Silent - no prompt shown |
| **Key storage** | EC256 uses Secure Enclave; RSA uses regular Keychain | Android Keystore (hardware-backed when available) |
| **Authentication requirement** | Enforced when the key is used (e.g. `verifyKeySignature()`) | Enforced when the key is used (e.g. `verifyKeySignature()`) |
| **Requirement at creation time** | A device passcode must be set | A strong (Class 3) biometric must be enrolled — or a device credential when `allowDeviceCredentials: true` (API 30+) |

On both platforms, key generation is silent — no biometric prompt appears during `createKeys()`. Setting `setUserAuthenticationRequired(true)` (Android) or a Keychain access control (iOS) means authentication is required to *use* the private key, so the biometric prompt appears during signing operations like `verifyKeySignature()` / `signWithOptions()`, not during key creation.

One platform difference to be aware of: Android refuses to generate an auth-bound key unless a strong (Class 3) biometric is enrolled, rejecting with `CREATE_KEYS_ERROR: "At least one biometric must be enrolled"`. Devices whose only biometric is a weak/convenience one (e.g. camera-based face unlock on many budget devices) can only create keys with `allowDeviceCredentials: true` (Android 11+ / API 30+), which lets the device PIN/pattern/password unlock the key.

**Example:**

```javascript
import { createKeys } from '@sbaiahmed1/react-native-biometrics';

// Create keys with platform defaults
const result = await createKeys();
console.log('Keys created:', result.publicKey);

// Create keys with specific type
const rsaKeys = await createKeys(undefined, 'rsa2048');
const ecKeys = await createKeys(undefined, 'ec256');
```

## `createKeysWithOptions()`

Options-object variant of `createKeys` with one additional capability: `requireAuthentication: false` creates a Keystore/Keychain-backed key that can sign **without any biometric prompt** (see [`sign()`](#sign)).

```typescript
const createKeysWithOptions = (options?: {
  keyAlias?: string;
  keyType?: 'ec256' | 'rsa2048';
  requireAuthentication?: boolean;   // default true (same behavior as createKeys)
  biometricStrength?: BiometricStrength;   // ignored when requireAuthentication is false
  allowDeviceCredentials?: boolean;        // ignored when requireAuthentication is false
  failIfExists?: boolean;
}): Promise<KeyResult> => {
};
```

With `requireAuthentication: false`:

- The private key remains non-exportable in the Android Keystore / iOS Keychain, but using it never requires user authentication. Non-exportability is guaranteed on all paths; hardware residency depends on platform and key type — Android keys are TEE/StrongBox-backed, iOS EC keys use the Secure Enclave on device, while iOS RSA keys live in the regular Keychain without hardware protection.
- No biometric enrollment or passcode is required at creation time on either platform (iOS uses `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, so the key is only usable while the device is unlocked).

**Example:**

```javascript
const result = await createKeysWithOptions({
  keyAlias: 'server-auth-key',
  keyType: 'rsa2048',
  requireAuthentication: false,
});
```

## `keyExists()`

Checks whether a key exists for the alias without triggering any biometric prompt.

```typescript
const keyExists = (keyAlias?: string): Promise<boolean> => {
};
```

## `getPublicKey()`

Retrieves the public key without triggering any biometric prompt. Unlike the `publicKey` returned by `createKeys`, the result is base64-encoded **X.509 SubjectPublicKeyInfo DER on both platforms and for both key types**, so it can be consumed directly by standard tooling (`openssl pkey -pubin -inform DER`). Rejects with `KEY_NOT_FOUND` if no key exists. On iOS, a biometric-gated key may reject with `KEY_REQUIRES_AUTHENTICATION` — the Keychain can refuse even a non-interactive lookup of an auth-bound key — so for those keys capture the `publicKey` returned by `createKeys` at creation time instead (Android is unaffected).

```typescript
const getPublicKey = (keyAlias?: string): Promise<{
  publicKey: string;   // Base64 X.509 SPKI DER
  keyType?: string;    // 'rsa2048' | 'ec256'
}> => {
};
```

## `sign()`

Signs data **without any user authentication prompt**. Only works with keys created via `createKeysWithOptions({ requireAuthentication: false })`; on a biometric-gated key it never prompts — it resolves with `{ success: false, errorCode: 'KEY_REQUIRES_AUTHENTICATION' }` (use `signWithOptions()` for those keys).

```typescript
const sign = (options: {
  keyAlias?: string;
  data: string;
  inputEncoding?: InputEncoding;      // 'utf8' (default) | 'base64'
  algorithm?: SignatureAlgorithm;     // defaults to the SHA-256 variant for the key type
}): Promise<SignatureResult> => {
};

enum SignatureAlgorithm {
  SHA256withRSA = 'SHA256withRSA',
  SHA512withRSA = 'SHA512withRSA',
  SHA256withECDSA = 'SHA256withECDSA',
  SHA512withECDSA = 'SHA512withECDSA',
}
```

**Error codes:** `KEY_NOT_FOUND`, `KEY_REQUIRES_AUTHENTICATION`, `INVALID_ALGORITHM` (algorithm/key-type mismatch), `UNSUPPORTED_ALGORITHM` (e.g. SHA-512 on an Android key minted before SHA-512 support or inside StrongBox), `INVALID_INPUT_ENCODING`.

**Example:**

```javascript
const result = await sign({
  keyAlias: 'server-auth-key',
  data: payload,
  algorithm: SignatureAlgorithm.SHA512withRSA,
});
if (result.success) {
  console.log('Signature:', result.signature);
}
```

## `deleteKeys()`

Deletes previously created cryptographic keys. Optionally accepts a custom key alias.

```typescript
const deleteKeys = (keyAlias?: string): Promise<DeleteResult> => {
};

type DeleteResult = {
  success: boolean;          // Whether deletion succeeded
}
```

**Example:**

```javascript
import { deleteKeys } from '@sbaiahmed1/react-native-biometrics';

// Delete keys with default (configured) alias
try {
  const result = await deleteKeys();
  console.log('Keys deleted successfully');
} catch (error) {
  console.error('Error deleting keys:', error);
}

// Delete keys with custom alias
try {
  const result = await deleteKeys('com.myapp.biometric.backup');
  console.log('Keys deleted with custom alias');
} catch (error) {
  console.error('Error deleting keys:', error);
}
```

## `getAllKeys()`

Retrieves all stored cryptographic keys, optionally filtered by a custom alias.

```typescript
const getAllKeys = (customAlias?: string): Promise<GetAllKeysResult> => {
};

type GetAllKeysResult = {
  keys: Array<{
    alias: string;           // Key identifier/alias
    publicKey: string;       // Base64 encoded public key
  }>;
}
```

**Usage Examples:**

```typescript
// Get all keys
const allKeys = await getAllKeys();
console.log(`Found ${allKeys.keys.length} keys`);

// Get keys for a specific custom alias
const customKeys = await getAllKeys('my-custom-alias');
console.log(`Found ${customKeys.keys.length} keys with custom alias`);

// Omitting the alias retrieves keys for the default (configured) alias
const defaultKeys = await getAllKeys();
console.log(`Found ${defaultKeys.keys.length} keys with default alias`);
```
