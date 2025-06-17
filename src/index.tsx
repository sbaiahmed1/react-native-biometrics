import ReactNativeBiometrics from './NativeReactNativeBiometrics';

export function isSensorAvailable(): Promise<{
  available: boolean;
  biometryType?: BiometricSensorInfo['biometryType'];
  error?: string;
}> {
  return ReactNativeBiometrics.isSensorAvailable();
}

export function simplePrompt(promptMessage: string): Promise<boolean> {
  return ReactNativeBiometrics.simplePrompt(promptMessage);
}

export function authenticateWithOptions(
  options: BiometricAuthOptions
): Promise<BiometricAuthResult> {
  return ReactNativeBiometrics.authenticateWithOptions(options);
}

export function createKeys(): Promise<{
  publicKey: string;
}> {
  return ReactNativeBiometrics.createKeys();
}

export function deleteKeys(): Promise<{
  success: boolean;
}> {
  return ReactNativeBiometrics.deleteKeys();
}

// Debugging utilities
export function getDiagnosticInfo(): Promise<DiagnosticInfo> {
  return ReactNativeBiometrics.getDiagnosticInfo();
}

export function runBiometricTest(): Promise<BiometricTestResult> {
  return ReactNativeBiometrics.runBiometricTest();
}

export function setDebugMode(enabled: boolean): Promise<void> {
  return ReactNativeBiometrics.setDebugMode(enabled);
}

// Export types for TypeScript users
export type BiometricSensorInfo = {
  available: boolean;
  biometryType?: 'Biometrics' | 'FaceID' | 'TouchID' | 'None' | 'Unknown';
  error?: string;
};

export type BiometricAuthOptions = {
  title?: string;
  subtitle?: string;
  description?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  allowDeviceCredentials?: boolean;
};

export type BiometricAuthResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
};

export type KeyCreationResult = {
  publicKey: string;
};

export type KeyDeletionResult = {
  success: boolean;
};

export type DiagnosticInfo = {
  platform: string;
  osVersion: string;
  deviceModel: string;
  biometricCapabilities: string[];
  securityLevel: string;
  keyguardSecure: boolean;
  enrolledBiometrics: string[];
  lastError?: string;
};

export type BiometricTestResult = {
  success: boolean;
  results: {
    sensorAvailable: boolean;
    canAuthenticate: boolean;
    hardwareDetected: boolean;
    hasEnrolledBiometrics: boolean;
    secureHardware: boolean;
  };
  errors: string[];
  warnings: string[];
};
