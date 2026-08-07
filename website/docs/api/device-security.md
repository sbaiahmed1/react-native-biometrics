---
title: Device Security
---

## `getDeviceIntegrityStatus()`

Checks the integrity and security status of the device, including detection of compromised devices (rooted/jailbroken) and active runtime instrumentation (Frida/Xposed).

```typescript
const getDeviceIntegrityStatus = (): Promise<DeviceIntegrityResult> => {
};

type DeviceIntegrityResult = {
  // Platform-specific properties
  isRooted?: boolean;           // 🤖 ANDROID ONLY: Whether device is rooted
  isJailbroken?: boolean;       // 🍎 iOS ONLY: Whether device is jailbroken
  isKeyguardSecure?: boolean;   // 🤖 ANDROID ONLY: Whether device lock is secure
  hasSecureHardware?: boolean;  // 🤖 ANDROID ONLY: Whether secure hardware is available

  // Cross-platform properties
  hasRuntimeHooks?: boolean;    // 🤖🍎 Whether an instrumentation framework (Frida, Xposed/LSPosed) is actively injected into the process
  isDebuggerAttached?: boolean; // 🤖🍎 Whether a debugger is attached — informational only, does NOT affect isCompromised (debuggers are routine in development)
  runtimeHookDetails?: {        // 🤖🍎 Per-framework breakdown of the hook detection
    fridaDetected: boolean;     // 🤖🍎 Frida artifacts, mapped libraries, or default server port detected
    xposedDetected?: boolean;   // 🤖 ANDROID ONLY: Xposed/EdXposed/LSPosed/Substrate detected
  };
  isCompromised: boolean;       // 🤖🍎 Overall compromise status (always present)
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';  // 🤖🍎 Risk assessment (always present)
  error?: string;               // 🤖🍎 Error message if check failed
}
```

:::note
**Runtime hook detection is best-effort.** Detected hooks set `isCompromised: true` and `riskLevel: 'HIGH'`, but a negative result is not proof of integrity: an attacker who already controls the runtime can hook the detection itself, rename binaries, or move frida-server off its default port. These checks raise the bar — for server-verifiable integrity signals, pair them with [Play Integrity](https://developer.android.com/google/play/integrity) (Android) and [App Attest](https://developer.apple.com/documentation/devicecheck) (iOS).

Two environment notes: on Android the frida-server port probe requires the host app to hold `android.permission.INTERNET` (virtually all React Native apps do) — the library does not declare it for you, and without it that single probe silently reports nothing. On the iOS **Simulator**, localhost is shared with the macOS host, so a `frida-server` running on your Mac will register as a hook inside the simulator; verify hook detection on a physical device.
:::

**Example:**

```javascript
import { getDeviceIntegrityStatus } from '@sbaiahmed1/react-native-biometrics';

const checkDeviceSecurity = async () => {
  try {
    const status = await getDeviceIntegrityStatus();

    if (status.isCompromised) {
      console.warn('⚠️ Device security compromised!');
      console.log('Risk level:', status.riskLevel);

      if (status.isRooted) {
        // Android ONLY
        console.log('📱 Device is rooted');
      }

      if (status.isJailbroken) {
        // IOS ONLY
        console.log('📱 Device is jailbroken');
      }

      if (status.hasRuntimeHooks) {
        console.log('🪝 Runtime instrumentation detected:', status.runtimeHookDetails);
      }

      // Handle compromised device (e.g., restrict functionality)
      return false;
    } else {
      console.log('✅ Device security intact');
      console.log('Risk level:', status.riskLevel);
      return true;
    }
  } catch (error) {
    console.error('💥 Device integrity check failed:', error);
    return false;
  }
};
```

**Platform Compatibility:**

| Property | Android | iOS | Description |
|----------|---------|-----|-------------|
| `isRooted` | ✅ | ❌ | Detects if Android device is rooted |
| `isJailbroken` | ❌ | ✅ | Detects if iOS device is jailbroken |
| `isKeyguardSecure` | ✅ | ❌ | Checks if device lock screen is secure |
| `hasSecureHardware` | ✅ | ❌ | Verifies secure hardware availability |
| `isCompromised` | ✅ | ✅ | Overall security compromise status |
| `riskLevel` | ✅ | ✅ | Risk assessment level |
| `error` | ✅ | ✅ | Error message if check fails |

**Security Considerations:**

- Device integrity checks are not foolproof and can be bypassed by sophisticated attackers
- Use this as an additional security layer, not as the sole security measure
- Consider implementing server-side validation for critical operations
- The risk level assessment helps you make informed decisions about feature restrictions
- Platform-specific properties (`isRooted`/`isJailbroken`) will be `undefined` on the opposite platform
