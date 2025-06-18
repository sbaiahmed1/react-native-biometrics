import ReactNativeBiometrics from './NativeReactNativeBiometrics';

export function isSensorAvailable(): Promise<BiometricSensorInfo> {
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

export function createKeys(): Promise<KeyCreationResult> {
  return ReactNativeBiometrics.createKeys();
}

export function deleteKeys(): Promise<KeyDeletionResult> {
  return ReactNativeBiometrics.deleteKeys();
}

export function getAllKeys(): Promise<GetAllKeysResult> {
  return ReactNativeBiometrics.getAllKeys();
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

export type GetAllKeysResult = {
  keys: Array<{
    alias: string;
    publicKey: string;
  }>;
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
