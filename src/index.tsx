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

export type BiometricAuthResult = {
  success: boolean;
};

export type KeyCreationResult = {
  publicKey: string;
};

export type KeyDeletionResult = {
  success: boolean;
};
