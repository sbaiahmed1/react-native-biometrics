import type { BiometricChangeEvent } from './NativeReactNativeBiometrics';
import ReactNativeBiometrics from './NativeReactNativeBiometrics';
import { type LogEntry, logger, LogLevel } from './logger';
// Biometric Change Detection API
import {
  DeviceEventEmitter,
  type EventSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { AuthType, BiometricStrength } from './types';

export function isSensorAvailable(options?: {
  biometricStrength?: BiometricStrength;
}): Promise<BiometricSensorInfo> {
  logger.debug('Checking sensor availability', 'isSensorAvailable');

  if (Platform.OS === 'android') {
    const biometricStrength =
      options?.biometricStrength || BiometricStrength.Strong;
    return ReactNativeBiometrics.isSensorAvailable(biometricStrength)
      .then((result) => {
        logger.info(
          'Sensor availability check completed',
          'isSensorAvailable',
          {
            available: result.available,
            biometryType: result.biometryType,
            isDeviceSecure: result.isDeviceSecure,
          }
        );
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

  // For iOS, we still call without parameters as iOS doesn't support biometric strength
  return ReactNativeBiometrics.isSensorAvailable()
    .then((result) => {
      logger.info('Sensor availability check completed', 'isSensorAvailable', {
        available: result.available,
        biometryType: result.biometryType,
        isDeviceSecure: result.isDeviceSecure,
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
  promptMessage: string,
  options?: { biometricStrength?: BiometricStrength }
): Promise<BiometricAuthResult> {
  logger.debug('Starting simple biometric prompt', 'simplePrompt', {
    promptMessage,
    biometricStrength: options?.biometricStrength,
  });
  if (Platform.OS === 'android') {
    return ReactNativeBiometrics.simplePrompt(
      promptMessage,
      options?.biometricStrength
    )
      .then((result) => {
        logger.info('Simple prompt completed', 'simplePrompt', {
          success: result,
        });
        return result;
      })
      .catch((error) => {
        logger.error('Simple prompt failed', 'simplePrompt', error, {
          promptMessage,
          biometricStrength: options?.biometricStrength,
        });
        throw error;
      });
  }
  // iOS and other platforms ignore biometricStrength and use default behavior
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

export { AuthType, BiometricStrength } from './types';

export function authenticateWithOptions(
  options: BiometricAuthOptions
): Promise<BiometricAuthResult> {
  logger.debug(
    'Starting authentication with options',
    'authenticateWithOptions'
  );

  const { returnAuthType, ...nativeOptions } = options;

  const stripAuthType = (result: BiometricAuthResult): BiometricAuthResult => {
    if (!returnAuthType) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { authType: _, ...cleanResult } = result;
      return cleanResult;
    }
    return result;
  };

  if (Platform.OS === 'android' && nativeOptions.biometricStrength) {
    return ReactNativeBiometrics.authenticateWithOptions(nativeOptions)
      .then((result) => {
        logger.info(
          'Authentication with options completed',
          'authenticateWithOptions',
          {
            success: result.success,
          }
        );
        return stripAuthType(result);
      })
      .catch((error) => {
        logger.error(
          'Authentication with options failed',
          'authenticateWithOptions',
          error
        );
        throw error;
      });
  }

  // For iOS or Android without biometricStrength, remove biometricStrength from options
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { biometricStrength: _, ...cleanOptions } = nativeOptions;
  return ReactNativeBiometrics.authenticateWithOptions(cleanOptions)
    .then((result) => {
      logger.info(
        'Authentication with options completed',
        'authenticateWithOptions',
        {
          success: result.success,
        }
      );
      return stripAuthType(result);
    })
    .catch((error) => {
      logger.error(
        'Authentication with options failed',
        'authenticateWithOptions',
        error
      );
      throw error;
    });
}

export function createKeys(
  keyAlias?: string,
  keyType?: 'rsa2048' | 'ec256',
  biometricStrength?: BiometricStrength,
  allowDeviceCredentials?: boolean,
  failIfExists?: boolean
): Promise<KeyCreationResult> {
  logger.debug('Creating biometric keys', 'createKeys', {
    keyAlias,
    keyType,
    biometricStrength,
    allowDeviceCredentials,
    failIfExists,
  });
  return ReactNativeBiometrics.createKeys(
    keyAlias,
    keyType,
    biometricStrength,
    allowDeviceCredentials ?? false,
    failIfExists ?? false
  )
    .then((result) => {
      logger.info('Keys created successfully', 'createKeys', {
        keyAlias,
        keyType,
        biometricStrength,
        allowDeviceCredentials,
        failIfExists,
        publicKeyLength: result.publicKey?.length,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Key creation failed', 'createKeys', error, {
        keyAlias,
        keyType,
        biometricStrength,
        allowDeviceCredentials,
        failIfExists,
      });
      throw error;
    });
}

/**
 * Creates a key pair using an options object, with control over whether the
 * key requires user authentication.
 *
 * With `requireAuthentication: false` the key can sign without any biometric
 * or device-credential prompt (see {@link sign}), while the private key still
 * never leaves the Android Keystore / iOS Keychain (Secure Enclave for EC
 * keys on device). Defaults preserve the behavior of {@link createKeys}:
 * keys are biometric-gated.
 *
 * @example
 * // Hardware-backed key usable without a biometric prompt
 * const { publicKey } = await createKeysWithOptions({
 *   keyAlias: 'server-auth-key',
 *   keyType: 'rsa2048',
 *   requireAuthentication: false,
 * });
 */
export function createKeysWithOptions(
  options: CreateKeysOptions = {}
): Promise<KeyCreationResult> {
  const {
    keyAlias,
    keyType,
    requireAuthentication = true,
    biometricStrength,
    allowDeviceCredentials = false,
    failIfExists = false,
  } = options;

  if (
    !requireAuthentication &&
    (biometricStrength !== undefined || allowDeviceCredentials)
  ) {
    logger.debug(
      'biometricStrength and allowDeviceCredentials are ignored when requireAuthentication is false',
      'createKeysWithOptions'
    );
  }

  logger.debug('Creating keys with options', 'createKeysWithOptions', {
    keyAlias,
    keyType,
    requireAuthentication,
    biometricStrength,
    allowDeviceCredentials,
    failIfExists,
  });
  return ReactNativeBiometrics.createKeysWithOptions({
    keyAlias: keyAlias || undefined,
    keyType,
    requireAuthentication,
    biometricStrength: requireAuthentication ? biometricStrength : undefined,
    allowDeviceCredentials: requireAuthentication
      ? allowDeviceCredentials
      : false,
    failIfExists,
  })
    .then((result) => {
      logger.info('Keys created successfully', 'createKeysWithOptions', {
        keyAlias,
        keyType,
        requireAuthentication,
        publicKeyLength: result.publicKey?.length,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Key creation failed', 'createKeysWithOptions', error, {
        keyAlias,
        keyType,
        requireAuthentication,
      });
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
  data: string,
  promptTitle?: string,
  promptSubtitle?: string,
  cancelButtonText?: string,
  returnAuthType?: boolean
): Promise<SignatureResult> {
  const resolvedKeyAlias = keyAlias || null;
  logger.debug('Verifying key signature', 'verifyKeySignature', {
    keyAlias,
    dataLength: data.length,
  });
  return ReactNativeBiometrics.verifyKeySignature(
    resolvedKeyAlias,
    data,
    promptTitle,
    promptSubtitle,
    cancelButtonText
  )
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
      if (!returnAuthType) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { authType: _, ...cleanResult } = result;
        return cleanResult;
      }
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

/**
 * Signs data with biometric authentication using advanced options.
 * This method provides more control over the authentication process,
 * including the ability to disable device credential fallback.
 *
 * @param options - Signature options including keyAlias, data, prompt settings, and security options
 * @returns Promise with signature result
 *
 * @example
 * // Require biometrics only (no PIN/pattern fallback)
 * const result = await signWithOptions({
 *   keyAlias: 'my_key',
 *   data: 'data to sign',
 *   promptTitle: 'Sign Transaction',
 *   disableDeviceFallback: true,
 *   biometricStrength: 'strong'
 * });
 */
export function signWithOptions(
  options: SignatureOptions
): Promise<SignatureResult> {
  const {
    keyAlias = '',
    data,
    inputEncoding = 'utf8',
    promptTitle,
    promptSubtitle,
    cancelButtonText,
    biometricStrength,
    disableDeviceFallback = false,
    returnAuthType,
  } = options;

  const resolvedKeyAlias = keyAlias || null;

  logger.debug('Signing with options', 'signWithOptions', {
    keyAlias,
    dataLength: data.length,
    inputEncoding,
    biometricStrength,
    disableDeviceFallback,
  });

  const stripAuthType = (result: SignatureResult): SignatureResult => {
    if (!returnAuthType) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { authType: _, ...cleanResult } = result;
      return cleanResult;
    }
    return result;
  };

  // On Android, use the new method with options
  if (Platform.OS === 'android') {
    return ReactNativeBiometrics.verifyKeySignatureWithOptions(
      resolvedKeyAlias,
      data,
      promptTitle,
      promptSubtitle,
      cancelButtonText,
      biometricStrength,
      disableDeviceFallback,
      inputEncoding
    )
      .then((result: SignatureResult) => {
        logger.info('Sign with options completed', 'signWithOptions', {
          keyAlias,
          success: result.success,
          hasSignature: !!result.signature,
        });
        return stripAuthType(result);
      })
      .catch((error: Error) => {
        logger.error('Sign with options failed', 'signWithOptions', error, {
          keyAlias,
        });
        throw error;
      });
  }

  // On iOS, use the standard method with inputEncoding
  return ReactNativeBiometrics.verifyKeySignatureWithEncoding(
    resolvedKeyAlias,
    data,
    promptTitle,
    promptSubtitle,
    cancelButtonText,
    inputEncoding
  )
    .then((result: SignatureResult) => {
      logger.info('Sign with options completed', 'signWithOptions', {
        keyAlias,
        success: result.success,
        hasSignature: !!result.signature,
      });
      return stripAuthType(result);
    })
    .catch((error: Error) => {
      logger.error('Sign with options failed', 'signWithOptions', error, {
        keyAlias,
      });
      throw error;
    });
}

/**
 * Signs data without any biometric or device-credential prompt.
 *
 * Only works with keys created via
 * `createKeysWithOptions({ requireAuthentication: false })`. Calling it on a
 * biometric-gated key never shows a prompt — it resolves with
 * `{ success: false, errorCode: 'KEY_REQUIRES_AUTHENTICATION' }`; use
 * {@link signWithOptions} for those keys instead.
 *
 * @example
 * const result = await sign({
 *   keyAlias: 'server-auth-key',
 *   data: payload,
 *   algorithm: SignatureAlgorithm.SHA512withRSA,
 * });
 */
export function sign(options: SignOptions): Promise<SignatureResult> {
  const { keyAlias, data, inputEncoding = 'utf8', algorithm } = options;

  logger.debug('Signing data without authentication', 'sign', {
    keyAlias,
    dataLength: data.length,
    inputEncoding,
    algorithm,
  });
  return ReactNativeBiometrics.signData({
    keyAlias: keyAlias || undefined,
    data,
    inputEncoding,
    algorithm,
  })
    .then((result) => {
      logger.info('Sign completed', 'sign', {
        keyAlias,
        success: result.success,
        hasSignature: !!result.signature,
        errorCode: result.errorCode,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Sign failed', 'sign', error, { keyAlias });
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

export function sha256(
  data: string,
  inputEncoding: 'utf8' | 'base64' = 'utf8'
): Promise<Sha256Result> {
  logger.debug('Computing SHA256', 'sha256', {
    dataLength: data.length,
    inputEncoding,
  });
  return ReactNativeBiometrics.sha256(data, inputEncoding)
    .then((result) => {
      logger.info('SHA256 completed', 'sha256');
      return result;
    })
    .catch((error) => {
      logger.error('SHA256 failed', 'sha256', error);
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

/**
 * Checks whether a key exists for the given alias without triggering any
 * biometric prompt.
 */
export function keyExists(keyAlias?: string): Promise<boolean> {
  logger.debug('Checking key existence', 'keyExists', { keyAlias });
  return ReactNativeBiometrics.getKeyAttributes(keyAlias || undefined)
    .then((result) => {
      logger.info('Key existence check completed', 'keyExists', {
        keyAlias,
        exists: result.exists,
      });
      return result.exists;
    })
    .catch((error) => {
      logger.error('Key existence check failed', 'keyExists', error, {
        keyAlias,
      });
      throw error;
    });
}

/**
 * Retrieves the public key for the given alias without triggering any
 * biometric prompt.
 *
 * Unlike the `publicKey` returned by {@link createKeys}, the result is
 * base64-encoded X.509 SubjectPublicKeyInfo DER on both platforms and for
 * both key types, so it can be consumed directly by standard tooling
 * (e.g. `openssl pkey -pubin -inform DER`).
 *
 * Rejects with code `KEY_NOT_FOUND` if no key exists for the alias.
 */
export function getPublicKey(keyAlias?: string): Promise<PublicKeyResult> {
  logger.debug('Getting public key', 'getPublicKey', { keyAlias });
  return ReactNativeBiometrics.getPublicKey(keyAlias || undefined)
    .then((result) => {
      logger.info('Public key retrieved', 'getPublicKey', {
        keyAlias,
        keyType: result.keyType,
        publicKeyLength: result.publicKey?.length,
      });
      return result;
    })
    .catch((error) => {
      logger.error('Public key retrieval failed', 'getPublicKey', error, {
        keyAlias,
      });
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

export function getAllKeys(customAlias?: string): Promise<GetAllKeysResult> {
  logger.debug('Getting all keys', 'getAllKeys', { customAlias });
  return ReactNativeBiometrics.getAllKeys(customAlias)
    .then((result) => {
      logger.info('All keys retrieved', 'getAllKeys', {
        keyCount: result.keys?.length || 0,
        customAlias,
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
  errorCode?: string;
  fallbackUsed?: boolean;
  biometricStrength?: BiometricStrength;
  isDeviceSecure: boolean;
};

export type BiometricAuthOptions = {
  title?: string;
  subtitle?: string;
  description?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  allowDeviceCredentials?: boolean;
  biometricStrength?: BiometricStrength;
  returnAuthType?: boolean;
};

export type BiometricAuthResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
  fallbackUsed?: boolean;
  biometricStrength?: BiometricStrength;
  authType?: AuthType;
};

export type KeyCreationResult = {
  publicKey: string;
};

/**
 * Options for {@link createKeysWithOptions}.
 */
export type CreateKeysOptions = {
  /** The key alias. Defaults to the configured alias. */
  keyAlias?: string;
  /** Key type: 'rsa2048' or 'ec256'. Platform default applies when omitted. */
  keyType?: 'rsa2048' | 'ec256';
  /**
   * When true (default), using the private key requires user authentication —
   * the existing biometric-gated behavior. When false, the key is created
   * without any user-authentication requirement so {@link sign} works without
   * a prompt. The private key remains hardware-backed and non-exportable.
   */
  requireAuthentication?: boolean;
  /** Ignored when requireAuthentication is false. (Android only) */
  biometricStrength?: BiometricStrength;
  /** Ignored when requireAuthentication is false. */
  allowDeviceCredentials?: boolean;
  /** When true, rejects with KEY_ALREADY_EXISTS instead of replacing the key. */
  failIfExists?: boolean;
};

export type PublicKeyResult = {
  /** Base64-encoded X.509 SubjectPublicKeyInfo DER. */
  publicKey: string;
  /** 'rsa2048' or 'ec256' when the platform can determine it. */
  keyType?: string;
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
    strongBoxBacked?: boolean;
  };
  error?: string;
};

export type SignatureResult = {
  success: boolean;
  signature?: string;
  error?: string;
  errorCode?: string;
  authType?: AuthType;
};

/**
 * Input encoding for signature data.
 * Use this enum to specify how the input data should be interpreted.
 */
export enum InputEncoding {
  /** Data is a UTF-8 string (default) */
  UTF8 = 'utf8',
  /** Data is base64-encoded binary - use for WebAuthn challenges or other binary data */
  Base64 = 'base64',
}

/**
 * Signature algorithm for prompt-free signing via {@link sign}.
 *
 * Note: on Android, keys created before SHA-512 support was added (and keys
 * generated inside StrongBox) only permit SHA-256 — requesting a SHA-512
 * variant on such a key fails with UNSUPPORTED_ALGORITHM. On iOS the
 * algorithm is chosen per call and works with existing keys.
 */
export enum SignatureAlgorithm {
  SHA256withRSA = 'SHA256withRSA',
  SHA512withRSA = 'SHA512withRSA',
  SHA256withECDSA = 'SHA256withECDSA',
  SHA512withECDSA = 'SHA512withECDSA',
}

/**
 * Options for {@link sign} (prompt-free signing).
 */
export type SignOptions = {
  /** The key alias to use for signing. Defaults to the configured alias. */
  keyAlias?: string;
  /** The data to sign */
  data: string;
  /** Encoding of the input data. Defaults to InputEncoding.UTF8. */
  inputEncoding?: InputEncoding;
  /**
   * Signature algorithm. Defaults to the SHA-256 variant matching the key
   * type (SHA256withRSA for RSA keys, SHA256withECDSA for EC keys). Must
   * match the key type: requesting an RSA algorithm on an EC key (or vice
   * versa) fails with INVALID_ALGORITHM.
   */
  algorithm?: SignatureAlgorithm;
};

/**
 * Options for signing data with advanced security controls.
 */
export type SignatureOptions = {
  /** The key alias to use for signing. Defaults to the configured alias. */
  keyAlias?: string;
  /** The data to sign */
  data: string;
  /**
   * Encoding of the input data. Use InputEncoding enum.
   * - InputEncoding.UTF8 (default): Data is treated as a UTF-8 string
   * - InputEncoding.Base64: Data is decoded from base64 before signing
   *
   * Use InputEncoding.Base64 for WebAuthn challenges or other binary data.
   * This avoids double-encoding when your challenge is already bytes.
   *
   * @example
   * // For WebAuthn with binary challenge
   * signWithOptions({
   *   data: base64Challenge,
   *   inputEncoding: InputEncoding.Base64
   * })
   */
  inputEncoding?: InputEncoding;
  /** Title for the biometric prompt */
  promptTitle?: string;
  /** Subtitle for the biometric prompt */
  promptSubtitle?: string;
  /** Text for the cancel button */
  cancelButtonText?: string;
  /**
   * Biometric strength requirement (Android only).
   * - 'strong': Requires Class 3 biometrics (fingerprint, iris)
   * - 'weak': Allows Class 2 biometrics (face unlock on some devices)
   */
  biometricStrength?: BiometricStrength;
  /**
   * When true, prevents fallback to device credentials (PIN/pattern/password).
   * If biometrics are not available and this is true, the operation will fail.
   * This is useful for high-security operations that require biometric-only authentication.
   * (Android only - iOS Secure Enclave keys already enforce biometrics by default)
   */
  disableDeviceFallback?: boolean;
  /**
   * When true, includes authType in the result indicating how the user authenticated.
   * See AuthType enum for possible values.
   */
  returnAuthType?: boolean;
};

export type SignatureValidationResult = {
  valid: boolean;
  error?: string;
};

export type Sha256Result = {
  hash: string;
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

export type { BiometricChangeEvent };

/**
 * Subscribes to biometric change events.
 *
 * @param callback - Function to be called when biometric changes are detected
 * @returns EventSubscription that can be used to unsubscribe
 */
export function subscribeToBiometricChanges(
  callback: (event: BiometricChangeEvent) => void
): EventSubscription {
  logger.debug(
    'Subscribing to biometric changes',
    'subscribeToBiometricChanges'
  );

  // New architecture: events emitted through the codegen event emitter are
  // only delivered to its own subscribers, never to DeviceEventEmitter.
  if (typeof ReactNativeBiometrics.onBiometricChange === 'function') {
    return ReactNativeBiometrics.onBiometricChange(callback);
  }

  // Old architecture: NativeEventEmitter invokes the native addListener
  // method — required on iOS, where RCTEventEmitter drops events while its
  // listener count is zero — and both platforms auto-start detection when
  // the first listener attaches.
  if (NativeModules.ReactNativeBiometrics != null) {
    return new NativeEventEmitter(
      NativeModules.ReactNativeBiometrics
    ).addListener('onBiometricChange', callback);
  }

  // Environments without the native module (e.g. web).
  return DeviceEventEmitter.addListener('onBiometricChange', callback);
}

/**
 * Unsubscribes from biometric change events.
 *
 * @param subscription - The EventSubscription returned from subscribeToBiometricChanges
 */
export function unsubscribeFromBiometricChanges(
  subscription: EventSubscription
): void {
  logger.debug(
    'Unsubscribing from biometric changes',
    'unsubscribeFromBiometricChanges'
  );
  subscription.remove();
}

/**
 * Starts biometric change detection.
 * This will begin monitoring for changes in biometric enrollment.
 *
 * @returns Promise that resolves when detection is started
 */
export function startBiometricChangeDetection(): Promise<void> {
  logger.debug(
    'Starting biometric change detection',
    'startBiometricChangeDetection'
  );
  return ReactNativeBiometrics.startBiometricChangeDetection();
}

/**
 * Stops biometric change detection.
 * This will stop monitoring for changes in biometric enrollment.
 *
 * @returns Promise that resolves when detection is stopped
 */
export function stopBiometricChangeDetection(): Promise<void> {
  logger.debug(
    'Stopping biometric change detection',
    'stopBiometricChangeDetection'
  );
  return ReactNativeBiometrics.stopBiometricChangeDetection();
}
