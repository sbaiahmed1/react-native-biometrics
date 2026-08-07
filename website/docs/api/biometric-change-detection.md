---
title: Biometric Change Detection
---

Monitor real-time changes to device biometric settings and enrollments.

## `subscribeToBiometricChanges()`

Subscribes to biometric change events. Returns an event subscription that can be used to unsubscribe later.

```typescript
const subscribeToBiometricChanges = (
  callback: (event: BiometricChangeEvent) => void
): EventSubscription => {
};
```

**Parameters:**

- `callback`: Function called when biometric changes are detected

**Returns:** `EventSubscription` - Subscription object for unsubscribing

**Example:**

```javascript
import { subscribeToBiometricChanges } from '@sbaiahmed1/react-native-biometrics';

const subscription = subscribeToBiometricChanges((event) => {
  console.log('Change type:', event.changeType);
  console.log('Available:', event.available);
  console.log('Biometry type:', event.biometryType);
});
```

## `unsubscribeFromBiometricChanges()`

Unsubscribes from biometric change events to prevent memory leaks.

```typescript
const unsubscribeFromBiometricChanges = (subscription: EventSubscription): void => {
};
```

**Parameters:**

- `subscription`: The subscription object returned from `subscribeToBiometricChanges`

**Example:**

```javascript
import { unsubscribeFromBiometricChanges } from '@sbaiahmed1/react-native-biometrics';

unsubscribeFromBiometricChanges(subscription);
```

## `startBiometricChangeDetection()`

Starts monitoring for biometric changes. Must be called explicitly to begin detection after subscribing.

```typescript
const startBiometricChangeDetection = (): Promise<void> => {
};
```

**Returns:** `Promise<void>` - Resolves when detection has started

**Example:**

```javascript
import { startBiometricChangeDetection } from '@sbaiahmed1/react-native-biometrics';

await startBiometricChangeDetection();
console.log('Monitoring biometric changes...');
```

## `stopBiometricChangeDetection()`

Stops monitoring for biometric changes. Useful for conserving battery and resources.

```typescript
const stopBiometricChangeDetection = (): Promise<void> => {
};
```

**Returns:** `Promise<void>` - Resolves when detection has stopped

**Example:**

```javascript
import { stopBiometricChangeDetection } from '@sbaiahmed1/react-native-biometrics';

await stopBiometricChangeDetection();
console.log('Stopped monitoring');
```

## `BiometricChangeEvent`

```typescript
interface BiometricChangeEvent {
  timestamp: number;        // Unix epoch milliseconds when the change occurred
  changeType: string;       // Type of change (see below)
  biometryType: string;     // Current biometry type
  available: boolean;       // Whether biometrics are available
  enrolled: boolean;        // Whether biometrics are enrolled
}
```

**Change Types:**

- `BIOMETRIC_ENABLED`: Biometrics became available
- `BIOMETRIC_DISABLED`: Biometrics became unavailable
- `ENROLLMENT_CHANGED`: Biometric enrollments added/removed
- `HARDWARE_UNAVAILABLE`: Biometric hardware changed
- `STATE_CHANGED`: General state change

**Complete Example:**

```javascript
import React, { useEffect, useState } from 'react';
import {
  subscribeToBiometricChanges,
  unsubscribeFromBiometricChanges,
  startBiometricChangeDetection,
  stopBiometricChangeDetection
} from '@sbaiahmed1/react-native-biometrics';

const MyComponent = () => {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Subscribe to changes
    const sub = subscribeToBiometricChanges((event) => {
      console.log('Biometric change:', event.changeType);

      if (event.changeType === 'BIOMETRIC_DISABLED') {
        alert('Biometrics were disabled on this device');
      }
    });
    setSubscription(sub);

    // Start detection
    startBiometricChangeDetection();

    // Cleanup on unmount
    return () => {
      if (sub) {
        unsubscribeFromBiometricChanges(sub);
      }
      stopBiometricChangeDetection();
    };
  }, []);

  return <View>{/* Your UI */}</View>;
};
```

**For comprehensive documentation including platform-specific behavior, implementation details, and best practices, see the [Biometric Change Detection Guide](../guides/biometric-change-detection.md).**
