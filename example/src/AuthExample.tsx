import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import {
  isSensorAvailable,
  simplePrompt,
  authenticateWithOptions,
} from '@sbaiahmed1/react-native-biometrics';
import { useState, useEffect } from 'react';

const AuthExample = () => {
  const [sensorInfo, setSensorInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSensorAvailability();
  }, []);

  const checkSensorAvailability = async () => {
    try {
      const info = await isSensorAvailable();
      console.log('info', info);

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

  const handleAuthenticateWithOptions = async () => {
    if (!sensorInfo?.available) {
      Alert.alert('Error', 'Biometric sensor not available');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authenticateWithOptions({
        title: 'Enhanced Authentication',
        subtitle: 'Verify your identity with advanced options',
        description: 'This demonstrates the new enhanced authentication method',
        cancelLabel: 'Not Now',
        fallbackLabel: 'Use Password',
        allowDeviceCredentials: true,
        disableDeviceFallback: false,
      });

      console.log('Enhanced auth result:', result);

      if (result.success) {
        Alert.alert('Success', 'Enhanced authentication successful!');
      } else {
        Alert.alert(
          'Failed',
          `Authentication failed: ${result.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.log('Enhanced auth error:', error);
      Alert.alert('Error', 'Enhanced authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>React Native Biometrics</Text>
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
          style={[
            styles.button,
            styles.enhancedButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleAuthenticateWithOptions}
          disabled={isLoading || !sensorInfo?.available}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Processing...' : 'Enhanced Auth'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AuthExample;

const styles = StyleSheet.create({
  result: {
    color: 'red',
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
  enhancedButton: {
    backgroundColor: '#34C759',
  },
});
