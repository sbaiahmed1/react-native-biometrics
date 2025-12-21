# Biometric Change Detection

This feature allows you to subscribe to biometric changes on the device, such as when biometrics are enabled/disabled, enrolled/unenrolled, or when hardware availability changes.

## Overview

The biometric change detection system monitors the device's biometric state and emits events when changes occur. This is useful for:

- Detecting when users add or remove biometric enrollments
- Monitoring biometric hardware availability
- Responding to biometric security changes in real-time
- Updating UI based on biometric capabilities

**New Architecture Support**: This implementation uses React Native's new architecture (TurboModules) with codegen-generated EventEmitters, while maintaining backward compatibility through dual event emission.

## API

### Functions

#### `subscribeToBiometricChanges(callback: (event: BiometricChangeEvent) => void): EventSubscription`

Subscribes to biometric change events. Note that subscribing alone does not start detection - you must call `startBiometricChangeDetection()` to begin monitoring.

**Parameters:**
- `callback`: Function that will be called when biometric changes are detected

**Returns:**
- `EventSubscription`: Subscription object that can be used to unsubscribe

**Example:**
```typescript
const subscription = subscribeToBiometricChanges((event) => {
  console.log('Biometric change:', event);
});
```

#### `unsubscribeFromBiometricChanges(subscription: EventSubscription): void`

Unsubscribes from biometric change events.

**Parameters:**
- `subscription`: The subscription object returned from `subscribeToBiometricChanges`

**Example:**
```typescript
unsubscribeFromBiometricChanges(subscription);
```

#### `startBiometricChangeDetection(): Promise<void>`

Starts monitoring for biometric changes. Must be called explicitly to begin detection.

**Returns:**
- `Promise<void>`: Resolves when detection has started

**Example:**
```typescript
await startBiometricChangeDetection();
console.log('Detection started');
```

#### `stopBiometricChangeDetection(): Promise<void>`

Stops monitoring for biometric changes. Useful for conserving battery and resources when detection is not needed.

**Returns:**
- `Promise<void>`: Resolves when detection has stopped

**Example:**
```typescript
await stopBiometricChangeDetection();
console.log('Detection stopped');
```

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

### Complete Example with Manual Control

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import {
  subscribeToBiometricChanges,
  unsubscribeFromBiometricChanges,
  startBiometricChangeDetection,
  stopBiometricChangeDetection,
  BiometricChangeEvent,
} from 'react-native-biometrics';
import type { EventSubscription } from 'react-native';

const MyComponent = () => {
  const [subscription, setSubscription] = useState<EventSubscription | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleBiometricChange = useCallback((event: BiometricChangeEvent) => {
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
        Alert.alert('Biometrics Enabled', 'Biometric authentication is now available');
        break;
      case 'BIOMETRIC_DISABLED':
        Alert.alert('Biometrics Disabled', 'Biometric authentication is no longer available');
        break;
      case 'ENROLLMENT_CHANGED':
        Alert.alert('Enrollment Changed', 'Biometric enrollments have been modified');
        break;
      case 'STATUS_CHANGED':
        console.log('Biometric status changed');
        break;
    }
  }, []);

  useEffect(() => {
    // Subscribe to events on mount
    const sub = subscribeToBiometricChanges(handleBiometricChange);
    setSubscription(sub);

    // Cleanup on unmount
    return () => {
      if (sub) {
        unsubscribeFromBiometricChanges(sub);
      }
      // Stop detection when component unmounts
      stopBiometricChangeDetection();
    };
  }, [handleBiometricChange]);

  const handleStartDetection = async () => {
    try {
      await startBiometricChangeDetection();
      setIsDetecting(true);
      console.log('Detection started');
    } catch (error) {
      console.error('Failed to start detection:', error);
    }
  };

  const handleStopDetection = async () => {
    try {
      await stopBiometricChangeDetection();
      setIsDetecting(false);
      console.log('Detection stopped');
    } catch (error) {
      console.error('Failed to stop detection:', error);
    }
  };

  return (
    <View>
      <Text>Biometric Change Detection</Text>
      <Text>Status: {isDetecting ? 'Detecting' : 'Stopped'}</Text>

      <TouchableOpacity onPress={handleStartDetection}>
        <Text>Start Detection</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleStopDetection}>
        <Text>Stop Detection</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Simplified Auto-Start Example

If you want detection to start automatically when your component mounts:

```typescript
useEffect(() => {
  // Subscribe and start detection
  const sub = subscribeToBiometricChanges(handleBiometricChange);
  startBiometricChangeDetection();

  // Cleanup on unmount
  return () => {
    unsubscribeFromBiometricChanges(sub);
    stopBiometricChangeDetection();
  };
}, [handleBiometricChange]);
```

## Platform-Specific Behavior

### iOS

iOS has a sophisticated biometric change detection implementation using Apple's Local Authentication framework:

**Core Technologies:**
- Uses `LAContext` to check biometric availability
- Monitors `UIApplication.didBecomeActiveNotification` to detect when app returns to foreground
- Tracks `evaluatedPolicyDomainState` - Apple's built-in mechanism for detecting enrollment changes
- Automatically starts/stops detection when event listeners are added/removed

**Enhanced State Detection:**
The iOS implementation tracks multiple state indicators:

1. **Availability** (`available`): Whether biometrics can be used
2. **Biometry Type** (`biometryType`): Face ID, Touch ID, or Optic ID (iOS 17+)
3. **Domain State** (`domainState`): Cryptographic hash that changes when enrollments change
4. **Enrolled Count** (`enrolledCount`): Whether any biometrics are enrolled (1 or 0)

**Change Type Detection:**
- `BIOMETRIC_ENABLED`: Device transitions from no biometrics to having biometrics available
- `BIOMETRIC_DISABLED`: Device transitions from biometrics available to unavailable
- `ENROLLMENT_CHANGED`: Domain state changes (fingerprints/faces added or removed)
- `HARDWARE_UNAVAILABLE`: Biometry type changes (hardware replaced)

**Advantages over Android:**
- **Better enrollment detection**: iOS's `evaluatedPolicyDomainState` is a cryptographic hash that changes whenever ANY enrollment is added/removed, making it much more reliable than Android's BiometricManager
- **Event-driven**: Both platforms now use lifecycle-based event detection for battery efficiency
- **Auto-lifecycle**: Automatically starts when listeners subscribe and stops when they unsubscribe

**How It Works:**
When you call `subscribeToBiometricChanges()`, the iOS native module automatically:
1. Captures the initial biometric state
2. Sets up a notification observer for `UIApplication.didBecomeActiveNotification`
3. Checks for changes every time the app becomes active
4. Emits events when domain state or availability changes

### Android

Our Android implementation uses advanced state tracking to detect biometric changes:

**Core Technologies:**
- Uses `BiometricManager` API to monitor biometric state
- Monitors `LifecycleEventListener` to detect when app returns to foreground (similar to iOS)
- Checks biometric state when app resumes via `onHostResume()` callback
- Tracks biometric-protected keys in Android KeyStore as a proxy for enrollment changes
- Monitors hardware availability, enrollment status, and status codes

**Enhanced State Detection:**
The implementation tracks multiple state indicators to maximize change detection:

1. **Availability** (`available`): Whether biometrics can be used (BIOMETRIC_SUCCESS)
2. **Enrollment** (`enrolled`): Whether any biometrics are enrolled
3. **Key Count** (`keyCount`): Number of biometric-protected keys in KeyStore
4. **Status Code** (`statusCode`): Raw BiometricManager status code

**Change Type Detection:**
- `BIOMETRIC_ENABLED`: Device transitions from no biometrics to having biometrics available
- `BIOMETRIC_DISABLED`: Device transitions from biometrics available to unavailable
- `ENROLLMENT_CHANGED`: KeyStore biometric key count changes
- `STATUS_CHANGED`: BiometricManager status code changes
- `UNKNOWN_CHANGE`: Other state changes detected

**Platform Limitations:**
Android's `BiometricManager.canAuthenticate()` has limitations:
- Returns same status (BIOMETRIC_SUCCESS) whether device has 1 or 5 fingerprints enrolled
- Cannot detect when additional fingerprints are added to an already-enrolled device
- Can only reliably detect:
  - First enrollment (None → Enrolled)
  - Complete removal of all enrollments (Enrolled → None)
  - Biometric enable/disable state changes

To work around these limitations, we track additional state like KeyStore key counts, but some enrollment changes may still not be detectable.

## Best Practices

1. **Always unsubscribe**: Make sure to unsubscribe when your component unmounts to prevent memory leaks.

2. **Platform-Specific Start/Stop**:
   - **Android**: Must explicitly call `startBiometricChangeDetection()` to begin monitoring
   - **iOS**: Automatically starts when you subscribe (calls to start/stop on iOS are optional for consistency)
   - For cross-platform apps, calling `startBiometricChangeDetection()` after subscribing works on both platforms

3. **Check current state on mount**: When your component mounts, you may want to call `isSensorAvailable()` to get the current biometric state, as the change listener only fires on actual changes.

4. **Debounce rapid changes**: On some devices, multiple events might fire in quick succession. Consider debouncing your event handler if needed.

5. **User experience**: Consider showing user-friendly messages when biometric changes are detected, especially for security-related changes.

6. **Error handling**: Wrap your event handler in try-catch blocks to handle any unexpected errors gracefully.

7. **Battery conservation**: Both platforms use lifecycle-based detection (event-driven, not polling) for efficient battery usage

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

1. Both platforms use lifecycle-based detection (checking on app resume) - no continuous polling needed
2. Unsubscribe when not needed to save resources
3. Avoid heavy processing in the event handler

## Migration from Manual Polling

If you were previously manually checking biometric status, you can replace that with lifecycle-based event detection:

```typescript
// Old approach - manual polling
setInterval(async () => {
  const result = await isSensorAvailable();
  // Update UI based on result
}, 5000);

// New approach - lifecycle-based detection
subscribeToBiometricChanges((event) => {
  // Update UI based on event
  // Automatically checked when app resumes
});
startBiometricChangeDetection();
```

This provides better performance, battery life, and user experience by checking only when the app comes to the foreground.

## Technical Implementation

### Architecture Overview

This biometric change detection feature is built using React Native's **new architecture** (TurboModules + Fabric) with backward compatibility for the old architecture.

#### Key Components

**1. TypeScript Codegen Spec** (`NativeReactNativeBiometrics.ts`):
```typescript
export interface Spec extends TurboModule {
  // Event emitter using codegen-generated EventEmitter type
  readonly onBiometricChange: EventEmitter<BiometricChangeEvent>;

  // Manual control methods
  startBiometricChangeDetection(): Promise<void>;
  stopBiometricChangeDetection(): Promise<void>;
}
```

**2. Native Android Module** (`ReactNativeBiometricsModule.kt`):
- Extends `NativeReactNativeBiometricsSpec` (generated by codegen)
- Implements TurboModule interface for new architecture
- Provides dual event emission for cross-architecture compatibility

**3. Shared Implementation** (`ReactNativeBiometricsSharedImpl.kt`):
- Contains platform-agnostic biometric detection logic
- Manages state tracking and change detection
- Handles lifecycle events (onResume, onPause, onDestroy)

**4. TypeScript API** (`index.tsx`):
- Exposes user-friendly functions
- Wraps native event emitter for compatibility
- Provides TypeScript type safety

### Dual Event Emission Pattern

One of the critical challenges was making events work with both the new and old React Native architectures. Here's how we solved it:

**The Problem:**
- New architecture uses codegen-generated `emitOnBiometricChange()` method
- Old architecture/NativeEventEmitter expects events via `DeviceEventManagerModule`
- Using only one approach breaks compatibility with the other

**The Solution - Dual Emission:**
```kotlin
sharedImpl.setBiometricChangeListener { event ->
  // Method 1: New architecture - codegen EventEmitter
  try {
    emitOnBiometricChange(event)
    Log.d(TAG, "Emitted via new arch method")
  } catch (e: Exception) {
    Log.e(TAG, "Failed to emit via new arch: ${e.message}")
  }

  // Method 2: Old architecture - DeviceEventManagerModule
  try {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit("onBiometricChange", event)
    Log.d(TAG, "Emitted via DeviceEventManagerModule")
  } catch (e: Exception) {
    Log.e(TAG, "Failed to emit via DeviceEventManagerModule: ${e.message}")
  }
}
```

This ensures events are received regardless of which architecture the app uses.

### WritableMap Consumption Pattern

React Native's `WritableMap` has a critical limitation: **it can only be read once**. After reading a value, the map is "consumed" and throws errors on subsequent reads.

**The Problem:**
```kotlin
// This crashes!
val state = getCurrentBiometricState()
val available = state.getBoolean("available")  // First read - OK
// ... later ...
val previousAvailable = state.getBoolean("available")  // Second read - CRASH!
// Error: "Map already consumed"
```

**The Solution:**
1. **Extract all values immediately** before any consumption:
```kotlin
val currentAvailable = currentState.getBoolean("available")
val currentEnrolled = currentState.getBoolean("enrolled")
val currentKeyCount = currentState.getInt("keyCount")
val currentStatusCode = currentState.getInt("statusCode")
```

2. **Use a copy helper** for storing state:
```kotlin
private fun copyMap(original: WritableMap): WritableMap {
  val copy = Arguments.createMap()
  copy.merge(original)  // Deep copy
  return copy
}

// Store a copy, not the original
lastBiometricState = copyMap(currentState)
```

### Enhanced Android State Tracking

To work around Android BiometricManager limitations, we implemented multi-factor state tracking:

```kotlin
private fun getCurrentBiometricState(): WritableMap {
  val state = Arguments.createMap()
  val biometricManager = BiometricManager.from(reactContext)
  val canAuthenticateResult = biometricManager.canAuthenticate(
    BiometricManager.Authenticators.BIOMETRIC_WEAK
  )

  // Basic state
  val available = canAuthenticateResult == BiometricManager.BIOMETRIC_SUCCESS
  val enrolled = canAuthenticateResult != BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED

  state.putBoolean("available", available)
  state.putBoolean("enrolled", enrolled)
  state.putInt("statusCode", canAuthenticateResult)
  state.putLong("timestamp", System.currentTimeMillis())

  // Enhanced tracking: Count biometric-protected keys
  var biometricKeyCount = 0
  val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
  val aliases = keyStore.aliases()
  while (aliases.hasMoreElements()) {
    val alias = aliases.nextElement()
    try {
      val entry = keyStore.getEntry(alias, null)
      if (entry is KeyStore.PrivateKeyEntry) {
        biometricKeyCount++
      }
    } catch (e: Exception) {
      // Key might be inaccessible
    }
  }
  state.putInt("keyCount", biometricKeyCount)

  return state
}
```

This multi-factor approach detects more changes than using BiometricManager alone.

### Manual Start/Stop Control

Detection is **not auto-started** to give developers explicit control:

**Why Manual Control?**
1. **Battery Conservation**: Apps can stop detection when not needed
2. **Resource Management**: Avoid unnecessary lifecycle monitoring when app is backgrounded
3. **User Privacy**: Only monitor when user expects it
4. **Flexibility**: Developers choose when to start/stop

**Lifecycle Integration:**
```kotlin
// In init block - set up listener but don't auto-start
init {
  sharedImpl.setBiometricChangeListener { event ->
    // Dual emission here...
  }
  // Note: Detection NOT started here - must call startBiometricChangeDetection()
}

// Cleanup on module destruction
override fun invalidate() {
  sharedImpl.stopBiometricChangeDetection()
  super.invalidate()
}
```

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  JavaScript Layer                                               │
├─────────────────────────────────────────────────────────────────┤
│  1. subscribeToBiometricChanges(callback)                       │
│  2. startBiometricChangeDetection()                             │
│                                                                  │
│  [Receives events via NativeEventEmitter]                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Native Bridge (TurboModule)                                    │
├─────────────────────────────────────────────────────────────────┤
│  ReactNativeBiometricsModule.kt                                 │
│  - Dual event emission:                                         │
│    • emitOnBiometricChange() [New Arch]                        │
│    • DeviceEventManagerModule.emit() [Old Arch]                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Shared Implementation                                          │
├─────────────────────────────────────────────────────────────────┤
│  ReactNativeBiometricsSharedImpl.kt                             │
│  - Lifecycle event listener (onHostResume/onHostPause)          │
│  - State comparison (available, enrolled, keyCount, statusCode) │
│  - Change type determination                                     │
│  - Checks biometric state when app resumes                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Android System APIs                                            │
├─────────────────────────────────────────────────────────────────┤
│  - BiometricManager.canAuthenticate()                           │
│  - KeyStore (AndroidKeyStore)                                   │
│  - Activity Lifecycle Events                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Debugging and Development

During development, we used extensive debugging to diagnose event flow:

**Debug Strategies:**
1. **Toast notifications** for module initialization
2. **Alert dialogs** for biometric state changes
3. **Console logging** at every critical point
4. **Dual emission logging** to verify both paths work

These can be removed or disabled in production builds.

### Known Issues and Workarounds

**Issue 1: Android Cannot Detect Additional Enrollments**
- **Symptom**: Adding 2nd, 3rd fingerprint not detected
- **Cause**: BiometricManager limitation (same status for 1 or 5 fingerprints)
- **Workaround**: Track KeyStore key count, but still limited
- **Status**: Platform limitation, no complete solution

**Issue 2: NativeEventEmitter Warning**
- **Symptom**: "addListener method required" warning
- **Cause**: TurboModule EventEmitter not fully compatible with NativeEventEmitter
- **Solution**: Dual emission pattern bridges the gap

**Issue 3: WritableMap Consumption**
- **Symptom**: "Map already consumed" crashes
- **Cause**: React Native WritableMap design
- **Solution**: Extract values immediately, use copyMap helper

### Performance Considerations

**Lifecycle-Based Detection:**
- Checks biometric state only when app resumes (not continuously)
- Event-driven approach is battery efficient
- No background processing while app is inactive
- Only active when detection is started

**Memory Management:**
- Proper cleanup in `invalidate()` and component unmount
- Lifecycle listeners removed when detection stopped
- Lifecycle listeners removed on destroy

**CPU Usage:**
- Minimal: Only checking BiometricManager status on app resume
- KeyStore enumeration lightweight
- No continuous background processing

### Testing Recommendations

**Manual Testing:**
1. Start detection
2. Go to device Settings → Biometrics
3. Add/remove fingerprints or face data
4. Return to app (bring to foreground)
5. Verify events are received when app resumes

**Automated Testing:**
- Mock BiometricManager responses
- Test state change detection logic
- Verify event emission
- Test lifecycle cleanup

### Future Improvements

Potential enhancements for future versions:

1. **Unified Start/Stop API**: Add explicit `startBiometricChangeDetection()` and `stopBiometricChangeDetection()` methods to iOS for API consistency with Android (currently iOS auto-starts/stops)
2. **Broadcast Receiver** (Android): Use Android system broadcasts for even more immediate detection (if available)
3. **Event Batching**: Deduplicate rapid consecutive events on both platforms
4. **Detailed Change Info**: Include which specific biometric type changed (e.g., "fingerprint 2 added")
5. **Background Detection** (iOS): Optionally detect changes even when app is in background

### Contributing

If you'd like to improve this feature:
- See `CONTRIBUTING.md` for guidelines
- Android code: `android/src/main/java/com/sbaiahmed1/reactnativebiometrics/`
- TypeScript: `src/index.tsx` and `src/NativeReactNativeBiometrics.ts`
- Example: `example/BiometricChangeExample.tsx`
