import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import DebuggingExample from './DebuggingExample';
import KeyAliasExample from './KeyAliasExample';
import AuthExample from './AuthExample';
import ColorDemo from './color-demo';
import KeyIntegrityDemo from '../../src/examples/key-integrity-demo';
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <DebuggingExample />
        <AuthExample />
        <ColorDemo />
        <KeyAliasExample />
        <KeyIntegrityDemo />
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
