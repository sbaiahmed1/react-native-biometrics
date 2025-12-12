import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import {
  subscribeToBiometricChanges,
  unsubscribeFromBiometricChanges,
} from '../src/index';
import type { BiometricChangeEvent } from '../src/index';
import type { EventSubscription } from 'react-native';

interface BiometricState {
  available: boolean;
  biometryType?: string;
  lastChangeType?: string;
  lastChangeTime?: string;
}

const BiometricChangeExample: React.FC = () => {
  const [biometricState, setBiometricState] = useState<BiometricState>({
    available: false,
  });
  const [isListening, setIsListening] = useState(false);
  const [subscription, setSubscription] = useState<EventSubscription | null>(
    null
  );

  const handleBiometricChange = (event: BiometricChangeEvent) => {
    console.log('Biometric change detected:', event);

    setBiometricState({
      available: event.available,
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
  };

  const startListening = useCallback(() => {
    if (!isListening) {
      const sub = subscribeToBiometricChanges(handleBiometricChange);
      setSubscription(sub);
      console.log(sub);

      setIsListening(true);
      console.log('Started listening for biometric changes');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (isListening && subscription) {
      unsubscribeFromBiometricChanges(subscription);
      setSubscription(null);
      setIsListening(false);
      console.log('Stopped listening for biometric changes');
    }
  }, [isListening, subscription]);

  useEffect(() => {
    // Auto-start listening when component mounts
    startListening();

    // Cleanup on unmount
    return () => {
      stopListening();
    };
  }, [startListening, stopListening]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Biometric Change Detection</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Current Status:</Text>
        <Text style={styles.statusText}>
          Available: {biometricState.available ? 'Yes' : 'No'}
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
