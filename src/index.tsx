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
import { AuthType, BiometricStrength, type BiometryType } from './types';

/**
 * True in development builds. Bundlers and test setups that don't define
 * `__DEV__` count as release builds instead of throwing a ReferenceError.
 */
function isDev(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

/**
 * Runs a native call with the library's standard logging. Logging only
 * happens in development builds, so it compiles out of release bundles,
 * where this is just `call()`.
 */
function logged<T>(
  context: string,
  data: object | undefined,
  call: () => Promise<T>
): Promise<T> {
  if (!isDev()) {
    return call();
  }
  logger.debug(`${context} started`, context, data);
  return call()
    .then((result) => {
      logger.info(`${context} completed`, context, result);
      return result;
    })
    .catch((error) => {
      logger.error(`${context} failed`, context, error, data);
      throw error;
    });
}

function stripAuthType<T extends { authType?: unknown }>(
  result: T,
  returnAuthType?: boolean
): T {
  if (returnAuthType) {
    return result;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { authType: _, ...cleanResult } = result;
  return cleanResult as T;
}

export function isSensorAvailable(options?: {
  biometricStrength?: BiometricStrength;
}): Promise<BiometricSensorInfo> {
  return logged('isSensorAvailable', options, () =>
    // iOS doesn't support biometric strength, so it is called without parameters
    Platform.OS === 'android'
      ? ReactNativeBiometrics.isSensorAvailable(
          options?.biometricStrength || BiometricStrength.Strong
        )
      : ReactNativeBiometrics.isSensorAvailable()
  );
}

export function simplePrompt(
  promptMessage: string,
  options?: { biometricStrength?: BiometricStrength }
): Promise<BiometricAuthResult> {
  const biometricStrength = options?.biometricStrength;
  return logged('simplePrompt', { promptMessage, biometricStrength }, () =>
    // iOS and other platforms ignore biometricStrength and use default behavior
    Platform.OS === 'android'
      ? ReactNativeBiometrics.simplePrompt(promptMessage, biometricStrength)
      : ReactNativeBiometrics.simplePrompt(promptMessage)
  );
}

export { AuthType, BiometricStrength, BiometryTypes } from './types';
export type { BiometryType } from './types';

export function authenticateWithOptions(
  options: BiometricAuthOptions
): Promise<BiometricAuthResult> {
  const { returnAuthType, ...nativeOptions } = options;

  return logged('authenticateWithOptions', undefined, () => {
    if (Platform.OS === 'android' && nativeOptions.biometricStrength) {
      return ReactNativeBiometrics.authenticateWithOptions(nativeOptions).then(
        (result) => stripAuthType(result, returnAuthType)
      );
    }

    // For iOS or Android without biometricStrength, remove biometricStrength from options
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { biometricStrength: _, ...cleanOptions } = nativeOptions;
    return ReactNativeBiometrics.authenticateWithOptions(cleanOptions).then(
      (result) => stripAuthType(result, returnAuthType)
    );
  });
}

export function createKeys(
  keyAlias?: string,
  keyType?: 'rsa2048' | 'ec256',
  biometricStrength?: BiometricStrength,
  allowDeviceCredentials?: boolean,
  failIfExists?: boolean
): Promise<KeyCreationResult> {
  return logged(
    'createKeys',
    {
      keyAlias,
      keyType,
      biometricStrength,
      allowDeviceCredentials,
      failIfExists,
    },
    () =>
      ReactNativeBiometrics.createKeys(
        keyAlias,
        keyType,
        biometricStrength,
        allowDeviceCredentials ?? false,
        failIfExists ?? false
      )
  );
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
    isDev() &&
    !requireAuthentication &&
    (biometricStrength !== undefined || allowDeviceCredentials)
  ) {
    logger.debug(
      'biometricStrength and allowDeviceCredentials are ignored when requireAuthentication is false',
      'createKeysWithOptions'
    );
  }

  return logged(
    'createKeysWithOptions',
    {
      keyAlias,
      keyType,
      requireAuthentication,
      biometricStrength,
      allowDeviceCredentials,
      failIfExists,
    },
    () =>
      ReactNativeBiometrics.createKeysWithOptions({
        keyAlias: keyAlias || undefined,
        keyType,
        requireAuthentication,
        biometricStrength: requireAuthentication
          ? biometricStrength
          : undefined,
        allowDeviceCredentials: requireAuthentication
          ? allowDeviceCredentials
          : false,
        failIfExists,
      })
  );
}

export function deleteKeys(keyAlias?: string): Promise<KeyDeletionResult> {
  return logged('deleteKeys', { keyAlias }, () =>
    ReactNativeBiometrics.deleteKeys(keyAlias)
  );
}

export function validateKeyIntegrity(
  keyAlias?: string
): Promise<KeyIntegrityResult> {
  return logged('validateKeyIntegrity', { keyAlias }, () =>
    ReactNativeBiometrics.validateKeyIntegrity(keyAlias)
  );
}

export function verifyKeySignature(
  keyAlias: string = '',
  data: string,
  promptTitle?: string,
  promptSubtitle?: string,
  cancelButtonText?: string,
  returnAuthType?: boolean
): Promise<SignatureResult> {
  return logged(
    'verifyKeySignature',
    { keyAlias, dataLength: data.length },
    () =>
      ReactNativeBiometrics.verifyKeySignature(
        keyAlias || null,
        data,
        promptTitle,
        promptSubtitle,
        cancelButtonText
      ).then((result) => stripAuthType(result, returnAuthType))
  );
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

  if (
    isDev() &&
    Platform.OS === 'android' &&
    biometricStrength === BiometricStrength.Weak
  ) {
    logger.warn(
      'biometricStrength "weak" has no effect when signing on Android: Keystore keys can only be unlocked by Class 3 (strong) biometrics or device credentials, so the prompt offers whatever the key was created with',
      'signWithOptions'
    );
  }

  return logged(
    'signWithOptions',
    {
      keyAlias,
      dataLength: data.length,
      inputEncoding,
      biometricStrength,
      disableDeviceFallback,
    },
    () => {
      const request: Promise<SignatureResult> =
        Platform.OS === 'android'
          ? // On Android, use the new method with options
            ReactNativeBiometrics.verifyKeySignatureWithOptions(
              resolvedKeyAlias,
              data,
              promptTitle,
              promptSubtitle,
              cancelButtonText,
              biometricStrength,
              disableDeviceFallback,
              inputEncoding
            )
          : // On iOS, use the standard method with inputEncoding
            ReactNativeBiometrics.verifyKeySignatureWithEncoding(
              resolvedKeyAlias,
              data,
              promptTitle,
              promptSubtitle,
              cancelButtonText,
              inputEncoding
            );
      return request.then((result) => stripAuthType(result, returnAuthType));
    }
  );
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

  return logged(
    'sign',
    { keyAlias, dataLength: data.length, inputEncoding, algorithm },
    () =>
      ReactNativeBiometrics.signData({
        keyAlias: keyAlias || undefined,
        data,
        inputEncoding,
        algorithm,
      })
  );
}

export function validateSignature(
  keyAlias: string = '',
  data: string,
  signature: string
): Promise<SignatureValidationResult> {
  return logged(
    'validateSignature',
    {
      keyAlias,
      dataLength: data.length,
      signatureLength: signature.length,
    },
    () => ReactNativeBiometrics.validateSignature(keyAlias, data, signature)
  );
}

export function sha256(
  data: string,
  inputEncoding: 'utf8' | 'base64' = 'utf8'
): Promise<Sha256Result> {
  return logged('sha256', { dataLength: data.length, inputEncoding }, () =>
    ReactNativeBiometrics.sha256(data, inputEncoding)
  );
}

export function getKeyAttributes(
  keyAlias?: string
): Promise<KeyAttributesResult> {
  return logged('getKeyAttributes', { keyAlias }, () =>
    ReactNativeBiometrics.getKeyAttributes(keyAlias)
  );
}

/**
 * Checks whether a key exists for the given alias without triggering any
 * biometric prompt.
 */
export function keyExists(keyAlias?: string): Promise<boolean> {
  return logged('keyExists', { keyAlias }, () =>
    ReactNativeBiometrics.getKeyAttributes(keyAlias || undefined).then(
      (result) => result.exists
    )
  );
}

/**
 * Retrieves the public key for the given alias without triggering any
 * biometric prompt.
 *
 * Like the `publicKey` returned by {@link createKeys}, the result is
 * base64-encoded X.509 SubjectPublicKeyInfo DER on both platforms and for
 * both key types, so once base64-decoded it can be consumed directly by
 * standard tooling (e.g. `openssl pkey -pubin -inform DER`).
 *
 * Rejects with code `KEY_NOT_FOUND` if no key exists for the alias. On iOS,
 * a biometric-gated key may reject with `KEY_REQUIRES_AUTHENTICATION`
 * because the Keychain can refuse even a non-interactive lookup of an
 * auth-bound key — capture the `publicKey` from {@link createKeys} at
 * creation time for those keys (Android is unaffected).
 */
export function getPublicKey(keyAlias?: string): Promise<PublicKeyResult> {
  return logged('getPublicKey', { keyAlias }, () =>
    ReactNativeBiometrics.getPublicKey(keyAlias || undefined)
  );
}

// Key management configuration
export function configureKeyAlias(keyAlias: string): Promise<void> {
  return logged('configureKeyAlias', { keyAlias }, () =>
    ReactNativeBiometrics.configureKeyAlias(keyAlias)
  );
}

export function getDefaultKeyAlias(): Promise<string> {
  return logged('getDefaultKeyAlias', undefined, () =>
    ReactNativeBiometrics.getDefaultKeyAlias()
  );
}

export function getAllKeys(customAlias?: string): Promise<GetAllKeysResult> {
  return logged('getAllKeys', { customAlias }, () =>
    ReactNativeBiometrics.getAllKeys(customAlias)
  );
}

// Debugging utilities
export function getDiagnosticInfo(): Promise<DiagnosticInfo> {
  return logged('getDiagnosticInfo', undefined, () =>
    ReactNativeBiometrics.getDiagnosticInfo()
  );
}

export function runBiometricTest(): Promise<BiometricTestResult> {
  return logged('runBiometricTest', undefined, () =>
    ReactNativeBiometrics.runBiometricTest()
  );
}

export function setDebugMode(enabled: boolean): Promise<void> {
  // Enable/disable centralized logging based on debug mode
  logger.setEnabled(enabled);
  logger.setLevel(enabled ? LogLevel.DEBUG : LogLevel.INFO);

  return logged('setDebugMode', { enabled }, () =>
    ReactNativeBiometrics.setDebugMode(enabled)
  );
}

export function getDeviceIntegrityStatus(): Promise<DeviceIntegrityResult> {
  return logged('getDeviceIntegrityStatus', undefined, () =>
    ReactNativeBiometrics.getDeviceIntegrityStatus()
  );
}

// Configuration types
export type BiometricConfig = {
  keyAlias?: string;
  keyPrefix?: string;
};

// Initialize library with configuration
export function configure(config: BiometricConfig): Promise<void> {
  const { keyAlias } = config;
  if (keyAlias) {
    return logged('configure', config, () => configureKeyAlias(keyAlias));
  }

  if (isDev()) {
    logger.info('configure completed (no key alias)', 'configure', config);
  }
  return Promise.resolve();
}

// Export types for TypeScript users
export type BiometricSensorInfo = {
  available: boolean;
  biometryType?: BiometryType;
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
  /** Base64-encoded X.509 SubjectPublicKeyInfo DER. */
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
   * a prompt. The private key remains non-exportable in the Keystore/Keychain
   * and is hardware-backed where supported (Android TEE/StrongBox, iOS Secure
   * Enclave for EC keys; iOS RSA keys reside in the regular Keychain).
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
   *
   * Has no effect on the signing prompt: Android Keystore keys can only be
   * unlocked by Class 3 (strong) biometrics or device credentials, and a
   * CryptoObject-bound prompt rejects Class 2 (weak) biometrics, so the
   * prompt offers the authenticators the key was created with. Camera-based
   * face unlock is Class 2 on most phones. To accept it, authenticate with
   * `authenticateWithOptions({ biometricStrength: BiometricStrength.Weak })`
   * first and sign with a key from
   * `createKeysWithOptions({ requireAuthentication: false })`.
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
    /** Base64-encoded X.509 SubjectPublicKeyInfo DER. */
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
  hasRuntimeHooks?: boolean;
  isDebuggerAttached?: boolean;
  runtimeHookDetails?: {
    fridaDetected: boolean;
    xposedDetected?: boolean;
  };
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
  if (isDev()) {
    logger.debug(
      'Subscribing to biometric changes',
      'subscribeToBiometricChanges'
    );
  }

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
  if (isDev()) {
    logger.debug(
      'Unsubscribing from biometric changes',
      'unsubscribeFromBiometricChanges'
    );
  }
  subscription.remove();
}

/**
 * Starts biometric change detection.
 * This will begin monitoring for changes in biometric enrollment.
 *
 * @returns Promise that resolves when detection is started
 */
export function startBiometricChangeDetection(): Promise<void> {
  return logged('startBiometricChangeDetection', undefined, () =>
    ReactNativeBiometrics.startBiometricChangeDetection()
  );
}

/**
 * Stops biometric change detection.
 * This will stop monitoring for changes in biometric enrollment.
 *
 * @returns Promise that resolves when detection is stopped
 */
export function stopBiometricChangeDetection(): Promise<void> {
  return logged('stopBiometricChangeDetection', undefined, () =>
    ReactNativeBiometrics.stopBiometricChangeDetection()
  );
}
