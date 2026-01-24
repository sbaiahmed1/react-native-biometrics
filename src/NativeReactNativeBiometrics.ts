import { TurboModuleRegistry, NativeModules } from 'react-native';
import { type TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export type BiometricChangeEvent = {
  timestamp: number;
  changeType:
    | 'BIOMETRIC_ENABLED'
    | 'BIOMETRIC_DISABLED'
    | 'ENROLLMENT_CHANGED'
    | 'HARDWARE_CHANGED'
    | 'STATE_CHANGED';
  biometryType: string;
  available: boolean;
  enrolled: boolean;
};

export interface Spec extends TurboModule {
  isSensorAvailable(biometricStrength?: 'weak' | 'strong'): Promise<{
    available: boolean;
    biometryType?: 'Biometrics' | 'FaceID' | 'TouchID' | 'None' | 'Unknown';
    error?: string;
  }>;
  simplePrompt(
    promptMessage: string,
    biometricStrength?: 'weak' | 'strong'
  ): Promise<{
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
    biometricStrength?: 'weak' | 'strong';
  }): Promise<{
    success: boolean;
    error?: string;
    errorCode?: string;
  }>;
  createKeys(
    keyAlias?: string | null,
    keyType?: string | null,
    biometricStrength?: 'weak' | 'strong' | null
  ): Promise<{
    publicKey: string;
  }>;
  deleteKeys(keyAlias?: string | null): Promise<{
    success: boolean;
  }>;
  configureKeyAlias(keyAlias: string): Promise<void>;
  getAllKeys(customAlias?: string | null): Promise<{
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
    data: string,
    promptTitle?: string,
    promptSubtitle?: string,
    cancelButtonText?: string
  ): Promise<{
    success: boolean;
    signature?: string;
    error?: string;
    errorCode?: string;
  }>;
  verifyKeySignatureWithOptions(
    keyAlias: string | null,
    data: string,
    promptTitle?: string | null,
    promptSubtitle?: string | null,
    cancelButtonText?: string | null,
    biometricStrength?: 'weak' | 'strong' | null,
    disableDeviceFallback?: boolean,
    inputEncoding?: 'utf8' | 'base64' | null
  ): Promise<{
    success: boolean;
    signature?: string;
    error?: string;
    errorCode?: string;
  }>;
  verifyKeySignatureWithEncoding(
    keyAlias: string | null,
    data: string,
    promptTitle?: string | null,
    promptSubtitle?: string | null,
    cancelButtonText?: string | null,
    inputEncoding?: 'utf8' | 'base64' | null
  ): Promise<{
    success: boolean;
    signature?: string;
    error?: string;
    errorCode?: string;
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
  // Start biometric change detection
  startBiometricChangeDetection(): Promise<void>;
  // Stop biometric change detection
  stopBiometricChangeDetection(): Promise<void>;
  // Event emitter for biometric changes
  readonly onBiometricChange: EventEmitter<BiometricChangeEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ReactNativeBiometrics'
) ?? NativeModules.ReactNativeBiometrics;
