---
title: Debugging Utilities
---

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
