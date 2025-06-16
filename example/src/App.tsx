import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
  isSensorAvailable,
  simplePrompt,
  createKeys,
  deleteKeys,
  type BiometricSensorInfo,
} from '@sbaiahmed1/react-native-biometrics';

export default function App() {
  const [result, setResult] = useState<
    BiometricSensorInfo['biometryType'] | undefined
  >();
  const [sensorInfo, setSensorInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSensorAvailability();
  }, []);

  const checkSensorAvailability = async () => {
    try {
      const info = await isSensorAvailable();
      console.log('info', info);
      setResult(info.biometryType);

      setSensorInfo(info);
    } catch (error) {
      console.error('Error checking sensor:', error);
    }
  };

  const handleAuthenticate = async () => {
    if (!sensorInfo?.available) {
      Alert.alert('Error', 'Biometric sensor not available');
      return;
    }

    setIsLoading(true);
    try {
      const result = await simplePrompt('Please authenticate to continue');
      console.log('result', result);

      Alert.alert('Success', 'Authentication successful!');
    } catch (error) {
      console.log('error', error);

      Alert.alert('Error', 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKeys = async () => {
    setIsLoading(true);
    try {
      const result = await createKeys();
      Alert.alert('Success', 'Biometric keys created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKeys = async () => {
    setIsLoading(true);
    try {
      const result = await deleteKeys();
      Alert.alert('Success', 'Biometric keys deleted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete keys');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Biometrics</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Multiply Test</Text>
        <Text style={styles.result}>Result: {result}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biometric Sensor</Text>
        <Text style={styles.info}>
          Available: {sensorInfo?.available ? 'Yes' : 'No'}
        </Text>
        {sensorInfo?.biometryType && (
          <Text style={styles.info}>Type: {sensorInfo.biometryType}</Text>
        )}
        {sensorInfo?.error && (
          <Text style={styles.error}>Error: {sensorInfo.error}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAuthenticate}
          disabled={isLoading || !sensorInfo?.available}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Authenticate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCreateKeys}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Create Keys'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleDeleteKeys}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Delete Keys'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  result: {
    color: 'red'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 50,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
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
  error: {
    color: '#FF3B30',
  },
  publicKey: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
  },
});
