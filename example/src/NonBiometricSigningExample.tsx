import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import {
  createKeys,
  createKeysWithOptions,
  keyExists,
  getPublicKey,
  sign,
  deleteKeys,
  validateSignature,
  SignatureAlgorithm,
} from '@sbaiahmed1/react-native-biometrics';
import { useState } from 'react';

const NO_AUTH_KEY_ALIAS = 'example-noauth-signing-key';
const BIOMETRIC_KEY_ALIAS = 'example-biometric-key';
const TEST_PAYLOAD = 'payload signed without a biometric prompt';

const NonBiometricSigningExample = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [keyPresent, setKeyPresent] = useState<boolean | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [lastSignatureAlgorithm, setLastSignatureAlgorithm] =
    useState<SignatureAlgorithm | null>(null);

  const handleCreateNoAuthKey = async () => {
    setIsLoading(true);
    try {
      const result = await createKeysWithOptions({
        keyAlias: NO_AUTH_KEY_ALIAS,
        keyType: 'rsa2048',
        requireAuthentication: false,
      });
      console.log('No-auth key created:', result);
      setKeyPresent(true);
      Alert.alert(
        'Key Created',
        'RSA-2048 key created without authentication requirement — no prompt appeared and none will appear when signing.'
      );
    } catch (error) {
      console.log('No-auth key creation error:', error);
      Alert.alert('Error', `Key creation failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyExists = async () => {
    setIsLoading(true);
    try {
      const exists = await keyExists(NO_AUTH_KEY_ALIAS);
      console.log('keyExists:', exists);
      setKeyPresent(exists);
      Alert.alert('Key Exists', exists ? 'Yes' : 'No');
    } catch (error) {
      console.log('keyExists error:', error);
      Alert.alert('Error', `Existence check failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetPublicKey = async () => {
    setIsLoading(true);
    try {
      const result = await getPublicKey(NO_AUTH_KEY_ALIAS);
      console.log('getPublicKey:', result);
      setPublicKey(result.publicKey);
      Alert.alert(
        'Public Key (SPKI DER)',
        `Type: ${result.keyType}\n${result.publicKey.substring(0, 80)}…`
      );
    } catch (error) {
      console.log('getPublicKey error:', error);
      Alert.alert('Error', `Public key retrieval failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async (algorithm?: SignatureAlgorithm) => {
    const selectedAlgorithm = algorithm ?? SignatureAlgorithm.SHA256withRSA;
    setIsLoading(true);
    try {
      const result = await sign({
        keyAlias: NO_AUTH_KEY_ALIAS,
        data: TEST_PAYLOAD,
        algorithm: selectedAlgorithm,
      });
      console.log('sign result:', result);
      if (result.success && result.signature) {
        setLastSignature(result.signature);
        setLastSignatureAlgorithm(selectedAlgorithm);
        Alert.alert(
          'Signed Without Prompt',
          `Algorithm: ${selectedAlgorithm}\nSignature: ${result.signature.substring(0, 60)}…`
        );
      } else {
        Alert.alert(
          'Signing Failed',
          `${result.error || 'Unknown error'} (${result.errorCode || 'no code'})`
        );
      }
    } catch (error) {
      console.log('sign error:', error);
      Alert.alert('Error', `Signing failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateSignature = async () => {
    if (!lastSignature) {
      Alert.alert('Error', 'Sign something first');
      return;
    }
    // validateSignature verifies with SHA-256 only
    if (lastSignatureAlgorithm !== SignatureAlgorithm.SHA256withRSA) {
      Alert.alert(
        'Unsupported',
        `validateSignature only verifies SHA-256 signatures; the last signature used ${lastSignatureAlgorithm}. Verify SHA-512 signatures server-side (e.g. openssl dgst -sha512 -verify).`
      );
      return;
    }
    setIsLoading(true);
    try {
      const result = await validateSignature(
        NO_AUTH_KEY_ALIAS,
        TEST_PAYLOAD,
        lastSignature
      );
      console.log('validateSignature:', result);
      Alert.alert('Validation', result.valid ? 'Signature valid' : 'INVALID');
    } catch (error) {
      console.log('validateSignature error:', error);
      Alert.alert('Error', `Validation failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignWithBiometricKey = async () => {
    setIsLoading(true);
    try {
      // Create a normal biometric-gated key, then show that the prompt-free
      // sign() refuses it with KEY_REQUIRES_AUTHENTICATION instead of prompting.
      await createKeys(BIOMETRIC_KEY_ALIAS);
      const result = await sign({
        keyAlias: BIOMETRIC_KEY_ALIAS,
        data: TEST_PAYLOAD,
      });
      console.log('sign on biometric key:', result);
      Alert.alert(
        'Expected Failure',
        `success: ${result.success}\nerrorCode: ${result.errorCode}\n(${result.error})`
      );
    } catch (error) {
      console.log('biometric key negative test error:', error);
      Alert.alert('Error', `Negative test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKeys = async () => {
    setIsLoading(true);
    try {
      await deleteKeys(NO_AUTH_KEY_ALIAS);
      await deleteKeys(BIOMETRIC_KEY_ALIAS);
      setKeyPresent(false);
      setPublicKey(null);
      setLastSignature(null);
      setLastSignatureAlgorithm(null);
      Alert.alert('Deleted', 'Example keys removed');
    } catch (error) {
      console.log('deleteKeys error:', error);
      Alert.alert('Error', `Deletion failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Non-Biometric Signing (RSA Keychain/Keystore)
        </Text>
        <Text style={styles.info}>
          Keystore/Keychain-backed keys usable without any biometric prompt.
        </Text>
        {keyPresent !== null && (
          <Text style={styles.info}>
            Key exists: {keyPresent ? 'Yes' : 'No'}
          </Text>
        )}
        {publicKey && (
          <Text style={styles.publicKey} numberOfLines={3}>
            {publicKey}
          </Text>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleCreateNoAuthKey}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Create No-Auth RSA Key</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleKeyExists}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Check Key Exists</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleGetPublicKey}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Get Public Key (SPKI)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.signButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={() => handleSign()}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Sign (SHA256withRSA)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.signButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={() => handleSign(SignatureAlgorithm.SHA512withRSA)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Sign (SHA512withRSA)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleValidateSignature}
            disabled={isLoading || !lastSignature}
          >
            <Text style={styles.buttonText}>Validate Last Signature</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.negativeButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSignWithBiometricKey}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              sign() on Biometric Key (expected failure)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.deleteButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleDeleteKeys}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Delete Example Keys</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default NonBiometricSigningExample;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  signButton: {
    backgroundColor: '#34C759',
  },
  negativeButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  publicKey: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
  },
});
