<div align="center">
  <h1>🔐 React Native Biometrics</h1>
  <p><strong>A lightweight and unified React Native library for biometric authentication across iOS and Android</strong></p>
  
  <p>
    <img src="https://img.shields.io/npm/v/@sbaiahmed1/react-native-biometrics?style=for-the-badge&color=blue" alt="npm version" />
    <img src="https://img.shields.io/npm/dm/@sbaiahmed1/react-native-biometrics?style=for-the-badge&color=green" alt="downloads" />
    <img src="https://img.shields.io/github/license/sbaiahmed1/react-native-biometrics?style=for-the-badge&color=orange" alt="license" />
    <img src="https://img.shields.io/github/stars/sbaiahmed1/react-native-biometrics?style=for-the-badge&color=yellow" alt="stars" />
  </p>
  
  <p>
    <img src="https://img.shields.io/badge/iOS-Face%20ID%20%7C%20Touch%20ID-blue?style=for-the-badge&logo=apple" alt="iOS Support" />
    <img src="https://img.shields.io/badge/Android-Fingerprint%20%7C%20Face-green?style=for-the-badge&logo=android" alt="Android Support" />
    <img src="https://img.shields.io/badge/New%20Architecture-Ready-purple?style=for-the-badge" alt="New Architecture" />
  </p>
</div>

---

## ✨ Features

- 🔒 **Unified API** - Single interface for iOS and Android biometric authentication
- 📱 **Multiple Biometric Types** - Face ID, Touch ID, Fingerprint, and more
- 🛠️ **Advanced Options** - Customizable prompts, fallback options, and device credentials
- 🔑 **Key Management** - Create and manage cryptographic keys for secure operations
- 🐛 **Debug Tools** - Comprehensive diagnostic and testing utilities
- 📦 **Lightweight** - Minimal dependencies and optimized for performance
- 🎯 **TypeScript** - Full TypeScript support with detailed type definitions
- 🔄 **New Architecture** - Compatible with React Native's new architecture

## 📋 Requirements

| Platform | Minimum Version | Recommended |
|----------|-----------------|-------------|
| React Native | 0.68+ | 0.75+ |
| iOS | 11.0+ | 15.0+ |
| Android API | 23+ (Android 6.0) | 30+ (Android 11) |
| Xcode | 12.0+ | 15.0+ |
| Android SDK | 23+ | 34+ |

### Supported Biometric Types

- **iOS**: Face ID, Touch ID
- **Android**: Fingerprint, Face Recognition, Iris Scanner
- **Fallback**: Device PIN, Password, Pattern

## 🚀 Installation

### NPM
```bash
npm install @sbaiahmed1/react-native-biometrics
```

### Yarn
```bash
yarn add @sbaiahmed1/react-native-biometrics
```

### iOS Setup

1. **Add permissions to `Info.plist`:**
```xml
<key>NSFaceIDUsageDescription</key>
<string>This app uses Face ID for secure authentication</string>
```

2. **Install iOS dependencies:**
```bash
cd ios && pod install
```

3. **For React Native 0.60+, the library will auto-link. For older versions:**
```bash
react-native link @sbaiahmed1/react-native-biometrics
```

### Android Setup

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
```proguard
-keep class androidx.biometric.** { *; }
-keep class com.sbaiahmed1.reactnativebiometrics.** { *; }
```

## 📖 Usage

### 🔍 Quick Start

```typescript
import {
  isSensorAvailable,
  simplePrompt,
  authenticateWithOptions,
  setDebugMode
} from '@sbaiahmed1/react-native-biometrics';

const BiometricAuth = () => {
  const authenticate = async () => {
    try {
      // Enable debug mode for development
      await setDebugMode(true);
      
      // Check if biometric authentication is available
      const sensorInfo = await isSensorAvailable();
      
      if (sensorInfo.available) {
        console.log(`✅ ${sensorInfo.biometryType} available`);
        
        // Perform authentication
        const result = await simplePrompt('Please authenticate to continue');
        
        if (result) {
          console.log('🎉 Authentication successful!');
          // Navigate to secure content
        } else {
          console.log('❌ Authentication failed');
        }
      } else {
        console.log('❌ Biometric authentication not available:', sensorInfo.error);
        // Show alternative authentication method
      }
    } catch (error) {
      console.error('💥 Authentication error:', error);
    }
  };
  
  return authenticate;
};
```

### 🔍 Check Sensor Availability

Before attempting authentication, check if biometric sensors are available on the device.

```typescript
import { isSensorAvailable } from '@sbaiahmed1/react-native-biometrics';

const checkBiometrics = async () => {
  try {
    const sensorInfo = await isSensorAvailable();
    
    if (sensorInfo.available) {
      console.log('✅ Biometric authentication available');
      console.log('📱 Type:', sensorInfo.biometryType);
      // Possible values: 'FaceID', 'TouchID', 'Fingerprint', 'Biometrics'
    } else {
      console.log('❌ Biometric authentication not available');
      console.log('🚫 Reason:', sensorInfo.error);
    }
  } catch (error) {
    console.error('💥 Error checking biometrics:', error);
  }
};
```

### 🔐 Simple Authentication

Perform basic biometric authentication with a custom message.

```typescript
import { simplePrompt } from '@sbaiahmed1/react-native-biometrics';

const authenticate = async () => {
  try {
    const result = await simplePrompt('Please authenticate to continue');
    
    if (result) {
      console.log('✅ Authentication successful!');
      // Proceed with authenticated action
    } else {
      console.log('❌ Authentication failed or cancelled');
    }
  } catch (error) {
    console.error('💥 Authentication error:', error);
  }
};
```

### ⚙️ Enhanced Authentication

Use advanced authentication options with customizable prompts and fallback mechanisms.

```typescript
import { authenticateWithOptions } from '@sbaiahmed1/react-native-biometrics';

const enhancedAuth = async () => {
  try {
    const result = await authenticateWithOptions({
      title: '🔐 Secure Login',
      subtitle: 'Verify your identity',
      description: 'Use your biometric to access your account securely',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
      allowDeviceCredentials: true,    // Allow PIN/password fallback
      disableDeviceFallback: false,    // Enable fallback options
    });
    
    if (result.success) {
      console.log('✅ Authentication successful!');
      // User authenticated successfully
      navigateToSecureArea();
    } else {
      console.log('❌ Authentication failed:', result.error);
      console.log('🔢 Error code:', result.errorCode);
      // Handle authentication failure
      handleAuthFailure(result.errorCode);
    }
  } catch (error) {
    console.error('💥 Authentication error:', error);
  }
};

// Example: Different authentication scenarios
const authScenarios = {
  // Strict biometric only (no fallback)
  strictBiometric: {
    title: 'Biometric Required',
    subtitle: 'Touch sensor or look at camera',
    allowDeviceCredentials: false,
    disableDeviceFallback: true,
  },
  
  // Flexible authentication (with fallbacks)
  flexibleAuth: {
    title: 'Secure Access',
    subtitle: 'Use biometric or device passcode',
    allowDeviceCredentials: true,
    disableDeviceFallback: false,
    fallbackLabel: 'Use Passcode',
  },
  
  // Custom branded experience
  brandedAuth: {
    title: 'MyApp Security',
    subtitle: 'Protect your data',
    description: 'Authenticate to access your personal information',
    cancelLabel: 'Not Now',
    fallbackLabel: 'Enter PIN',
  },
 };
```

### 🔑 Key Management

Manage cryptographic keys for secure biometric operations.

```typescript
import { createKeys, deleteKeys, getAllKeys } from '@sbaiahmed1/react-native-biometrics';

// Create biometric keys for secure operations
const createBiometricKeys = async () => {
  try {
    const result = await createKeys();
    console.log('✅ Keys created successfully');
    console.log('🔑 Public key:', result.publicKey);
    
    // Store the public key for server-side verification
    await storePublicKeyOnServer(result.publicKey);
  } catch (error) {
    console.error('💥 Failed to create keys:', error);
  }
};

// Delete biometric keys when no longer needed
const deleteBiometricKeys = async () => {
  try {
    const result = await deleteKeys();
    
    if (result.success) {
      console.log('✅ Keys deleted successfully');
      // Clean up any stored references
      await removePublicKeyFromServer();
    } else {
      console.log('❌ Failed to delete keys');
    }
  } catch (error) {
    console.error('💥 Failed to delete keys:', error);
  }
};

// Retrieve all stored biometric keys
const getAllBiometricKeys = async () => {
  try {
    const result = await getAllKeys();
    
    console.log(`📋 Found ${result.keys.length} stored keys`);
    
    result.keys.forEach((key, index) => {
      console.log(`🔑 Key ${index + 1}:`);
      console.log(`   Alias: ${key.alias}`);
      console.log(`   Public Key: ${key.publicKey.substring(0, 50)}...`);
      if (key.creationDate) {
        console.log(`   Created: ${key.creationDate}`);
      }
    });
    
    return result.keys;
  } catch (error) {
    console.error('💥 Failed to retrieve keys:', error);
    return [];
  }
};

// Example: Complete key lifecycle management
const keyLifecycleExample = async () => {
  try {
    // 1. Check if biometrics are available
    const sensorInfo = await isSensorAvailable();
    if (!sensorInfo.available) {
      throw new Error('Biometric authentication not available');
    }
    
    // 2. Create keys for the user
    const keyResult = await createKeys();
    console.log('🔐 Biometric keys created for user');
    
    // 3. Perform authenticated operations
    const authResult = await authenticateWithOptions({
      title: 'Verify Identity',
      subtitle: 'Authenticate to access secure features',
    });
    
    if (authResult.success) {
      console.log('🎉 User authenticated with biometric keys');
    }
    
    // 4. Clean up when user logs out
    // await deleteKeys();
  } catch (error) {
    console.error('💥 Key lifecycle error:', error);
  }
};
```

### 🐛 Debugging Utilities

Comprehensive debugging tools to help troubleshoot biometric authentication issues.

```typescript
import { 
  getDiagnosticInfo, 
  runBiometricTest, 
  setDebugMode 
} from '@sbaiahmed1/react-native-biometrics';

// 🔍 Get comprehensive diagnostic information
const getDiagnostics = async () => {
  try {
    const info = await getDiagnosticInfo();
    
    console.log('📱 Platform:', info.platform);
    console.log('🔢 OS Version:', info.osVersion);
    console.log('📲 Device Model:', info.deviceModel);
    console.log('🔐 Biometric Capabilities:', info.biometricCapabilities);
    console.log('🛡️ Security Level:', info.securityLevel);
    console.log('🔒 Keyguard Secure:', info.keyguardSecure);
    console.log('👆 Enrolled Biometrics:', info.enrolledBiometrics);
    
    if (info.lastError) {
      console.log('⚠️ Last Error:', info.lastError);
    }
    
    return info;
  } catch (error) {
    console.error('💥 Failed to get diagnostic info:', error);
  }
};

// 🧪 Run comprehensive biometric functionality test
const testBiometrics = async () => {
  try {
    console.log('🧪 Running biometric tests...');
    const testResult = await runBiometricTest();
    
    if (testResult.success) {
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Test failures detected:');
      testResult.errors.forEach(error => console.log('  🚫', error));
      
      if (testResult.warnings.length > 0) {
        console.log('⚠️ Test warnings:');
        testResult.warnings.forEach(warning => console.log('  ⚠️', warning));
      }
    }
    
    // Detailed test results
    console.log('📊 Test Results:');
    console.log('  🔍 Sensor Available:', testResult.results.sensorAvailable);
    console.log('  🔐 Can Authenticate:', testResult.results.canAuthenticate);
    console.log('  🔧 Hardware Detected:', testResult.results.hardwareDetected);
    console.log('  👆 Has Enrolled Biometrics:', testResult.results.hasEnrolledBiometrics);
    console.log('  🛡️ Secure Hardware:', testResult.results.secureHardware);
    
    return testResult;
  } catch (error) {
    console.error('💥 Failed to run biometric test:', error);
  }
};

// 🔧 Debug mode management
const debugModeExample = async () => {
  try {
    // Enable debug logging
    await setDebugMode(true);
    console.log('🐛 Debug mode enabled - all operations will be logged');
    
    // Perform some operations (they will now be logged)
    await isSensorAvailable();
    await simplePrompt('Debug test authentication');
    
    // Disable debug logging
    await setDebugMode(false);
    console.log('🔇 Debug mode disabled');
  } catch (error) {
    console.error('💥 Failed to manage debug mode:', error);
  }
};

// 🔍 Complete diagnostic workflow
const runDiagnosticWorkflow = async () => {
  console.log('🚀 Starting comprehensive biometric diagnostics...');
  
  // 1. Enable debug mode
  await setDebugMode(true);
  
  // 2. Get device information
  const diagnostics = await getDiagnostics();
  
  // 3. Run functionality tests
  const testResults = await testBiometrics();
  
  // 4. Generate report
  const report = {
    timestamp: new Date().toISOString(),
    device: diagnostics,
    tests: testResults,
    summary: {
      isFullyFunctional: testResults?.success || false,
      criticalIssues: testResults?.errors?.length || 0,
      warnings: testResults?.warnings?.length || 0,
    }
  };
  
  console.log('📋 Diagnostic Report:', JSON.stringify(report, null, 2));
  
  // 5. Disable debug mode
  await setDebugMode(false);
  
  return report;
};
```

## 📚 API Reference

### Core Functions

#### `isSensorAvailable()`

Checks if biometric authentication is available on the device.

```typescript
function isSensorAvailable(): Promise<SensorInfo>

type SensorInfo = {
  available: boolean;        // Whether biometric auth is available
  biometryType?: string;     // Type of biometry ('FaceID', 'TouchID', 'Fingerprint', etc.)
  error?: string;            // Error message if not available
}
```

#### `simplePrompt(reason: string)`

Performs basic biometric authentication with a custom message.

```typescript
function simplePrompt(reason: string): Promise<boolean>
```

**Parameters:**
- `reason` (string): Message to display to the user

**Returns:** `Promise<boolean>` - `true` if authentication succeeded, `false` otherwise

#### `authenticateWithOptions(options)`

Enhanced authentication with customizable options and detailed results.

```typescript
function authenticateWithOptions(options: AuthOptions): Promise<AuthResult>

type AuthOptions = {
  title?: string;                    // Dialog title
  subtitle?: string;                 // Dialog subtitle  
  description?: string;              // Additional description
  cancelLabel?: string;              // Cancel button text
  fallbackLabel?: string;            // Fallback button text
  allowDeviceCredentials?: boolean;  // Allow PIN/password fallback
  disableDeviceFallback?: boolean;   // Disable fallback options
}

type AuthResult = {
  success: boolean;          // Authentication result
  error?: string;            // Error message if failed
  errorCode?: string;        // Error code if failed
}
```

### Key Management

#### `createKeys()`

Generates cryptographic keys for secure biometric operations.

```typescript
function createKeys(): Promise<KeyResult>

type KeyResult = {
  publicKey: string;         // Generated public key
}
```

#### `deleteKeys()`

Deletes previously created cryptographic keys.

```typescript
function deleteKeys(): Promise<DeleteResult>

type DeleteResult = {
  success: boolean;          // Whether deletion succeeded
}
```

#### `getAllKeys()`

Retrieves all stored cryptographic keys.

```typescript
function getAllKeys(): Promise<GetAllKeysResult>

type GetAllKeysResult = {
  keys: Array<{
    alias: string;           // Key identifier/alias
    publicKey: string;       // Base64 encoded public key
    creationDate?: string;   // Key creation date (if available)
  }>;
}
```

### Debugging & Diagnostics

#### `getDiagnosticInfo()`

Returns comprehensive diagnostic information about the device's biometric capabilities.

```typescript
function getDiagnosticInfo(): Promise<DiagnosticInfo>

type DiagnosticInfo = {
  platform: string;                 // 'iOS' or 'Android'
  osVersion: string;                // Operating system version
  deviceModel: string;              // Device model information
  biometricCapabilities: string[];  // Available biometric types
  securityLevel: string;            // 'SecureHardware' or 'Software'
  keyguardSecure: boolean;          // Whether device lock is secure
  enrolledBiometrics: string[];     // Currently enrolled biometric types
  lastError?: string;               // Last error encountered (if any)
}
```

#### `runBiometricTest()`

Runs a comprehensive test of biometric functionality and returns detailed results.

```typescript
function runBiometricTest(): Promise<BiometricTestResult>

type BiometricTestResult = {
  success: boolean;                 // Overall test success
  results: {
    sensorAvailable: boolean;         // Biometric sensor availability
    canAuthenticate: boolean;         // Authentication capability
    hardwareDetected: boolean;        // Hardware detection
    hasEnrolledBiometrics: boolean;   // Enrolled biometrics check
    secureHardware: boolean;          // Secure hardware availability
  };
  errors: string[];                 // Critical errors found
  warnings: string[];               // Non-critical warnings
}
```

#### `setDebugMode(enabled: boolean)`

Enables or disables debug logging for the biometric library.

```typescript
function setDebugMode(enabled: boolean): Promise<void>
```

**Parameters:**
- `enabled` (boolean): Whether to enable debug mode

**Usage:**
- When enabled, all library operations will log detailed information
- **iOS**: Check Xcode console for `[ReactNativeBiometrics Debug]` messages
- **Android**: Check Logcat for `ReactNativeBiometrics Debug` tags

### Error Codes

Common error codes returned by authentication methods:

| Code | Description | Platform |
|------|-------------|----------|
| `SENSOR_NOT_AVAILABLE` | Biometric sensor not available | Both |
| `USER_CANCEL` | User cancelled authentication | Both |
| `USER_FALLBACK` | User chose fallback method | Both |
| `SYSTEM_CANCEL` | System cancelled authentication | Both |
| `PASSCODE_NOT_SET` | Device passcode not set | Both |
| `BIOMETRY_NOT_AVAILABLE` | Biometry not available | iOS |
| `BIOMETRY_NOT_ENROLLED` | No biometrics enrolled | iOS |
| `BIOMETRY_LOCKOUT` | Too many failed attempts | Both |


## 🔧 Troubleshooting

### Common Issues

#### iOS
- **"Biometry is not available"**: Ensure Face ID/Touch ID is set up in device settings
- **"Passcode not set"**: Device must have a passcode/password configured
- **Build errors**: Make sure iOS deployment target is 11.0 or higher

#### Android
- **"No biometric features available"**: Check if device has fingerprint sensor and it's enrolled
- **"BiometricPrompt not available"**: Ensure Android API level 23+ and androidx.biometric dependency
- **Permission denied**: Verify `USE_FINGERPRINT` and `USE_BIOMETRIC` permissions are added

### Debug Mode

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

### Getting Help

1. Check the [troubleshooting section](#troubleshooting) above
2. Run diagnostic tests using `getDiagnosticInfo()` and `runBiometricTest()`
3. Enable debug mode for detailed logging
4. Search existing [GitHub issues](https://github.com/sbaiahmed1/react-native-biometrics/issues)
5. Create a new issue with:
   - Device information
   - OS version
   - Library version
   - Debug logs
   - Minimal reproduction code

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/react-native-biometrics.git
   cd react-native-biometrics
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the example app**
   ```bash
   cd example
   npm install
   # iOS
   cd ios && pod install && cd ..
   npx react-native run-ios
   # Android
   npx react-native run-android
   ```

### Guidelines

- 🐛 **Bug Reports**: Include device info, OS version, and reproduction steps
- ✨ **Feature Requests**: Describe the use case and expected behavior
- 🔧 **Pull Requests**: 
  - Follow existing code style
  - Add tests for new features
  - Update documentation
  - Test on both iOS and Android

### Code Style

- Use TypeScript for type safety
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Ensure debug logging for new methods

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
---

---

## 🚀 Roadmap

- [ ] **Enhanced Security**: Hardware-backed key attestation
- [ ] **Biometric Templates**: Store and manage biometric templates
- [ ] **Multi-factor Authentication**: Combine biometrics with other factors
- [ ] **Advanced Fallbacks**: Custom fallback UI components
- [ ] **Analytics**: Usage and security analytics
- [ ] **Web Support**: Extend to React Native Web

## 🙏 Acknowledgments

- Built with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
- Inspired by the React Native community's need for unified biometric authentication
- Thanks to all contributors and users who help improve this library

## 📊 Stats

<div align="center">
  <img src="https://img.shields.io/github/contributors/sbaiahmed1/react-native-biometrics?style=for-the-badge" alt="contributors" />
  <img src="https://img.shields.io/github/last-commit/sbaiahmed1/react-native-biometrics?style=for-the-badge" alt="last commit" />
  <img src="https://img.shields.io/github/issues/sbaiahmed1/react-native-biometrics?style=for-the-badge" alt="issues" />
  <img src="https://img.shields.io/github/issues-pr/sbaiahmed1/react-native-biometrics?style=for-the-badge" alt="pull requests" />
</div>

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/sbaiahmed1">@sbaiahmed1</a></p>
  <p>⭐ Star this repo if it helped you!</p>
  
  <p>
    <a href="https://github.com/sbaiahmed1/react-native-biometrics/issues">Report Bug</a> ·
    <a href="https://github.com/sbaiahmed1/react-native-biometrics/issues">Request Feature</a> ·
    <a href="https://github.com/sbaiahmed1/react-native-biometrics/discussions">Discussions</a>
  </p>
</div>
