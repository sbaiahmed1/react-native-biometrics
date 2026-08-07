---
title: Troubleshooting
---

## Common Issues

### iOS

- **"Biometry is not available"**: Ensure Face ID/Touch ID is set up in device settings
- **"Passcode not set"**: Device must have a passcode/password configured
- **Build errors**: Make sure iOS deployment target is 11.0 or higher

### Android

- **"No biometric features available"**: Check if device has fingerprint sensor and it's enrolled
- **"BiometricPrompt not available"**: Ensure Android API level 24+ (the library's default `minSdkVersion`) and the androidx.biometric dependency
- **Permission denied**: Verify `USE_FINGERPRINT` and `USE_BIOMETRIC` permissions are added

### Native crash on 32-bit Android (armeabi-v7a) release builds

If your app crashes on startup on 32-bit devices in release builds with a backtrace pointing at `JavaTurboModule::setEventEmitterCallback` / `NativeReactNativeBiometricsSpecJSI`, this is a React Native core bug ([facebook/react-native#51628](https://github.com/facebook/react-native/issues/51628)), not a bug in this library. RN used an unsafe variadic JNI call that misreads the stack on 32-bit ABIs; it is triggered by any TurboModule that declares an event emitter (this library's `onBiometricChange`). See [issue #89](https://github.com/sbaiahmed1/react-native-biometrics/issues/89) for the full analysis.

**Fix**: upgrade React Native to a version containing [the upstream fix](https://github.com/facebook/react-native/pull/51695):

| RN line | Affected | Fixed in |
|---|---|---|
| ≤ 0.78.x | all | never backported — upgrade to 0.79.6+ |
| 0.79.x | 0.79.0 – 0.79.5 | 0.79.6 |
| 0.80.x | 0.80.0 | 0.80.1 |
| 0.81.x and later | — | not affected |

## Debug Mode

Enable debug mode to get detailed logs:

```typescript
import ReactNativeBiometrics from '@sbaiahmed1/react-native-biometrics';

// Enable debug logging
await ReactNativeBiometrics.setDebugMode(true);

// Perform operations - check console for detailed logs
const result = await ReactNativeBiometrics.isSensorAvailable();

// Disable when done
await ReactNativeBiometrics.setDebugMode(false);
```

## Getting Help

1. Check the sections above
2. Run diagnostic tests using `getDiagnosticInfo()` and `runBiometricTest()`
3. Enable debug mode for detailed logging
4. Search existing [GitHub issues](https://github.com/sbaiahmed1/react-native-biometrics/issues)
5. Create a new issue with:
   - Device information
   - OS version
   - Library version
   - Debug logs
   - Minimal reproduction code
