import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import {
  isSensorAvailable,
  simplePrompt,
  authenticateWithOptions,
  BiometricStrength,
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

  const checkSensorAvailabilityWeak = async () => {
    try {
      const info = await isSensorAvailable({
        biometricStrength: BiometricStrength.Weak,
      });
      console.log('Weak biometric info', info);
      Alert.alert(
        'Weak Biometric Check',
        `Available: ${info.available ? 'Yes' : 'No'}\nType: ${info.biometryType || 'None'}`
      );
    } catch (error) {
      console.error('Error checking weak sensor:', error);
      Alert.alert('Error', 'Failed to check weak biometric sensor');
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
      if (result.success) {
        Alert.alert('Success', 'Enhanced authentication successful!');
      } else {
        Alert.alert(
          'Failed',
          `Authentication failed: ${result.error || 'Unknown error'}`
        );
      }
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

  const handleAuthenticateWithOptionsWeak = async () => {
    setIsLoading(true);
    try {
      const result = await authenticateWithOptions({
        title: 'Weak Biometric Authentication',
        subtitle: 'Verify your identity with Class 2 biometrics',
        description:
          'This demonstrates weak biometric authentication (BIOMETRIC_WEAK)',
        cancelLabel: 'Not Now',
        fallbackLabel: 'Use Password',
        allowDeviceCredentials: true,
        disableDeviceFallback: false,
        biometricStrength: BiometricStrength.Weak,
      });

      console.log('Weak biometric auth result:', result);

      if (result.success) {
        Alert.alert('Success', 'Weak biometric authentication successful!');
      } else {
        Alert.alert(
          'Failed',
          `Authentication failed: ${result.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.log('Weak biometric auth error:', error);
      Alert.alert('Error', 'Weak biometric authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticateWithFallback = async () => {
    if (!sensorInfo?.available) {
      Alert.alert('Error', 'Biometric sensor not available');
      return;
    }

    setIsLoading(true);
    try {
      // First try with strong biometrics
      const result = await authenticateWithOptions({
        title: 'Fallback Authentication',
        subtitle: 'Trying strong biometrics first',
        description:
          'Will automatically fallback to weak if strong is unavailable',
        cancelLabel: 'Cancel',
        biometricStrength: BiometricStrength.Strong,
      });

      console.log('Fallback auth result:', result);

      if (result.success) {
        const strengthUsed = result.biometricStrength || 'strong';
        const fallbackMessage = result.fallbackUsed
          ? `Authentication successful using ${strengthUsed} biometrics (fallback occurred)`
          : `Authentication successful using ${strengthUsed} biometrics`;
        Alert.alert('Success', fallbackMessage);
      } else {
        Alert.alert(
          'Failed',
          `Authentication failed: ${result.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.log('Fallback auth error:', error);
      Alert.alert('Error', 'Fallback authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Biometrics</Text>
      <View style={styles.section}>
        <View>
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

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: '#FF9500' },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={checkSensorAvailabilityWeak}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Check Weak Biometric</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: '#FF6B35' },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleAuthenticateWithOptionsWeak}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Processing...' : 'Weak Biometric Auth'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.fallbackButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleAuthenticateWithFallback}
            disabled={isLoading || !sensorInfo?.available}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Processing...' : 'Test Fallback (Strong→Weak)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AuthExample;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  fallbackButton: {
    backgroundColor: '#FF9500',
  },
});
