import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  configureKeyAlias,
  getDefaultKeyAlias,
  createKeys,
  deleteKeys,
  getAllKeys,
  validateKeyIntegrity,
  verifyKeySignature,
  validateSignature,
  getKeyAttributes,
  getDeviceIntegrityStatus,
  type KeyIntegrityResult,
  type SignatureResult,
  type SignatureValidationResult,
  type KeyAttributesResult,
  type DeviceIntegrityResult,
} from '@sbaiahmed1/react-native-biometrics';

interface TestResult {
  test: string;
  result: any;
  success: boolean;
  error?: string;
  timestamp: string;
}

export default function CombinedBiometricsDemo() {
  const [currentKeyAlias, setCurrentKeyAlias] = useState<string>('');
  const [customKeyAlias, setCustomKeyAlias] = useState<string>('');
  const [selectedKeyType, setSelectedKeyType] = useState<'rsa2048' | 'ec256'>(
    'ec256'
  );
  const [testData, setTestData] = useState<string>('Hello, secure world!');
  const [signature, setSignature] = useState<string>('');
  const [allKeys, setAllKeys] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrentKeyAlias();
    loadAllKeys();
  }, []);

  const loadCurrentKeyAlias = async () => {
    try {
      const defaultAlias = await getDefaultKeyAlias();
      setCurrentKeyAlias(defaultAlias);
    } catch (error) {
      console.error('Error getting default key alias:', error);
    }
  };

  const loadAllKeys = async () => {
    try {
      const result = await getAllKeys();
      setAllKeys(result.keys);
    } catch (error) {
      console.error('Error getting all keys:', error);
      setAllKeys([]);
    }
  };

  const addTestResult = (
    test: string,
    result: any,
    success: boolean,
    error?: string
  ) => {
    setTestResults((prev) => [
      ...prev,
      {
        test,
        result,
        success,
        error,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const handleConfigureKeyAlias = async () => {
    if (!customKeyAlias.trim()) {
      Alert.alert('Error', 'Please enter a key alias');
      return;
    }

    setIsLoading(true);
    try {
      await configureKeyAlias(customKeyAlias.trim());
      await loadCurrentKeyAlias();
      Alert.alert('Success', `Key alias configured: ${customKeyAlias.trim()}`);
      setCustomKeyAlias('');
    } catch (error) {
      console.error('Error configuring key alias:', error);
      Alert.alert('Error', 'Failed to configure key alias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKeys = async (alias?: string) => {
    setIsLoading(true);
    try {
      const result = await createKeys(alias, selectedKeyType);
      setSignature(''); // Clear signature since new keys invalidate existing signatures
      await loadAllKeys();
      const message = alias
        ? `Keys created with alias: ${alias} (${selectedKeyType.toUpperCase()})`
        : `Keys created successfully! (${selectedKeyType.toUpperCase()})`;
      Alert.alert('Success', message);
      addTestResult('Create Keys', result, true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', 'Failed to create keys');
      addTestResult('Create Keys', null, false, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKeys = async (alias?: string) => {
    setIsLoading(true);
    try {
      const result = await deleteKeys(alias);
      setSignature(''); // Clear signature since keys are deleted
      await loadAllKeys();
      const message = alias
        ? `Keys deleted with alias: ${alias}`
        : 'Keys deleted successfully!';
      Alert.alert('Success', message);
      addTestResult('Delete Keys', result, result.success);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', 'Failed to delete keys');
      addTestResult('Delete Keys', null, false, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateKeyIntegrity = async () => {
    const alias = customKeyAlias.trim() || currentKeyAlias;
    setIsLoading(true);
    try {
      const result: KeyIntegrityResult = await validateKeyIntegrity(alias);
      addTestResult('Validate Key Integrity', result, result.valid);
    } catch (error) {
      addTestResult(
        'Validate Key Integrity',
        null,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSignature = async () => {
    const alias = customKeyAlias.trim() || currentKeyAlias;
    setIsLoading(true);
    try {
      const result: SignatureResult = await verifyKeySignature(alias, testData);
      if (result.success && result.signature) {
        setSignature(result.signature);
        addTestResult('Generate Signature', result, result.success);
      } else {
        setSignature('');
        addTestResult(
          'Generate Signature',
          result,
          false,
          'Signature generation failed'
        );
      }
    } catch (error) {
      setSignature('');
      addTestResult(
        'Generate Signature',
        null,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateSignature = async () => {
    if (!signature) {
      Alert.alert(
        'Error',
        'No signature available. Generate a signature first.'
      );
      return;
    }

    const alias = customKeyAlias.trim() || currentKeyAlias;
    setIsLoading(true);
    try {
      const result: SignatureValidationResult = await validateSignature(
        alias,
        testData,
        signature
      );
      addTestResult('Validate Signature', result, result.valid);
    } catch (error) {
      addTestResult(
        'Validate Signature',
        null,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetKeyAttributes = async () => {
    const alias = customKeyAlias.trim() || currentKeyAlias;
    setIsLoading(true);
    try {
      const result: KeyAttributesResult = await getKeyAttributes(alias);
      addTestResult('Get Key Attributes', result, result.exists);
    } catch (error) {
      addTestResult(
        'Get Key Attributes',
        null,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceIntegrityCheck = async () => {
    setIsLoading(true);
    try {
      const result: DeviceIntegrityResult = await getDeviceIntegrityStatus();
      addTestResult('Device Integrity Check', result, !result.isCompromised);

      // Show alert with device status
      const statusMessage = result.isCompromised
        ? `⚠️ Device Compromised!\nRisk Level: ${result.riskLevel}\n${result.isRooted ? 'Device is rooted' : ''}${result.isJailbroken ? 'Device is jailbroken' : ''}`
        : `✅ Device Secure\nRisk Level: ${result.riskLevel}`;

      Alert.alert('Device Integrity Status', statusMessage);
    } catch (error) {
      addTestResult(
        'Device Integrity Check',
        null,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const runComprehensiveTest = async () => {
    setIsLoading(true);
    clearResults();

    const alias = customKeyAlias.trim() || currentKeyAlias;
    const tests = [
      {
        name: 'Device Integrity Check',
        fn: () => handleDeviceIntegrityCheck(),
      },
      { name: 'Create Keys', fn: () => handleCreateKeys(alias) },
      {
        name: 'Validate Key Integrity',
        fn: () => handleValidateKeyIntegrity(),
      },
      { name: 'Get Key Attributes', fn: () => handleGetKeyAttributes() },
      { name: 'Generate Signature', fn: () => handleGenerateSignature() },
      { name: 'Validate Signature', fn: () => handleValidateSignature() },
    ];

    for (const test of tests) {
      try {
        await test.fn();
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        addTestResult(
          test.name,
          null,
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔐 Biometrics Key Management & Testing</Text>

      {/* Configuration Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <Text style={styles.info}>Current Key Alias: {currentKeyAlias}</Text>

        <TextInput
          style={styles.input}
          placeholderTextColor={'black'}
          placeholder="Enter custom key alias (optional)"
          value={customKeyAlias}
          onChangeText={(text) => {
            setCustomKeyAlias(text);
            setSignature(''); // Clear signature when alias changes
          }}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleConfigureKeyAlias}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Configure Key Alias</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Test data for signatures"
          placeholderTextColor={'black'}
          value={testData}
          onChangeText={(text) => {
            setTestData(text);
            setSignature(''); // Clear signature when test data changes
          }}
          multiline
        />
      </View>

      {/* Key Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Management</Text>

        {/* Key Type Selector */}
        <View style={styles.keyTypeSelector}>
          <Text style={styles.keyTypeSelectorLabel}>Key Type:</Text>
          <View style={styles.keyTypeOptions}>
            <TouchableOpacity
              style={[
                styles.keyTypeOption,
                selectedKeyType === 'ec256' && styles.keyTypeOptionSelected,
              ]}
              onPress={() => setSelectedKeyType('ec256')}
            >
              <Text
                style={[
                  styles.keyTypeOptionText,
                  selectedKeyType === 'ec256' &&
                    styles.keyTypeOptionTextSelected,
                ]}
              >
                EC256
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.keyTypeOption,
                selectedKeyType === 'rsa2048' && styles.keyTypeOptionSelected,
              ]}
              onPress={() => setSelectedKeyType('rsa2048')}
            >
              <Text
                style={[
                  styles.keyTypeOptionText,
                  selectedKeyType === 'rsa2048' &&
                    styles.keyTypeOptionTextSelected,
                ]}
              >
                RSA2048
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={() => handleCreateKeys(customKeyAlias.trim() || undefined)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔑 Create Keys</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.dangerButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={() => handleDeleteKeys(customKeyAlias.trim() || undefined)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🗑️ Delete Keys</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Testing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Testing</Text>
        <TouchableOpacity
          style={[
            styles.button,
            styles.warningButton,
            styles.largeButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleDeviceIntegrityCheck}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.darkText]}>
            🛡️ Check Device Integrity
          </Text>
        </TouchableOpacity>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.successButton,
              styles.largeButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleValidateKeyIntegrity}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔍 Validate Integrity</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.infoButton,
              styles.largeButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleGetKeyAttributes}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>📋 Get Attributes</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.largeButton,
              styles.warningButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleGenerateSignature}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.darkText]}>
              ✍️ Generate Signature
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.purpleButton,
              styles.largeButton,
              (isLoading || !signature) && styles.buttonDisabled,
            ]}
            onPress={handleValidateSignature}
            disabled={isLoading || !signature}
          >
            <Text style={styles.buttonText}>✅ Validate Signature</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Automated Testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automated Testing</Text>
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            styles.largeButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={runComprehensiveTest}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.largeButtonText]}>
            🚀 Run Full Test Suite
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🧹 Clear Results</Text>
        </TouchableOpacity>
      </View>

      {/* Current Signature Display */}
      {signature && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generated Signature</Text>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureText}>{signature}</Text>
          </View>
        </View>
      )}

      {/* All Keys Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Keys ({allKeys.length})</Text>
        <TouchableOpacity style={styles.button} onPress={loadAllKeys}>
          <Text style={styles.buttonText}>Refresh Keys List</Text>
        </TouchableOpacity>
        {allKeys.map((key, index) => (
          <View key={index} style={styles.keyItem}>
            <Text style={styles.keyAlias}>Alias: {key.alias}</Text>
            <Text style={styles.keyPublic} numberOfLines={2}>
              Public Key: {key.publicKey.substring(0, 50)}...
            </Text>
          </View>
        ))}
        {allKeys.length === 0 && (
          <Text style={styles.noKeys}>No keys found</Text>
        )}
      </View>

      {/* Test Results */}
      {testResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Test Results ({testResults.length})
          </Text>
          {testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                result.success ? styles.successResult : styles.errorResult,
              ]}
            >
              <Text style={styles.resultHeader}>
                {result.success ? '✅' : '❌'} {result.test} -{' '}
                {new Date(result.timestamp).toLocaleTimeString()}
              </Text>
              {result.error && (
                <Text style={styles.errorText}>Error: {result.error}</Text>
              )}
              {result.result && (
                <Text style={styles.resultDetails}>
                  {JSON.stringify(result.result, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⏳ Processing...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
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
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: 'black',
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '48%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  infoButton: {
    backgroundColor: '#17a2b8',
  },
  purpleButton: {
    backgroundColor: '#6f42c1',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  largeButton: {
    minWidth: '100%',
    paddingVertical: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  largeButtonText: {
    fontSize: 18,
  },
  darkText: {
    color: '#000000',
  },
  signatureBox: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    maxHeight: 80,
  },
  signatureText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#495057',
  },
  keyItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  keyAlias: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  keyPublic: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  noKeys: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
  },
  resultItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  errorResult: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  resultHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    color: '#721c24',
    marginBottom: 10,
  },
  resultDetails: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
  },
  keyTypeSelector: {
    marginBottom: 15,
  },
  keyTypeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  keyTypeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyTypeOption: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  keyTypeOptionSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  keyTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  keyTypeOptionTextSelected: {
    color: 'white',
  },
});
