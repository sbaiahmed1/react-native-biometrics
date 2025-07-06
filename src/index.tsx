import ReactNativeBiometrics from './NativeReactNativeBiometrics';
import { logger, LogLevel, type LogEntry } from './logger';

export function isSensorAvailable(): Promise<BiometricSensorInfo> {
  logger.debug('Checking sensor availability', 'isSensorAvailable');
  return ReactNativeBiometrics.isSensorAvailable()
    .then((result) => {
      logger.info('Sensor availability check completed', 'isSensorAvailable', {
        available: result.available,
        biometryType: result.biometryType,
      });
      return result;
    })
    .catch((error) => {
      logger.error(
        'Sensor availability check failed',
        'isSensorAvailable',
        error
      );
      throw error;
    });
}

export function simplePrompt(
  promptMessage: string
): Promise<BiometricAuthResult> {
  logger.debug('Starting simple biometric prompt', 'simplePrompt', {
    promptMessage,
  });
  return ReactNativeBiometrics.simplePrompt(promptMessage)
    .then((result) => {
      logger.info('Simple prompt completed', 'simplePrompt', {
        success: result,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Simple prompt failed', 'simplePrompt', error, {
        promptMessage,
      });
      throw error;
    });
}

export function authenticateWithOptions(
  options: BiometricAuthOptions
): Promise<BiometricAuthResult> {
  logger.debug(
    'Starting authentication with options',
    'authenticateWithOptions',
    options
  );
  return ReactNativeBiometrics.authenticateWithOptions(options)
    .then((result) => {
      logger.info('Authentication completed', 'authenticateWithOptions', {
        success: result.success,
        errorCode: result.errorCode,
      });
      return result;
    })
    .catch((error) => {
      logger.error(
        'Authentication failed',
        'authenticateWithOptions',
        error,
        options
      );
      throw error;
    });
}

export function createKeys(keyAlias?: string): Promise<KeyCreationResult> {
  logger.debug('Creating biometric keys', 'createKeys', { keyAlias });
  return ReactNativeBiometrics.createKeys(keyAlias)
    .then((result) => {
      logger.info('Keys created successfully', 'createKeys', {
        keyAlias,
        publicKeyLength: result.publicKey?.length,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Key creation failed', 'createKeys', error, { keyAlias });
      throw error;
    });
}

export function deleteKeys(keyAlias?: string): Promise<KeyDeletionResult> {
  logger.debug('Deleting biometric keys', 'deleteKeys', { keyAlias });
  return ReactNativeBiometrics.deleteKeys(keyAlias)
    .then((result) => {
      logger.info('Keys deletion completed', 'deleteKeys', {
        keyAlias,
        success: result.success,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Key deletion failed', 'deleteKeys', error, { keyAlias });
      throw error;
    });
}

export function validateKeyIntegrity(
  keyAlias?: string
): Promise<KeyIntegrityResult> {
  logger.debug('Validating key integrity', 'validateKeyIntegrity', {
    keyAlias,
  });
  return ReactNativeBiometrics.validateKeyIntegrity(keyAlias)
    .then((result) => {
      logger.info(
        'Key integrity validation completed',
        'validateKeyIntegrity',
        {
          keyAlias,
          valid: result.valid,
          keyExists: result.keyExists,
          integrityChecks: result.integrityChecks,
        }
      );
      return result;
    })
    .catch((error) => {
      logger.error(
        'Key integrity validation failed',
        'validateKeyIntegrity',
        error,
        { keyAlias }
      );
      throw error;
    });
}

export function verifyKeySignature(
  keyAlias: string = '',
  data: string
): Promise<SignatureResult> {
  logger.debug('Verifying key signature', 'verifyKeySignature', {
    keyAlias,
    dataLength: data.length,
  });
  return ReactNativeBiometrics.verifyKeySignature(keyAlias, data)
    .then((result) => {
      logger.info(
        'Key signature verification completed',
        'verifyKeySignature',
        {
          keyAlias,
          success: result.success,
          hasSignature: !!result.signature,
        }
      );
      return result;
    })
    .catch((error) => {
      logger.error(
        'Key signature verification failed',
        'verifyKeySignature',
        error,
        { keyAlias }
      );
      throw error;
    });
}

export function validateSignature(
  keyAlias: string = '',
  data: string,
  signature: string
): Promise<SignatureValidationResult> {
  logger.debug('Validating signature', 'validateSignature', {
    keyAlias,
    dataLength: data.length,
    signatureLength: signature.length,
  });
  return ReactNativeBiometrics.validateSignature(keyAlias, data, signature)
    .then((result) => {
      logger.info('Signature validation completed', 'validateSignature', {
        keyAlias,
        valid: result.valid,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Signature validation failed', 'validateSignature', error, {
        keyAlias,
      });
      throw error;
    });
}

export function getKeyAttributes(
  keyAlias?: string
): Promise<KeyAttributesResult> {
  logger.debug('Getting key attributes', 'getKeyAttributes', { keyAlias });
  return ReactNativeBiometrics.getKeyAttributes(keyAlias)
    .then((result) => {
      logger.info('Key attributes retrieved', 'getKeyAttributes', {
        keyAlias,
        exists: result.exists,
        attributes: result.attributes,
      });
      return result;
    })
    .catch((error) => {
      logger.error(
        'Key attributes retrieval failed',
        'getKeyAttributes',
        error,
        { keyAlias }
      );
      throw error;
    });
}

// Key management configuration
export function configureKeyAlias(keyAlias: string): Promise<void> {
  logger.debug('Configuring key alias', 'configureKeyAlias', { keyAlias });
  return ReactNativeBiometrics.configureKeyAlias(keyAlias)
    .then((result) => {
      logger.info('Key alias configured successfully', 'configureKeyAlias', {
        keyAlias,
      });
      return result;
    })
    .catch((error) => {
      logger.error(
        'Key alias configuration failed',
        'configureKeyAlias',
        error,
        { keyAlias }
      );
      throw error;
    });
}

export function getDefaultKeyAlias(): Promise<string> {
  logger.debug('Getting default key alias', 'getDefaultKeyAlias');
  return ReactNativeBiometrics.getDefaultKeyAlias()
    .then((result) => {
      logger.info('Default key alias retrieved', 'getDefaultKeyAlias', {
        keyAlias: result,
      });
      return result;
    })
    .catch((error) => {
      logger.error(
        'Failed to get default key alias',
        'getDefaultKeyAlias',
        error
      );
      throw error;
    });
}

export function getAllKeys(): Promise<GetAllKeysResult> {
  logger.debug('Getting all keys', 'getAllKeys');
  return ReactNativeBiometrics.getAllKeys()
    .then((result) => {
      logger.info('All keys retrieved', 'getAllKeys', {
        keyCount: result.keys?.length || 0,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Failed to get all keys', 'getAllKeys', error);
      throw error;
    });
}

// Debugging utilities
export function getDiagnosticInfo(): Promise<DiagnosticInfo> {
  logger.debug('Getting diagnostic information', 'getDiagnosticInfo');
  return ReactNativeBiometrics.getDiagnosticInfo()
    .then((result) => {
      logger.info('Diagnostic information retrieved', 'getDiagnosticInfo', {
        platform: result.platform,
        osVersion: result.osVersion,
        deviceModel: result.deviceModel,
        biometricCapabilities: result.biometricCapabilities,
      });
      return result;
    })
    .catch((error) => {
      logger.error(
        'Failed to get diagnostic information',
        'getDiagnosticInfo',
        error
      );
      throw error;
    });
}

export function runBiometricTest(): Promise<BiometricTestResult> {
  logger.debug('Running biometric test', 'runBiometricTest');
  return ReactNativeBiometrics.runBiometricTest()
    .then((result) => {
      logger.info('Biometric test completed', 'runBiometricTest', {
        success: result.success,
        errorCount: result.errors?.length || 0,
        warningCount: result.warnings?.length || 0,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Biometric test failed', 'runBiometricTest', error);
      throw error;
    });
}

export function setDebugMode(enabled: boolean): Promise<void> {
  logger.debug('Setting debug mode', 'setDebugMode', { enabled });

  // Enable/disable centralized logging based on debug mode
  logger.setEnabled(enabled);
  if (enabled) {
    logger.setLevel(LogLevel.DEBUG);
  } else {
    logger.setLevel(LogLevel.INFO);
  }

  return ReactNativeBiometrics.setDebugMode(enabled)
    .then((result) => {
      logger.info('Debug mode updated', 'setDebugMode', { enabled });
      return result;
    })
    .catch((error) => {
      logger.error('Failed to set debug mode', 'setDebugMode', error, {
        enabled,
      });
      throw error;
    });
}

export function getDeviceIntegrityStatus(): Promise<DeviceIntegrityResult> {
  logger.debug('Getting device integrity status', 'getDeviceIntegrityStatus');

  return ReactNativeBiometrics.getDeviceIntegrityStatus()
    .then((result) => {
      logger.info(
        'Device integrity status retrieved',
        'getDeviceIntegrityStatus',
        {
          isCompromised: result.isCompromised,
          riskLevel: result.riskLevel,
        }
      );
      return result;
    })
    .catch((error) => {
      logger.error(
        'Failed to get device integrity status',
        'getDeviceIntegrityStatus',
        error
      );
      throw error;
    });
}

// Configuration types
export type BiometricConfig = {
  keyAlias?: string;
  keyPrefix?: string;
};

// Initialize library with configuration
export function configure(config: BiometricConfig): Promise<void> {
  logger.debug('Configuring library', 'configure', config);

  if (config.keyAlias) {
    return configureKeyAlias(config.keyAlias)
      .then((result) => {
        logger.info('Library configuration completed', 'configure', config);
        return result;
      })
      .catch((error) => {
        logger.error(
          'Library configuration failed',
          'configure',
          error,
          config
        );
        throw error;
      });
  }

  logger.info(
    'Library configuration completed (no key alias)',
    'configure',
    config
  );
  return Promise.resolve();
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

export type KeyIntegrityResult = {
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
};

export type SignatureResult = {
  success: boolean;
  signature?: string;
  error?: string;
};

export type SignatureValidationResult = {
  valid: boolean;
  error?: string;
};

export type KeyAttributesResult = {
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

export type DeviceIntegrityResult = {
  isRooted?: boolean;
  isJailbroken?: boolean;
  isKeyguardSecure?: boolean;
  hasSecureHardware?: boolean;
  isCompromised: boolean;
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  error?: string;
};

// Export logging utilities
export {
  logger,
  LogLevel,
  type LogEntry,
  type LoggerConfig,
  enableLogging,
  setLogLevel,
  configureLogger,
} from './logger';

// Convenience function to get logs for debugging
export function getLogs(): LogEntry[] {
  return logger.getLogs();
}

// Convenience function to clear logs
export function clearLogs(): void {
  logger.clearLogs();
}
