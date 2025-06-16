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
