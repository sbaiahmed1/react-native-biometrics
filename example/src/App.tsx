import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import DebuggingExample from './DebuggingExample';
import KeyAliasExample from './KeyAliasExample';
import AuthExample from './AuthExample';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <DebuggingExample />
        <KeyAliasExample />
        <AuthExample />
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
