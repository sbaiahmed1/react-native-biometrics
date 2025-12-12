import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import DebuggingExample from './DebuggingExample';
import AuthExample from './AuthExample';
import ColorDemo from './ColorExample';
import CombinedBiometricsDemo from './CombinedBiometricsDemo';
import BiometricChangeExample from '../BiometricChangeExample';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <BiometricChangeExample />
        <AuthExample />
        <ColorDemo />
        <CombinedBiometricsDemo />
        <DebuggingExample />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
});
