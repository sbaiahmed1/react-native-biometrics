import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  createKeys,
  deleteKeys,
  validateKeyIntegrity,
  verifyKeySignature,
  validateSignature,
  getKeyAttributes,
} from '@sbaiahmed1/react-native-biometrics';
import type {
  KeyIntegrityResult,
  SignatureResult,
  SignatureValidationResult,
  KeyAttributesResult,
} from '@sbaiahmed1/react-native-biometrics';

interface IntegrityTestResult {
  test: string;
  result: any;
  success: boolean;
  error?: string;
  timestamp: string;
}

const KeyIntegrityDemo: React.FC = () => {
  const [keyAlias, setKeyAlias] = useState<string>('demo-key');
  const [testData, setTestData] = useState<string>('Hello, secure world!');
  const [signature, setSignature] = useState<string>('');
  const [testResults, setTestResults] = useState<IntegrityTestResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const handleCreateKeys = async () => {
    setIsLoading(true);
    try {
      const result = await createKeys(keyAlias);
      // Clear signature since new keys invalidate existing signatures
      setSignature('');
      addTestResult('Create Keys', result, true);
    } catch (error) {
      addTestResult(
        'Create Keys',
        null,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKeys = async () => {
    setIsLoading(true);
    try {
      const result = await deleteKeys(keyAlias);
      // Clear signature since keys are deleted
      setSignature('');
      addTestResult('Delete Keys', result, result.success);
    } catch (error) {
      addTestResult(
        'Delete Keys',
        null,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateKeyIntegrity = async () => {
    setIsLoading(true);
    try {
      const result: KeyIntegrityResult = await validateKeyIntegrity(keyAlias);
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

  const testSignData = async () => {
    setIsLoading(true);
    try {
      const result: SignatureResult = await verifyKeySignature(
        keyAlias,
        testData
      );
      if (result.success && result.signature) {
        setSignature(result.signature);
        addTestResult('Verify Key Signature', result, result.success);
      } else {
        // Clear signature if generation failed
        setSignature('');
        addTestResult(
          'Verify Key Signature',
          result,
          false,
          result.success
            ? 'Signature generation returned empty signature'
            : 'Signature generation failed'
        );
      }
    } catch (error) {
      // Clear signature on error
      setSignature('');
      addTestResult(
        'Verify Key Signature',
        null,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateSignature = async () => {
    if (!signature || signature.trim() === '') {
      addTestResult(
        'Validate Signature',
        null,
        false,
        'No signature available. Please generate a signature first using "Generate Signature" button.'
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log('Validating signature:', {
        keyAlias,
        testData,
        signatureLength: signature.length,
        signaturePreview: signature.substring(0, 50) + '...',
      });

      const result: SignatureValidationResult = await validateSignature(
        keyAlias,
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

  const testGetKeyAttributes = async () => {
    setIsLoading(true);
    try {
      const result: KeyAttributesResult = await getKeyAttributes(keyAlias);
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

  const runComprehensiveTest = async () => {
    setIsLoading(true);
    clearResults();

    const tests = [
      { name: 'Create Keys', fn: () => handleCreateKeys() },
      {
        name: 'Validate Key Integrity',
        fn: () => handleValidateKeyIntegrity(),
      },
      { name: 'Get Key Attributes', fn: () => testGetKeyAttributes() },
      { name: 'Sign Data', fn: () => testSignData() },
      { name: 'Validate Signature', fn: () => handleValidateSignature() },
      { name: 'Delete Keys', fn: () => handleDeleteKeys() },
    ];

    for (const test of tests) {
      try {
        await test.fn();
        // Small delay between tests for better UX
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Key Integrity Validation Demo</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Key Alias:</Text>
          <TextInput
            style={styles.input}
            value={keyAlias}
            onChangeText={(text) => {
              setKeyAlias(text);
              // Clear signature when key alias changes
              setSignature('');
            }}
            placeholder="Enter key alias"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Test Data:</Text>
          <TextInput
            style={styles.input}
            value={testData}
            onChangeText={(text) => {
              setTestData(text);
              // Clear signature when test data changes
              setSignature('');
            }}
            placeholder="Enter test data"
            multiline
          />
        </View>
        {signature && (
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureLabel}>Generated Signature:</Text>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureText}>{signature}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Management</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={handleCreateKeys}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔑 Create Keys</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.dangerButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={handleDeleteKeys}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🗑️ Delete Keys</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrity Validation</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.successButton,
              styles.largeButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={handleValidateKeyIntegrity}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔍 Validate Key Integrity</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.infoButton,
              styles.largeButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={testGetKeyAttributes}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>📋 Get Key Attributes</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signature Operations</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.warningButton,
              styles.largeButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={testSignData}
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
              (isLoading || !signature) && styles.disabledButton,
            ]}
            onPress={handleValidateSignature}
          >
            <Text style={styles.buttonText}>✅ Validate Signature</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automated Testing</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              styles.largeButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={runComprehensiveTest}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.largeButtonText]}>
              🚀 Run Full Integrity Test
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              styles.largeButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={clearResults}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🧹 Clear Results</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⏳ Processing...</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Test Results ({testResults.length})
        </Text>
        <View style={styles.resultsContainer}>
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
                <View>
                  {result.test === 'Validate Key Integrity' &&
                    result.result.integrityChecks && (
                      <View>
                        <Text style={styles.resultSubHeader}>
                          Integrity Checks:
                        </Text>
                        <Text style={styles.resultDetails}>
                          {JSON.stringify(
                            result.result.integrityChecks,
                            null,
                            2
                          )}
                        </Text>
                      </View>
                    )}

                  {result.test === 'Get Key Attributes' &&
                    result.result.attributes && (
                      <View>
                        <Text style={styles.resultSubHeader}>
                          Key Attributes:
                        </Text>
                        <Text style={styles.resultDetails}>
                          {JSON.stringify(result.result.attributes, null, 2)}
                        </Text>
                      </View>
                    )}

                  <View style={styles.rawResultContainer}>
                    <Text style={styles.resultSubHeader}>Raw Result:</Text>
                    <Text style={styles.rawResultText}>
                      {JSON.stringify(result.result, null, 2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.securityFeaturesContainer}>
        <Text style={styles.securityFeaturesTitle}>🛡️ Security Features</Text>
        <Text style={styles.featureItem}>
          • <Text style={styles.featureBold}>Key Integrity Validation:</Text>{' '}
          Comprehensive checks for key format, accessibility, and cryptographic
          validity
        </Text>
        <Text style={styles.featureItem}>
          • <Text style={styles.featureBold}>Hardware-Backed Security:</Text>{' '}
          Verification of hardware security module usage
        </Text>
        <Text style={styles.featureItem}>
          •{' '}
          <Text style={styles.featureBold}>
            Signature Generation & Validation:
          </Text>{' '}
          End-to-end cryptographic signature testing
        </Text>
        <Text style={styles.featureItem}>
          • <Text style={styles.featureBold}>Key Attribute Inspection:</Text>{' '}
          Detailed analysis of key properties and security parameters
        </Text>
        <Text style={styles.featureItem}>
          • <Text style={styles.featureBold}>Real-time Monitoring:</Text> Live
          feedback on security operations and integrity status
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 5,
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 8,
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
    color: '#343a40',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  signatureContainer: {
    marginTop: 15,
  },
  signatureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 5,
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 10,
    minWidth: '48%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  darkText: {
    color: '#000000',
  },
  primaryButton: {
    backgroundColor: '#007bff',
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
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: '100%',
  },
  largeButtonText: {
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
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
  resultsContainer: {},
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
  resultSubHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 10,
    marginBottom: 5,
  },
  resultDetails: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  rawResultContainer: {
    marginTop: 10,
  },
  rawResultText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#495057',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
  },
  securityFeaturesContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  securityFeaturesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    lineHeight: 20,
  },
  featureBold: {
    fontWeight: 'bold',
  },
  attributeText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  checkText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  checkContainer: {
    marginLeft: 20,
    marginTop: 8,
  },
  attributeContainer: {
    marginLeft: 20,
    marginTop: 8,
  },
});

export default KeyIntegrityDemo;
