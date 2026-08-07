---
title: Configuration Methods
sidebar_label: Configuration
---

## `configureKeyAlias()`

Configures a custom key alias for biometric key storage. This enhances security by allowing app-specific key aliases instead of using a shared hardcoded alias.

```typescript
const configureKeyAlias = (keyAlias: string): Promise<void> => {
};
```

```javascript
import { configureKeyAlias } from '@sbaiahmed1/react-native-biometrics';

// Configure a custom key alias
await configureKeyAlias('com.myapp.biometric.main');
```

## `getDefaultKeyAlias()`

Returns the current default key alias. If no custom alias is configured, returns an app-specific default based on bundle ID (iOS) or package name (Android).

```javascript
import { getDefaultKeyAlias } from '@sbaiahmed1/react-native-biometrics';

const defaultAlias = await getDefaultKeyAlias();
console.log('Current key alias:', defaultAlias);
```

## `configure()`

Configures the library with a configuration object.

```typescript
const configure = (config: BiometricConfig): Promise<void> => {
};
```

```javascript
import { configure } from '@sbaiahmed1/react-native-biometrics';

await configure({
  keyAlias: 'com.myapp.biometric.main'
});
```
