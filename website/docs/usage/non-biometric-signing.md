---
title: Non-Biometric Signing (No Prompts)
sidebar_label: Non-Biometric Signing
---

Create Keychain/Keystore-backed RSA or EC keys that sign **without any biometric prompt** — the modern replacement for the `react-native-rsa-native` use case. The private key never leaves the Keychain/Keystore and is hardware-backed where the platform supports it (Android TEE/StrongBox for both key types, iOS Secure Enclave for EC keys; iOS RSA keys reside in the regular Keychain); only the user-authentication requirement is removed.

```typescript
import {
  createKeysWithOptions,
  keyExists,
  getPublicKey,
  sign,
  deleteKeys,
  SignatureAlgorithm,
} from '@sbaiahmed1/react-native-biometrics';

const deviceBoundSigningExample = async () => {
  // Create a hardware-backed RSA-2048 key that never prompts
  await createKeysWithOptions({
    keyAlias: 'server-auth-key',
    keyType: 'rsa2048',
    requireAuthentication: false,
  });

  // Prompt-free existence check
  if (await keyExists('server-auth-key')) {
    // Public key as base64 X.509 SubjectPublicKeyInfo DER on both platforms —
    // consumable directly by e.g. `openssl pkey -pubin -inform DER`
    const { publicKey } = await getPublicKey('server-auth-key');
    await sendPublicKeyToServer(publicKey);
  }

  // Sign a payload — no prompt appears
  const result = await sign({
    keyAlias: 'server-auth-key',
    data: 'payload-to-sign',
    algorithm: SignatureAlgorithm.SHA512withRSA, // optional, defaults to SHA-256
  });

  if (result.success) {
    console.log('✍️ Signature:', result.signature);
  }
};
```

`sign()` never prompts: called on a normal biometric-gated key it resolves with `{ success: false, errorCode: 'KEY_REQUIRES_AUTHENTICATION' }` — use `signWithOptions()` for those. Conversely, `signWithOptions()` on a no-auth key signs silently with `authType: 0`.

> 📖 **See the [Cryptographic Keys Guide](../guides/cryptographic-keys.md) for algorithm constraints (SHA-512 availability on Android/StrongBox), key accessibility, and public key format details.**
