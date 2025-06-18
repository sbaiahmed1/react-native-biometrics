import { TurboModuleRegistry, NativeModules } from 'react-native';
import { type TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';

export interface Spec extends TurboModule {
  isSensorAvailable(): Promise<{
    available: boolean;
    biometryType?: 'Biometrics' | 'FaceID' | 'TouchID' | 'None' | 'Unknown';
    error?: string;
  }>;
  simplePrompt(promptMessage: string): Promise<boolean>;
  authenticateWithOptions(options: {
    title?: string;
    subtitle?: string;
    description?: string;
    fallbackLabel?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
    allowDeviceCredentials?: boolean;
  }): Promise<{
    success: boolean;
    error?: string;
    errorCode?: string;
  }>;
  createKeys(): Promise<{
    publicKey: string;
  }>;
  deleteKeys(): Promise<{
    success: boolean;
  }>;
  getAllKeys(): Promise<{
    keys: Array<{
      alias: string;
      publicKey: string;
    }>;
  }>;
  // Debugging utilities
  getDiagnosticInfo(): Promise<{
    platform: string;
    osVersion: string;
    deviceModel: string;
    biometricCapabilities: string[];
    securityLevel: string;
    keyguardSecure: boolean;
    enrolledBiometrics: string[];
    lastError?: string;
  }>;
  runBiometricTest(): Promise<{
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
  }>;
  setDebugMode(enabled: boolean): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ReactNativeBiometrics'
) ?? NativeModules.ReactNativeBiometrics;
