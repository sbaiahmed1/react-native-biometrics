---
title: Key Integrity Validation
sidebar_label: Key Integrity
---

## `validateKeyIntegrity()`

```typescript
const validateKeyIntegrity = (keyAlias?: string): Promise<KeyIntegrityResult> => {
};
```

Performs comprehensive validation of key integrity including format checks, accessibility tests, signature validation, and hardware backing verification. On Android API 31+, the result also reports `strongBoxBacked` in `integrityChecks` when the backing type can be distinguished.

## `verifyKeySignature()`

```typescript
const verifyKeySignature = (
  keyAlias: string = '',   // pass '' to use the default (configured) alias
  data: string,
  promptTitle?: string,
  promptSubtitle?: string,
  cancelButtonText?: string,
  returnAuthType?: boolean
): Promise<SignatureResult> => {
};
```

Generates a cryptographic signature for the provided data using the specified key.

- `data`: The data to be signed.
- `keyAlias` (optional): The alias of the key to use for signing.
- `promptTitle` (optional): Title text displayed in the signature prompt dialog.
- `promptSubtitle` (optional): Subtitle text providing additional context in the prompt dialog (Android only).
- `cancelButtonText` (optional): Text for the cancel button in the prompt dialog (Android only).
- `returnAuthType` (optional): When `true`, includes `authType` in the result indicating how the user authenticated.
- Returns a `SignatureResult` with `success`, `signature`, `error`, `errorCode`, and optionally `authType` (when `returnAuthType` is `true`).

## `signWithOptions()`

Signs data with advanced security controls, including the ability to disable device credential fallback.

```typescript
import { InputEncoding, BiometricStrength } from '@sbaiahmed1/react-native-biometrics';

type SignatureOptions = {
  keyAlias?: string;                      // Key alias to use for signing
  data: string;                           // Data to sign
  inputEncoding?: InputEncoding;          // Input encoding: InputEncoding.UTF8 (default) or InputEncoding.Base64
  promptTitle?: string;                   // Prompt title
  promptSubtitle?: string;                // Prompt subtitle (Android only)
  cancelButtonText?: string;              // Cancel button text
  biometricStrength?: BiometricStrength;  // Biometric strength (Android only)
  disableDeviceFallback?: boolean;        // Prevent PIN/pattern fallback (Android only)
  returnAuthType?: boolean;               // Include authType in result (see AuthType enum)
};

// InputEncoding enum values:
// - InputEncoding.UTF8: Data is treated as a UTF-8 string (default)
// - InputEncoding.Base64: Data is decoded from base64 before signing (for WebAuthn/binary data)
```

**Example - Requiring biometrics only (no PIN fallback):**

```javascript
import { signWithOptions, BiometricStrength, InputEncoding } from '@sbaiahmed1/react-native-biometrics';

// High-security signing - biometrics only, no PIN fallback
const result = await signWithOptions({
  keyAlias: 'transaction_key',
  data: JSON.stringify({ amount: 1000, recipient: 'user123' }),
  promptTitle: 'Authorize Transaction',
  promptSubtitle: 'Use biometrics to sign this transaction',
  biometricStrength: BiometricStrength.Strong,
  disableDeviceFallback: true,  // Fail if biometrics unavailable
});

if (result.success) {
  console.log('Signature:', result.signature);
} else if (result.errorCode === 'BIOMETRIC_NOT_AVAILABLE') {
  console.log('Biometrics required but not available');
}
```

**When to use `disableDeviceFallback: true`:**

- High-value financial transactions
- Multi-factor authentication where biometric is the second factor
- Operations requiring proof of physical presence
- Security-critical actions that must not fall back to knowledge-based authentication

**Using base64 input for WebAuthn/binary data:**

```javascript
import { signWithOptions, InputEncoding } from '@sbaiahmed1/react-native-biometrics';

// When your challenge is binary data (e.g., from WebAuthn)
const binaryChallenge = 'SGVsbG8gV29ybGQh'; // base64-encoded bytes

const result = await signWithOptions({
  keyAlias: 'webauthn_key',
  data: binaryChallenge,
  inputEncoding: InputEncoding.Base64,  // Decode as binary, not UTF-8
  promptTitle: 'Authenticate',
});
```

This avoids double-encoding issues when working with WebAuthn challenges or other binary data that's already base64-encoded.

## `validateSignature()`

```typescript
const validateSignature = (
  data: string,
  signature: string,
  keyAlias?: string
): Promise<SignatureValidationResult> => {
};
```

Validates a signature against the original data using the public key.

## `sha256()`

Computes a SHA-256 hash of the provided data using native platform cryptography.

```typescript
const sha256 = (
  data: string,
  inputEncoding?: 'utf8' | 'base64'
): Promise<Sha256Result> => {
};

type Sha256Result = {
  hash: string;    // Base64-encoded SHA-256 hash
  error?: string;  // Error message if hashing failed
}
```

**Parameters:**

- `data`: The data to hash.
- `inputEncoding` (optional, default `'utf8'`): How to interpret the input data. Use `'base64'` if the data is already base64-encoded binary.

**Example:**

```javascript
import { sha256 } from '@sbaiahmed1/react-native-biometrics';

const result = await sha256('Hello, world!');
console.log('Hash:', result.hash); // Base64-encoded SHA-256 hash
```

## `getKeyAttributes()`

```typescript
const getKeyAttributes = (keyAlias?: string): Promise<KeyAttributesResult> => {
};
```

Retrieves detailed attributes and security properties of the specified key.

**Example:**

```javascript
import {
  validateKeyIntegrity,
  verifyKeySignature,
  validateSignature,
  getKeyAttributes
} from '@sbaiahmed1/react-native-biometrics';

// Validate key integrity
const integrityResult = await validateKeyIntegrity('my-key');
console.log('Key valid:', integrityResult.valid);
console.log('Hardware backed:', integrityResult.integrityChecks.hardwareBacked);
console.log('StrongBox backed:', integrityResult.integrityChecks.strongBoxBacked); // Android API 31+ only

// Generate and validate signature
const data = 'Hello, secure world!';
const signatureResult = await verifyKeySignature('my-key', data);
if (signatureResult.success) {
  const validationResult = await validateSignature(data, signatureResult.signature, 'my-key');
  console.log('Signature valid:', validationResult.valid);
}

// Get key attributes
const attributes = await getKeyAttributes('my-key');
if (attributes.exists) {
  console.log('Algorithm:', attributes.attributes.algorithm);
  console.log('Key size:', attributes.attributes.keySize);
  console.log('Security level:', attributes.attributes.securityLevel);
}
```
