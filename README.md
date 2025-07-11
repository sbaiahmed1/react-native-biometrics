<div align="center">
  <h1>🔐 React Native Biometrics</h1>
  <p><strong>A lightweight and unified React Native library for biometric authentication across iOS and Android</strong></p>

  <p>
    <img src="https://img.shields.io/npm/v/@sbaiahmed1/react-native-biometrics?style=for-the-badge&color=blue" alt="npm version" />
    <img src="https://img.shields.io/npm/dm/@sbaiahmed1/react-native-biometrics?style=for-the-badge&color=green" alt="downloads" />
    <img src="https://img.shields.io/github/license/sbaiahmed1/react-native-biometrics?style=for-the-badge&color=orange" alt="license" />
    <img src="https://img.shields.io/github/stars/sbaiahmed1/react-native-biometrics?style=for-the-badge&color=yellow" alt="stars" />
    <img src="https://img.shields.io/npm/types/@sbaiahmed1/react-native-biometrics?style=for-the-badge&color=blue" alt="typescript" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/iOS-Face%20ID%20%7C%20Touch%20ID-blue?style=for-the-badge&logo=apple" alt="iOS Support" />
    <img src="https://img.shields.io/badge/Android-Fingerprint%20%7C%20Face-green?style=for-the-badge&logo=android" alt="Android Support" />
    <img src="https://img.shields.io/badge/New%20Architecture-Ready-purple?style=for-the-badge" alt="New Architecture" />
  </p>
</div>

## 🎬 Demo

<div style="display: flex; justify-content: center; gap: 20px;">
  <img src="./demo.gif" alt="React Native Biometrics Demo" width="300" height="803" />
  <img src="./android-demo.gif" alt="React Native Biometrics Demo" width="300" height="803" />
</div>

---

## ✨ Features

- 🔒 **Unified API** - Single interface for iOS and Android biometric authentication
- 📱 **Multiple Biometric Types** - Face ID, Touch ID, Fingerprint, and more
- 🛠️ **Advanced Options** - Customizable prompts, fallback options, and device credentials
- 🔑 **Key Management** - Create and manage cryptographic keys for secure operations
- 🛡️ **Device Integrity** - Detect compromised devices (rooted/jailbroken) for enhanced security
- 🐛 **Debug Tools** - Comprehensive diagnostic and testing utilities
- 📝 **Centralized Logging** - Advanced logging system for debugging and monitoring
- 🔐 **Key Integrity Validation** - Comprehensive cryptographic key validation and signature verification
- 📦 **Lightweight** - Minimal dependencies and optimized for performance
- 🎯 **TypeScript** - Full TypeScript support with detailed type definitions
- 🔄 **New Architecture** - Compatible with React Native's new architecture (TurboModules)
- ✅ **Old Architecture** - Compatible with React Native's old architecture
- 🌟 **Expo Compatible** - Works seamlessly with Expo development workflow
- 📱 **Modern** - Made with Swift and Kotlin for iOS and Android respectively
- 🚀 **Easy Integration** - Simple setup with comprehensive documentation
- 🔐 **Secure by Default** - Industry-standard security practices built-in

## 📋 Requirements

| Platform     | Minimum Version | Recommended |
|--------------|-----------------|-------------|
| React Native | 0.68+           | 0.75+       |

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

### Configuration Methods

#### `configureKeyAlias(keyAlias: string)`
Configures a custom key alias for biometric key storage. This enhances security by allowing app-specific key aliases instead of using a shared hardcoded alias.

```javascript
import { configureKeyAlias } from '@sbaiahmed1/react-native-biometrics';

// Configure a custom key alias
await configureKeyAlias('com.myapp.biometric.main');
```

#### `getDefaultKeyAlias()`
Returns the current default key alias. If no custom alias is configured, returns an app-specific default based on bundle ID (iOS) or package name (Android).

```javascript
import { getDefaultKeyAlias } from '@sbaiahmed1/react-native-biometrics';

const defaultAlias = await getDefaultKeyAlias();
console.log('Current key alias:', defaultAlias);
```

#### `configure(config: BiometricConfig)`
Configures the library with a configuration object.

```javascript
import { configure } from '@sbaiahmed1/react-native-biometrics';

await configure({
  keyAlias: 'com.myapp.biometric.main'
});
```

### Core Functions

#### `isSensorAvailable()`

Checks if biometric authentication is available on the device.

```typescript
const isSensorAvailable = (): Promise<SensorInfo> => {
};

type SensorInfo = {
  available: boolean;        // Whether biometric auth is available
  biometryType?: string;     // Type of biometry ('FaceID', 'TouchID', 'Fingerprint', etc.)
  error?: string;            // Error message if not available
}
```

#### `simplePrompt(reason: string)`

Performs basic biometric authentication with a custom message.

```typescript
const simplePrompt = (reason: string): Promise<boolean> => {
};
```

**Parameters:**
- `reason` (string): Message to display to the user

**Returns:** `Promise<boolean>` - `true` if authentication succeeded, `false` otherwise

#### `authenticateWithOptions(options)`

Enhanced authentication with customizable options and detailed results.

```typescript
const authenticateWithOptions = (options: AuthOptions): Promise<AuthResult> => {
};

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

#### `createKeys(keyAlias?: string)`

Generates cryptographic keys for secure biometric operations. Optionally accepts a custom key alias.

```typescript
const createKeys = (keyAlias?: string): Promise<KeyResult> => {
};

type KeyResult = {
  publicKey: string;         // Generated public key
}
```

**Example:**
```javascript
import { createKeys } from '@sbaiahmed1/react-native-biometrics';

// Create keys with default (configured) alias
try {
  const result = await createKeys();
  console.log('Keys created successfully:', result.publicKey);
} catch (error) {
  console.error('Error creating keys:', error);
}

// Create keys with custom alias
try {
  const result = await createKeys('com.myapp.biometric.backup');
  console.log('Keys created with custom alias:', result.publicKey);
} catch (error) {
  console.error('Error creating keys:', error);
}
```

#### `deleteKeys(keyAlias?: string)`

Deletes previously created cryptographic keys. Optionally accepts a custom key alias.

```typescript
const deleteKeys = (keyAlias?: string): Promise<DeleteResult> => {
};

type DeleteResult = {
  success: boolean;          // Whether deletion succeeded
}
```

**Example:**
```javascript
import { deleteKeys } from '@sbaiahmed1/react-native-biometrics';

// Delete keys with default (configured) alias
try {
  const result = await deleteKeys();
  console.log('Keys deleted successfully');
} catch (error) {
  console.error('Error deleting keys:', error);
}

// Delete keys with custom alias
try {
  const result = await deleteKeys('com.myapp.biometric.backup');
  console.log('Keys deleted with custom alias');
} catch (error) {
  console.error('Error deleting keys:', error);
}
```

#### `getAllKeys()`

Retrieves all stored cryptographic keys.

```typescript
const getAllKeys = (): Promise<GetAllKeysResult> => {
};

type GetAllKeysResult = {
  keys: Array<{
    alias: string;           // Key identifier/alias
    publicKey: string;       // Base64 encoded public key
    creationDate?: string;   // Key creation date (if available)
  }>;
}
```

### Device Security

#### `getDeviceIntegrityStatus()`

Checks the integrity and security status of the device, including detection of compromised devices (rooted/jailbroken).

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
  isCompromised: boolean;       // 🤖🍎 Overall compromise status (always present)
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';  // 🤖🍎 Risk assessment (always present)
  error?: string;               // 🤖🍎 Error message if check failed
}
```

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

### Debugging & Diagnostics

#### `getDiagnosticInfo()`

Returns comprehensive diagnostic information about the device's biometric capabilities.

```typescript
const getDiagnosticInfo = (): Promise<DiagnosticInfo> => {
};

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
const runBiometricTest = (): Promise<BiometricTestResult> => {
};

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
const setDebugMode = (enabled: boolean): Promise<void> => {
};
```

**Parameters:**
- `enabled` (boolean): Whether to enable debug mode

**Usage:**
- When enabled, all library operations will log detailed information
- **iOS**: Check Xcode console for `[ReactNativeBiometrics Debug]` messages
- **Android**: Check Logcat for `ReactNativeBiometrics Debug` tags

### Logging & Monitoring

The library includes a comprehensive centralized logging system for debugging and monitoring biometric operations.

#### `enableLogging(enabled: boolean)`

Enables or disables the centralized logging system.

```typescript
const enableLogging = (enabled: boolean): void => {
};
```

#### `setLogLevel(level: LogLevel)`

Sets the minimum log level for output.

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

const setLogLevel = (level: LogLevel): void => {
};
```

#### `configureLogger(config: LoggerConfig)`

Configures the logger with advanced options.

```typescript
type LoggerConfig = {
  enabled: boolean;
  level: LogLevel;
  useColors: boolean;
  prefix: string;
  includeTimestamp: boolean;
  includeContext: boolean;
  maxStoredLogs: number;
};

const configureLogger = (config: Partial<LoggerConfig>): void => {
};
```

#### `getStoredLogs()`

Retrieves stored log entries for analysis.

```typescript
type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
};

const getStoredLogs = (): LogEntry[] => {
};
```

#### `clearStoredLogs()`

Clears all stored log entries.

```typescript
const clearStoredLogs = (): void => {
};
```

**Example Usage:**
```typescript
import {
  enableLogging,
  setLogLevel,
  LogLevel,
  configureLogger,
  getStoredLogs
} from '@sbaiahmed1/react-native-biometrics';

// Enable logging with INFO level
enableLogging(true);
setLogLevel(LogLevel.INFO);

// Configure advanced logging options
configureLogger({
  useColors: true,
  prefix: '[MyApp]',
  includeTimestamp: true,
  includeContext: true,
  maxStoredLogs: 1000
});

// Perform biometric operations - they will be automatically logged
const sensorInfo = await isSensorAvailable();

// Retrieve logs for analysis
const logs = getStoredLogs();
console.log('Recent logs:', logs);
```

**For detailed logging documentation, see [docs/LOGGING.md](./docs/LOGGING.md).**

### Key Integrity Validation

#### `validateKeyIntegrity(keyAlias?: string): Promise<KeyIntegrityResult>`
Performs comprehensive validation of key integrity including format checks, accessibility tests, signature validation, and hardware backing verification.

#### `verifyKeySignature(data: string, keyAlias?: string): Promise<SignatureResult>`
Generates a cryptographic signature for the provided data using the specified key.

#### `validateSignature(data: string, signature: string, keyAlias?: string): Promise<SignatureValidationResult>`
Validates a signature against the original data using the public key.

#### `getKeyAttributes(keyAlias?: string): Promise<KeyAttributesResult>`
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

// Generate and validate signature
const data = 'Hello, secure world!';
const signatureResult = await verifyKeySignature(data, 'my-key');
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


## 📱 Example App

The library includes a comprehensive example app demonstrating all features and capabilities. The example app contains several demo components:

### Available Demo Components

#### 🔐 AuthExample
Demonstrates basic authentication flows:
- Simple biometric prompts
- Enhanced authentication with custom options
- Error handling and fallback scenarios

#### 🎨 ColorExample
Shows UI customization capabilities:
- Custom prompt styling
- Theme integration
- Visual feedback examples

#### 🔧 CombinedBiometricsDemo
Comprehensive demonstration of key management and security features:
- **Key Management**: Create, delete, and list biometric keys with custom aliases
- **Integrity Validation**: Comprehensive key integrity checks and validation
- **Signature Operations**: Generate and verify cryptographic signatures
- **Security Testing**: Automated test suite for all security features
- **Real-time Results**: Live display of test results and security status

This component combines the functionality of key management and integrity testing into a single, unified interface, making it easy to test and understand all security features.

#### 🐛 DebuggingExample
Debugging and diagnostic utilities:
- Device capability detection
- Comprehensive diagnostic information
- Debug logging controls
- Test result analysis

### Running the Example App

```bash
cd example
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

The example app provides hands-on experience with all library features and serves as a reference implementation for integration patterns.

## 📊 Library Comparison

| Feature | @sbaiahmed1/react-native-biometrics | react-native-biometrics | react-native-touch-id |
|---------|-----------------------------------|------------------------|----------------------|
| **TypeScript Support** | ✅ Full support | ❌ Limited | ❌ No |
| **New Architecture** | ✅ TurboModules | ❌ No | ❌ No |
| **Expo Compatibility** | ✅ Yes | ❌ No | ❌ No |
| **Key Management** | ✅ Advanced | ✅ Basic | ❌ No |
| **Debug Tools** | ✅ Comprehensive | ❌ Limited | ❌ No |
| **Active Maintenance** | ✅ Yes | ❌ Outdated | ❌ Outdated |
| **Bundle Size** | 🟢 Small | 🟡 Medium | 🟢 Small |
| **Documentation** | ✅ Extensive | 🟡 Basic | 🟡 Basic |
| **Security Features** | ✅ Advanced | 🟡 Basic | 🟡 Basic |

## 🎯 Use Cases

### Mobile Banking & Finance
- Secure login for banking applications
- Transaction authentication
- Account access protection
- Compliance with financial security standards

### Healthcare Applications
- Patient data access control
- Medical record security
- HIPAA compliance support
- Secure prescription management

### Enterprise & Business
- Employee authentication
- Corporate app security
- Document access control
- Time tracking applications

### E-commerce & Retail
- Secure payment authentication
- Account protection
- Purchase confirmation
- Loyalty program access

### Social & Communication
- Private message protection
- Profile security
- Content access control
- Privacy-focused features

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

## 🔒 Security

This library implements several security measures:

- **Hardware-backed keys**: Uses the device's secure hardware when available
- **Biometric validation**: Requires actual biometric authentication
- **Key isolation**: Keys are stored in the device's secure keystore
- **No key export**: Private keys never leave the secure hardware
- **App-specific key aliases**: Each app uses unique key aliases to prevent cross-app key access

### Key Alias Security Enhancement

**Previous versions** used a hardcoded key alias (`"ReactNativeBiometricsKey"`) shared across all apps, which posed security risks:
- Multiple apps could potentially access each other's biometric keys
- Key collisions could occur between different applications

**Current version** implements secure, app-specific key aliases:
- **Default aliases** are automatically generated using bundle ID (iOS) or package name (Android)
- **Custom aliases** can be configured for different security contexts
- **Key isolation** ensures each app's biometric keys are properly separated

```javascript
// Configure app-specific key alias
await configureKeyAlias('com.myapp.biometric.main');

// Get current default alias (auto-generated if not configured)
const alias = await getDefaultKeyAlias();
// Returns: "com.myapp.ReactNativeBiometrics"
```

For detailed security information, see [KEY_ALIAS_SECURITY.md](./KEY_ALIAS_SECURITY.md).

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🚀 Roadmap

### ✅ Completed

- [x] **Code Quality Improvements**: Improved type safety, error handling, and code documentation
- [x] **Type Safety**: Fixed conditional casting warnings and type conversion issues
- [x] **Code Organization**: Added MARK comments and improved code structure
- [x] **Enhanced Testing**: Expand unit test coverage and add integration tests
- [x] **Centralized Logging**: Implemented comprehensive logging and error reporting system
- [x] **Advanced Security Features**: Enhanced security measures and validation

### 🔄 In Progress
- [x] **Biometrics Change Event Handling**: Implement event listeners for biometric changes (e.g., new enrollment, removal)
- [ ] **Performance Optimization**: Optimize biometric operations and reduce latency

## 🙏 Acknowledgments

- Built with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
- Inspired by the React Native community's need for an up-to-date unified biometric authentication
- Inspired by existing libraries like <a href=https://github.com/SelfLender/react-native-biometrics>react-native-biometrics</a>

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
