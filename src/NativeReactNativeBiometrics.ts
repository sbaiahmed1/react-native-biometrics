import { TurboModuleRegistry, NativeModules } from 'react-native';
import { type TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';

export interface Spec extends TurboModule {
  isSensorAvailable(): Promise<{
    available: boolean;
    biometryType?: 'Biometrics' | 'FaceID' | 'TouchID' | 'None' | 'Unknown';
    error?: string;
  }>;
  simplePrompt(promptMessage: string): Promise<{
    success: boolean;
    error?: string;
    errorCode?: string;
  }>;
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
  createKeys(keyAlias?: string | null): Promise<{
    publicKey: string;
  }>;
  deleteKeys(keyAlias?: string | null): Promise<{
    success: boolean;
  }>;
  configureKeyAlias(keyAlias: string): Promise<void>;
  getAllKeys(): Promise<{
    keys: Array<{
      alias: string;
      publicKey: string;
    }>;
  }>;
  // Key integrity validation methods
  validateKeyIntegrity(keyAlias?: string | null): Promise<{
    valid: boolean;
    keyExists: boolean;
    keyAttributes?: {
      algorithm: string;
      keySize: number;
      creationDate?: string;
      securityLevel: string;
    };
    integrityChecks: {
      keyFormatValid: boolean;
      keyAccessible: boolean;
      signatureTestPassed: boolean;
      hardwareBacked: boolean;
    };
    error?: string;
  }>;
  verifyKeySignature(
    keyAlias: string,
    data: string
  ): Promise<{
    success: boolean;
    signature?: string;
    error?: string;
  }>;
  validateSignature(
    keyAlias: string,
    data: string,
    signature: string
  ): Promise<{
    valid: boolean;
    error?: string;
  }>;
  getKeyAttributes(keyAlias?: string | null): Promise<{
    exists: boolean;
    attributes?: {
      algorithm: string;
      keySize: number;
      purposes: string[];
      digests: string[];
      padding: string[];
      creationDate?: string;
      securityLevel: string;
      hardwareBacked: boolean;
      userAuthenticationRequired: boolean;
    };
    error?: string;
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
  getDefaultKeyAlias(): Promise<string>;
  getDeviceIntegrityStatus(): Promise<{
    isRooted?: boolean;
    isJailbroken?: boolean;
    isKeyguardSecure?: boolean;
    hasSecureHardware?: boolean;
    isCompromised: boolean;
    riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
    error?: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ReactNativeBiometrics'
) ?? NativeModules.ReactNativeBiometrics;
