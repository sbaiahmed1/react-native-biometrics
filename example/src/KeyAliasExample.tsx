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
  configure,
  configureKeyAlias,
  getDefaultKeyAlias,
  createKeys,
  deleteKeys,
  getAllKeys,
  type BiometricConfig,
} from '@sbaiahmed1/react-native-biometrics';

export default function KeyAliasExample() {
  const [currentKeyAlias, setCurrentKeyAlias] = useState<string>('');
  const [customKeyAlias, setCustomKeyAlias] = useState<string>('');
  const [allKeys, setAllKeys] = useState<any[]>([]);
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

  const handleConfigureWithObject = async () => {
    if (!customKeyAlias.trim()) {
      Alert.alert('Error', 'Please enter a key alias');
      return;
    }

    setIsLoading(true);
    try {
      const config: BiometricConfig = {
        keyAlias: customKeyAlias.trim(),
      };
      await configure(config);
      await loadCurrentKeyAlias();
      Alert.alert(
        'Success',
        `Library configured with key alias: ${customKeyAlias.trim()}`
      );
      setCustomKeyAlias('');
    } catch (error) {
      console.error('Error configuring library:', error);
      Alert.alert('Error', 'Failed to configure library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKeys = async () => {
    setIsLoading(true);
    try {
      await createKeys();
      Alert.alert('Success', 'Keys created successfully!');
      await loadAllKeys();
    } catch (error) {
      console.error('Error creating keys:', error);
      Alert.alert('Error', 'Failed to create keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKeysWithCustomAlias = async () => {
    if (!customKeyAlias.trim()) {
      Alert.alert('Error', 'Please enter a key alias');
      return;
    }

    setIsLoading(true);
    try {
      await createKeys(customKeyAlias.trim());
      Alert.alert(
        'Success',
        `Keys created with alias: ${customKeyAlias.trim()}`
      );
      await loadAllKeys();
      setCustomKeyAlias('');
    } catch (error) {
      console.error('Error creating keys:', error);
      Alert.alert('Error', 'Failed to create keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKeys = async () => {
    setIsLoading(true);
    try {
      await deleteKeys();
      Alert.alert('Success', 'Keys deleted successfully!');
      await loadAllKeys();
    } catch (error) {
      console.error('Error deleting keys:', error);
      Alert.alert('Error', 'Failed to delete keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKeysWithCustomAlias = async () => {
    if (!customKeyAlias.trim()) {
      Alert.alert('Error', 'Please enter a key alias');
      return;
    }

    setIsLoading(true);
    try {
      await deleteKeys(customKeyAlias.trim());
      Alert.alert(
        'Success',
        `Keys deleted with alias: ${customKeyAlias.trim()}`
      );
      await loadAllKeys();
      setCustomKeyAlias('');
    } catch (error) {
      console.error('Error deleting keys:', error);
      Alert.alert('Error', 'Failed to delete keys');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔑 Key Alias Configuration</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Configuration</Text>
        <Text style={styles.info}>Current Key Alias: {currentKeyAlias}</Text>
        <TouchableOpacity style={styles.button} onPress={loadCurrentKeyAlias}>
          <Text style={styles.buttonText}>Refresh Current Alias</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configure Key Alias</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={'black'}
          placeholder="Enter custom key alias (e.g., myapp.biometric.key)"
          value={customKeyAlias}
          onChangeText={setCustomKeyAlias}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleConfigureKeyAlias}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Configure Key Alias</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleConfigureWithObject}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Configure with Config Object</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Management</Text>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCreateKeys}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Create Keys (Default Alias)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleCreateKeysWithCustomAlias}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Create Keys (Custom Alias)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.dangerButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleDeleteKeys}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Delete Keys (Default Alias)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.dangerButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleDeleteKeysWithCustomAlias}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Delete Keys (Custom Alias)</Text>
        </TouchableOpacity>
      </View>

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
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
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
});
