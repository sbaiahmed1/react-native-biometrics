import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BiometricChangeEvent } from '../src/index';
import {
  startBiometricChangeDetection,
  stopBiometricChangeDetection,
  subscribeToBiometricChanges,
} from '../src/index';

interface BiometricState {
  available: boolean;
  enrolled?: boolean;
  biometryType?: string;
  lastChangeType?: string;
  lastChangeTime?: string;
}

const BiometricChangeExample: React.FC = () => {
  const [biometricState, setBiometricState] = useState<BiometricState>({
    available: false,
  });
  const [isListening, setIsListening] = useState(false);

  const handleBiometricChange = useCallback((event: BiometricChangeEvent) => {
    console.log('Biometric change detected:', event);

    setBiometricState({
      available: event.available,
      enrolled: event.enrolled,
      biometryType: event.biometryType,
      lastChangeType: event.changeType,
      lastChangeTime: new Date(event.timestamp).toLocaleTimeString(),
    });

    // Show alert for significant changes
    if (
      event.changeType === 'ENROLLMENT_CHANGED' ||
      event.changeType === 'BIOMETRIC_DISABLED' ||
      event.changeType === 'BIOMETRIC_ENABLED'
    ) {
      Alert.alert(
        'Biometric Change Detected',
        `Change Type: ${event.changeType}\nBiometry: ${event.biometryType}\nAvailable: ${event.available}`,
        [{ text: 'OK' }]
      );
    }
  }, []);

  const handleStartDetection = async () => {
    try {
      console.log('Starting biometric change detection...');
      await startBiometricChangeDetection();
      setIsListening(true);
      subscribeToBiometricChanges(handleBiometricChange);
      console.log('Detection started');
      Alert.alert('Detection Started', 'Now monitoring for biometric changes');
    } catch (error) {
      console.error('Start failed:', error);
      Alert.alert('Start Failed', String(error));
    }
  };

  const handleStopDetection = async () => {
    try {
      console.log('Stopping biometric change detection...');
      await stopBiometricChangeDetection();
      console.log('Detection stopped');
      Alert.alert(
        'Detection Stopped',
        'No longer monitoring for biometric changes'
      );
      setIsListening(false);
    } catch (error) {
      console.error('Stop failed:', error);
      Alert.alert('Stop Failed', String(error));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Change Detection</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Current Status:</Text>
        <Text style={styles.statusText}>
          Available: {biometricState.available ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Enrolled: {biometricState.enrolled ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.statusText}>
          Type: {biometricState.biometryType || 'Unknown'}
        </Text>

        {biometricState.lastChangeType && (
          <>
            <Text style={styles.statusText}>
              Last Change: {biometricState.lastChangeType}
            </Text>
            <Text style={styles.statusText}>
              Time: {biometricState.lastChangeTime}
            </Text>
          </>
        )}
      </View>

      <View style={styles.listenerContainer}>
        <Text style={styles.listenerText}>
          Listener Status: {isListening ? 'Active' : 'Inactive'}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, styles.startButton]}
          onPress={handleStartDetection}
        >
          <Text style={styles.controlButtonText}>▶️ Start Detection</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={handleStopDetection}
        >
          <Text style={styles.controlButtonText}>⏹️ Stop Detection</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          • Go to device Settings → Biometrics/Face ID/Touch ID
        </Text>
        <Text style={styles.instructionsText}>
          • Add, remove, or modify biometric enrollments
        </Text>
        <Text style={styles.instructionsText}>
          • Return to this app to see change notifications
        </Text>
      </View>
    </View>
  );
};

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
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  listenerContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  listenerText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2d5a2d',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  controlButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#856404',
  },
  instructionsText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#856404',
  },
});

export default BiometricChangeExample;
