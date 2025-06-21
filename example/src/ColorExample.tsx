/**
 * Color Demo Component for React Native Biometrics Logging
 *
 * This React component demonstrates the colored console output feature
 * Usage: Import and render this component in your React Native app
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  logger,
  LogLevel,
  configureLogger,
} from '@sbaiahmed1/react-native-biometrics';

interface ColorDemoProps {
  title?: string;
}

/**
 * ColorDemo Component
 * Demonstrates colored logging output in React Native
 *
 * Example usage in your App.tsx:
 * import ColorDemo from './src/examples/color-demo';
 *
 * export default function App() {
 *  return <ColorDemo title="RN Biometrics Color Demo" />;
 *  }
 */
const ColorDemo: React.FC<ColorDemoProps> = ({
  title = 'Color Logging Demo',
}) => {
  const [colorsEnabled, setColorsEnabled] = useState(true);
  const [logOutput, setLogOutput] = useState<string[]>([]);

  useEffect(() => {
    // Configure logger with colors enabled by default
    configureLogger({
      enabled: true,
      level: LogLevel.DEBUG,
      useColors: colorsEnabled,
      prefix: '[RNBiometrics]',
      includeTimestamp: true,
      includeContext: true,
    });
  }, [colorsEnabled]);

  const runColorDemo = () => {
    const output: string[] = [];

    output.push(`🎨 ${title}`);
    output.push('');
    output.push(`=== ${colorsEnabled ? 'Colored' : 'Non-Colored'} Output ===`);

    // Demonstrate different log levels
    logger.debug('Debug message - appears in gray', 'ColorDemo');
    output.push('🔍 DEBUG: Debug message logged to console');

    logger.info('Info message - appears in blue', 'ColorDemo');
    output.push('ℹ️  INFO: Info message logged to console');

    logger.warn('Warning message - appears in yellow/orange', 'ColorDemo');
    output.push('⚠️  WARN: Warning message logged to console');

    logger.error(
      'Error message - appears in red',
      'ColorDemo',
      new Error('Sample error')
    );
    output.push('❌ ERROR: Error message logged to console');

    output.push('');
    output.push('=== Color Scheme Reference ===');
    output.push('🔍 DEBUG: Gray text for debugging information');
    output.push('ℹ️  INFO: Blue text for informational messages');
    output.push('⚠️  WARN: Yellow/Orange text for warnings');
    output.push('❌ ERROR: Red text for errors');
    output.push('🏷️  PREFIX: Cyan text for logger prefix');
    output.push('⏰ METADATA: Dimmed text for timestamps and context');

    setLogOutput(output);
  };

  const toggleColors = () => {
    setColorsEnabled(!colorsEnabled);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.section}>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.button,
              colorsEnabled ? styles.buttonActive : styles.buttonInactive,
            ]}
            onPress={toggleColors}
          >
            <Text style={styles.buttonText}>
              Colors: {colorsEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={runColorDemo}>
            <Text style={styles.buttonText}>Run Demo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={[styles.output, !logOutput.length && styles.displayNone]}
        >
          {logOutput.map((line, index) => (
            <Text key={index} style={styles.outputLine}>
              {line}
            </Text>
          ))}
        </ScrollView>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            💡 Check your console/debugger to see the actual colored output!
          </Text>
          <Text style={styles.noteText}>
            Colors are visible in Metro bundler console, React Native debugger,
            and development tools that support ANSI color codes.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 15,
    padding: 20,
    marginHorizontal: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  displayNone: { display: 'none' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '49%',
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  buttonActive: {
    backgroundColor: '#34C759',
  },
  buttonInactive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  output: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  outputLine: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 5,
    color: '#333',
  },
  note: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  noteText: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 5,
  },
});

export default ColorDemo;
