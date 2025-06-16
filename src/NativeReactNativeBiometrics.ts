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
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'ReactNativeBiometrics'
) ?? NativeModules.ReactNativeBiometrics;
