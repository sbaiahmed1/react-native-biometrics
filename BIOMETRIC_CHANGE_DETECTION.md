# Biometric Change Detection

This feature allows you to subscribe to biometric changes on the device, such as when biometrics are enabled/disabled, enrolled/unenrolled, or when hardware availability changes.

## Overview

The biometric change detection system monitors the device's biometric state and emits events when changes occur. This is useful for:

- Detecting when users add or remove biometric enrollments
- Monitoring biometric hardware availability
- Responding to biometric security changes in real-time
- Updating UI based on biometric capabilities

## API

### Functions

#### `subscribeToBiometricChanges(callback: (event: BiometricChangeEvent) => void): EventSubscription`

Subscribes to biometric change events.

**Parameters:**
- `callback`: Function that will be called when biometric changes are detected

**Returns:**
- `EventSubscription`: Subscription object that can be used to unsubscribe

#### `unsubscribeFromBiometricChanges(subscription: EventSubscription): void`

Unsubscribes from biometric change events.

**Parameters:**
- `subscription`: The subscription object returned from `subscribeToBiometricChanges`

### Types

#### `BiometricChangeEvent`

```typescript
interface BiometricChangeEvent {
  timestamp: number;        // Unix timestamp when the change occurred
  changeType: string;       // Type of change (see Change Types below)
  biometryType: string;     // Current biometry type available
  available: boolean;       // Whether biometrics are currently available
  enrolled: boolean;        // Whether biometrics are enrolled
}
```

#### Change Types

- `BIOMETRIC_ENABLED`: Biometrics became available
- `BIOMETRIC_DISABLED`: Biometrics became unavailable
- `ENROLLMENT_CHANGED`: Biometric enrollments were added or removed
- `HARDWARE_CHANGED`: Biometric hardware type changed
- `STATE_CHANGED`: General state change

## Usage Example

```typescript
import React, { useEffect, useState } from 'react';
import {
  subscribeToBiometricChanges,
  unsubscribeFromBiometricChanges,
  BiometricChangeEvent,
} from 'react-native-biometrics';
import type { EventSubscription } from 'react-native';

const MyComponent = () => {
  const [subscription, setSubscription] = useState<EventSubscription | null>(null);

  const handleBiometricChange = (event: BiometricChangeEvent) => {
    console.log('Biometric change detected:', {
      changeType: event.changeType,
      biometryType: event.biometryType,
      available: event.available,
      enrolled: event.enrolled,
      timestamp: new Date(event.timestamp).toISOString(),
    });

    // Handle different change types
    switch (event.changeType) {
      case 'BIOMETRIC_ENABLED':
        console.log('Biometrics were enabled!');
        break;
      case 'BIOMETRIC_DISABLED':
        console.log('Biometrics were disabled!');
        break;
      case 'ENROLLMENT_CHANGED':
        console.log('Biometric enrollments changed!');
        break;
      // ... handle other cases
    }
  };

  useEffect(() => {
    // Start listening for biometric changes
    const sub = subscribeToBiometricChanges(handleBiometricChange);
    setSubscription(sub);

    // Cleanup on unmount
    return () => {
      if (sub) {
        unsubscribeFromBiometricChanges(sub);
      }
    };
  }, []);

  return (
    // Your component JSX
  );
};
```

## Platform-Specific Behavior

### iOS

- Monitors biometric availability using Local Authentication framework
- Detects changes when app becomes active (foreground)
- Tracks Face ID, Touch ID, and Optic ID availability
- Monitors enrollment count changes

### Android

- Uses BiometricManager to monitor biometric state
- Polls biometric status every 2 seconds when active
- Detects fingerprint, face, and iris biometric changes
- Monitors hardware availability and enrollment status

## Best Practices

1. **Always unsubscribe**: Make sure to unsubscribe when your component unmounts to prevent memory leaks.

2. **Check current state on mount**: When your component mounts, you may want to call `isSensorAvailable()` to get the current biometric state, as the change listener only fires on actual changes.

3. **Debounce rapid changes**: On some devices, multiple events might fire in quick succession. Consider debouncing your event handler if needed.

4. **User experience**: Consider showing user-friendly messages when biometric changes are detected, especially for security-related changes.

5. **Error handling**: Wrap your event handler in try-catch blocks to handle any unexpected errors gracefully.

## Example Use Cases

### Security Monitoring

```typescript
const handleBiometricChange = (event: BiometricChangeEvent) => {
  if (event.changeType === 'BIOMETRIC_DISABLED') {
    // Biometrics were disabled - might want to require re-authentication
    showSecurityAlert('Biometric authentication has been disabled');
  }
};
```

### UI Updates

```typescript
const [biometricAvailable, setBiometricAvailable] = useState(false);

const handleBiometricChange = (event: BiometricChangeEvent) => {
  setBiometricAvailable(event.available && event.enrolled);
};

// In your render method
{biometricAvailable && (
  <TouchableOpacity onPress={authenticateWithBiometrics}>
    <Text>Use Biometric Authentication</Text>
  </TouchableOpacity>
)}
```

### Analytics

```typescript
const handleBiometricChange = (event: BiometricChangeEvent) => {
  // Track biometric usage patterns
  analytics.track('biometric_change', {
    changeType: event.changeType,
    biometryType: event.biometryType,
    available: event.available,
    enrolled: event.enrolled,
  });
};
```

## Troubleshooting

### Events Not Firing

1. Ensure you're properly subscribing to events
2. Check that the subscription is not being garbage collected
3. Verify that biometric settings are actually changing on the device

### Multiple Events

1. Some devices may fire multiple events for a single change
2. Consider debouncing or deduplicating events based on timestamp
3. Use the `changeType` field to filter relevant events

### Performance

1. On Android, the polling interval is 2 seconds - this balances responsiveness with battery usage
2. Unsubscribe when not needed to save resources
3. Avoid heavy processing in the event handler

## Migration from Manual Polling

If you were previously manually checking biometric status, you can replace that with event-driven updates:

```typescript
// Old approach - manual polling
setInterval(async () => {
  const result = await isSensorAvailable();
  // Update UI based on result
}, 5000);

// New approach - event-driven
subscribeToBiometricChanges((event) => {
  // Update UI based on event
});
```

This provides better performance, battery life, and user experience.
