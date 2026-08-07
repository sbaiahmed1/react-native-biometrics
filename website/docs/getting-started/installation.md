---
title: Installation
---

## Requirements

| Platform     | Minimum Version | Recommended |
|--------------|-----------------|-------------|
| React Native | 0.68+           | 0.75+       |

### Supported Biometric Types

- **iOS**: Face ID, Touch ID
- **Android**: Fingerprint, Face Recognition, Iris Scanner
- **Fallback**: Device PIN, Password, Pattern

## Install the package

```bash
npm install @sbaiahmed1/react-native-biometrics
# or
yarn add @sbaiahmed1/react-native-biometrics
```

## Expo

The library ships with an Expo config plugin. Instead of editing native files manually, add it to your app config — it sets `NSFaceIDUsageDescription` on iOS and adds the `USE_BIOMETRIC` / `USE_FINGERPRINT` permissions on Android during prebuild:

```json
{
  "expo": {
    "plugins": [
      [
        "@sbaiahmed1/react-native-biometrics",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID for secure authentication"
        }
      ]
    ]
  }
}
```

Then regenerate the native projects with `npx expo prebuild --clean`. Note that `npx expo run:ios` / `run:android` only run prebuild when the native directories are missing — after changing plugin config on an existing project, use `prebuild --clean` so the changes are applied.

| Option | Type | Default | Description |
|---|---|---|---|
| `faceIDPermission` | `string \| false` | A generic Face ID message | The iOS `NSFaceIDUsageDescription` text. Pass `false` to leave `Info.plist` untouched (e.g. when you manage it via `ios.infoPlist`). |

:::tip
With the plugin in place, the manual **iOS Setup** and **Android Setup** permission steps below are handled for you (Expo projects only).
:::

## iOS Setup

1. **Add permissions to `Info.plist`:**

```xml
<key>NSFaceIDUsageDescription</key>
<string>This app uses Face ID for secure authentication</string>
```

2. **Install iOS dependencies:**

```bash
cd ios && pod install
```

## Android Setup

1. **Add permissions to `android/app/src/main/AndroidManifest.xml`:**

```xml
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

2. **Ensure minimum SDK version in `android/app/build.gradle`:**

```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        minSdkVersion 23
        targetSdkVersion 34
    }
}
```

3. **Add ProGuard rules (if using ProGuard) in `android/app/proguard-rules.pro`:**

```text
-keep class androidx.biometric.** { *; }
-keep class com.sbaiahmed1.reactnativebiometrics.** { *; }
```

## Importing Types on Non-Native Platforms

The `AuthType` and `BiometricStrength` enums can be safely imported from `@sbaiahmed1/react-native-biometrics/types` on non-mobile platforms (e.g. web), as this entry point does not load native modules.

```typescript
import { AuthType, BiometricStrength } from '@sbaiahmed1/react-native-biometrics/types';
```
