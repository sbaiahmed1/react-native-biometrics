import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  getDiagnosticInfo,
  runBiometricTest,
  setDebugMode,
  type DiagnosticInfo,
  type BiometricTestResult,
} from '@sbaiahmed1/react-native-biometrics';

const DebuggingExample: React.FC = () => {
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(
    null
  );
  const [testResult, setTestResult] = useState<BiometricTestResult | null>(
    null
  );
  const [debugMode, setDebugModeState] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGetDiagnosticInfo = async () => {
    try {
      setLoading(true);
      const info = await getDiagnosticInfo();
      setDiagnosticInfo(info);
      console.log('Diagnostic Info:', info);
    } catch (error) {
      console.error('Failed to get diagnostic info:', error);
      Alert.alert('Error', 'Failed to get diagnostic information');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBiometricTest = async () => {
    try {
      setLoading(true);
      const result = await runBiometricTest();
      setTestResult(result);
      console.log('Biometric Test Result:', result);
      if (!result.success) {
        Alert.alert(
          'Test Issues Found',
          `Errors: ${result.errors.join(', ')}\nWarnings: ${result.warnings.join(', ')}`
        );
      } else {
        Alert.alert(
          'Test Passed',
          'All biometric tests completed successfully!'
        );
      }
    } catch (error) {
      console.error('Failed to run biometric test:', error);
      Alert.alert('Error', 'Failed to run biometric test');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDebugMode = async () => {
    try {
      const newDebugMode = !debugMode;
      await setDebugMode(newDebugMode);
      setDebugModeState(newDebugMode);
      Alert.alert(
        'Debug Mode',
        `Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      console.error('Failed to toggle debug mode:', error);
      Alert.alert('Error', 'Failed to toggle debug mode');
    }
  };

  const renderDiagnosticInfo = () => {
    if (!diagnosticInfo) return null;

    return (
      <View style={styles.section}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoItem}>
            Platform: {diagnosticInfo.platform}
          </Text>
          <Text style={styles.infoItem}>
            OS Version: {diagnosticInfo.osVersion}
          </Text>
          <Text style={styles.infoItem}>
            Device Model: {diagnosticInfo.deviceModel}
          </Text>
          <Text style={styles.infoItem}>
            Biometric Capabilities:{' '}
            {diagnosticInfo.biometricCapabilities.join(', ')}
          </Text>
          <Text style={styles.infoItem}>
            Security Level: {diagnosticInfo.securityLevel}
          </Text>
          <Text style={styles.infoItem}>
            Keyguard Secure: {diagnosticInfo.keyguardSecure ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoItem}>
            Enrolled Biometrics:{' '}
            {diagnosticInfo.enrolledBiometrics.join(', ') || 'None'}
          </Text>
          {diagnosticInfo.lastError && (
            <Text style={[styles.infoItem, styles.errorText]}>
              Last Error: {diagnosticInfo.lastError}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <View style={styles.infoContainer}>
          <Text
            style={[
              styles.infoItem,
              testResult.success ? styles.successText : styles.errorText,
            ]}
          >
            Overall Status: {testResult.success ? 'PASS' : 'FAIL'}
          </Text>

          <Text style={styles.subTitle}>Test Results:</Text>
          <Text style={styles.infoItem}>
            Sensor Available:{' '}
            {testResult?.results?.sensorAvailable ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoItem}>
            Can Authenticate:{' '}
            {testResult?.results?.canAuthenticate ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoItem}>
            Hardware Detected:{' '}
            {testResult?.results?.hardwareDetected ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoItem}>
            Has Enrolled Biometrics:{' '}
            {testResult?.results?.hasEnrolledBiometrics ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.infoItem}>
            Secure Hardware:{' '}
            {testResult?.results?.secureHardware ? 'Yes' : 'No'}
          </Text>

          {testResult?.errors?.length > 0 && (
            <>
              <Text style={[styles.subTitle, styles.errorText]}>Errors:</Text>
              {testResult.errors.map((error, index) => (
                <Text key={index} style={[styles.infoItem, styles.errorText]}>
                  • {error}
                </Text>
              ))}
            </>
          )}

          {testResult?.warnings?.length > 0 && (
            <>
              <Text style={[styles.subTitle, styles.warningText]}>
                Warnings:
              </Text>
              {testResult.warnings.map((warning, index) => (
                <Text key={index} style={[styles.infoItem, styles.warningText]}>
                  • {warning}
                </Text>
              ))}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Debugging Utilities</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGetDiagnosticInfo}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Get Diagnostic Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRunBiometricTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Run Biometric Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            debugMode ? styles.buttonActive : styles.button,
          ]}
          onPress={handleToggleDebugMode}
        >
          <Text style={styles.buttonText}>
            {debugMode ? 'Disable' : 'Enable'} Debug Mode
          </Text>
        </TouchableOpacity>
      </View>

      {renderDiagnosticInfo()}
      {renderTestResult()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  infoContainer: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  successText: {
    color: '#34C759',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  warningText: {
    color: '#FF9500',
    fontWeight: '600',
  },
});

export default DebuggingExample;
