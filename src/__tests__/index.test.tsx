import * as Biometrics from '../index';

// Mock data constants
const MOCK_RESPONSES = {
  sensorAvailable: { available: true, biometryType: 'FaceID' as const },
  sensorUnavailable: { available: false, error: 'No sensor' },
  authSuccess: { success: true },
  authFailure: { success: false, error: 'Failed', errorCode: 'AUTH_ERR' },
  keyCreation: { publicKey: 'mockPublicKey' },
  keyDeletion: { success: true },
  defaultAlias: 'defaultAlias',
  allKeys: { keys: [{ alias: 'alias1', publicKey: 'key1' }] },
  diagnosticInfo: {
    platform: 'ios',
    osVersion: '1.0',
    deviceModel: 'mock',
    biometricCapabilities: [],
    securityLevel: 'high',
    keyguardSecure: true,
    enrolledBiometrics: [],
  },
  biometricTest: {
    success: true,
    results: {
      sensorAvailable: true,
      canAuthenticate: true,
      hardwareDetected: true,
      hasEnrolledBiometrics: true,
      secureHardware: true,
    },
    errors: [],
    warnings: [],
  },
  deviceIntegritySecure: {
    isRooted: false,
    isJailbroken: false,
    isKeyguardSecure: true,
    hasSecureHardware: true,
    isCompromised: false,
    riskLevel: 'low',
  },
  deviceIntegrityCompromised: {
    isRooted: true,
    isJailbroken: false,
    isKeyguardSecure: false,
    hasSecureHardware: false,
    isCompromised: true,
    riskLevel: 'high',
  },
  deviceIntegrityiOS: {
    isRooted: undefined,
    isJailbroken: false,
    isKeyguardSecure: undefined,
    hasSecureHardware: undefined,
    isCompromised: false,
    riskLevel: 'low',
  },
  deviceIntegrityAndroid: {
    isRooted: false,
    isJailbroken: undefined,
    isKeyguardSecure: true,
    hasSecureHardware: true,
    isCompromised: false,
    riskLevel: 'low',
  },
};

// Default mock implementation
jest.mock('../NativeReactNativeBiometrics', () => ({
  isSensorAvailable: jest.fn(() =>
    Promise.resolve({ available: true, biometryType: 'FaceID' })
  ),
  simplePrompt: jest.fn(() => Promise.resolve(true)),
  authenticateWithOptions: jest.fn(() => Promise.resolve({ success: true })),
  createKeys: jest.fn(() => Promise.resolve({ publicKey: 'mockPublicKey' })),
  deleteKeys: jest.fn(() => Promise.resolve({ success: true })),
  configureKeyAlias: jest.fn(() => Promise.resolve()),
  getDefaultKeyAlias: jest.fn(() => Promise.resolve('defaultAlias')),
  getAllKeys: jest.fn(() =>
    Promise.resolve({ keys: [{ alias: 'alias1', publicKey: 'key1' }] })
  ),
  getDiagnosticInfo: jest.fn(() =>
    Promise.resolve({
      platform: 'ios',
      osVersion: '1.0',
      deviceModel: 'mock',
      biometricCapabilities: [],
      securityLevel: 'high',
      keyguardSecure: true,
      enrolledBiometrics: [],
    })
  ),
  runBiometricTest: jest.fn(() =>
    Promise.resolve({
      success: true,
      results: {
        sensorAvailable: true,
        canAuthenticate: true,
        hardwareDetected: true,
        hasEnrolledBiometrics: true,
        secureHardware: true,
      },
      errors: [],
      warnings: [],
    })
  ),
  setDebugMode: jest.fn(() => Promise.resolve()),
  getDeviceIntegrityStatus: jest.fn(() =>
    Promise.resolve(MOCK_RESPONSES.deviceIntegritySecure)
  ),
}));

// Helper function to create custom mocks for error scenarios
const createMockNative = (overrides = {}) => ({
  isSensorAvailable: jest.fn(() =>
    Promise.resolve(MOCK_RESPONSES.sensorAvailable)
  ),
  simplePrompt: jest.fn(() => Promise.resolve(true)),
  authenticateWithOptions: jest.fn(() =>
    Promise.resolve(MOCK_RESPONSES.authSuccess)
  ),
  createKeys: jest.fn(() => Promise.resolve(MOCK_RESPONSES.keyCreation)),
  deleteKeys: jest.fn(() => Promise.resolve(MOCK_RESPONSES.keyDeletion)),
  configureKeyAlias: jest.fn(() => Promise.resolve()),
  getDefaultKeyAlias: jest.fn(() =>
    Promise.resolve(MOCK_RESPONSES.defaultAlias)
  ),
  getAllKeys: jest.fn(() => Promise.resolve(MOCK_RESPONSES.allKeys)),
  getDiagnosticInfo: jest.fn(() =>
    Promise.resolve(MOCK_RESPONSES.diagnosticInfo)
  ),
  runBiometricTest: jest.fn(() =>
    Promise.resolve(MOCK_RESPONSES.biometricTest)
  ),
  setDebugMode: jest.fn(() => Promise.resolve()),
  getDeviceIntegrityStatus: jest.fn(() =>
    Promise.resolve({
      isRooted: false,
      isJailbroken: false,
      isKeyguardSecure: true,
      hasSecureHardware: true,
      isCompromised: false,
      riskLevel: 'low',
    })
  ),
  ...overrides,
});

describe('ReactNativeBiometrics', () => {
  describe('Sensor Detection', () => {
    it('should detect available biometric sensor', async () => {
      const result = await Biometrics.isSensorAvailable();
      expect(result).toEqual(MOCK_RESPONSES.sensorAvailable);
    });
  });

  describe('Authentication', () => {
    it('should authenticate with simple prompt', async () => {
      const result = await Biometrics.simplePrompt('Authenticate');
      expect(result).toBe(true);
    });

    it('should authenticate with different prompt message', async () => {
      const result = await Biometrics.simplePrompt(
        'Please authenticate to continue'
      );
      expect(result).toBe(true);
    });

    it('should authenticate with custom options', async () => {
      const options = { title: 'Test Authentication' };
      const result = await Biometrics.authenticateWithOptions(options);
      expect(result).toEqual(MOCK_RESPONSES.authSuccess);
    });

    it('should authenticate with all options', async () => {
      const options = {
        title: 'Test Authentication',
        subtitle: 'Please verify',
        description: 'Use your biometric',
        fallbackLabel: 'Use PIN',
      };
      const result = await Biometrics.authenticateWithOptions(options);
      expect(result).toEqual(MOCK_RESPONSES.authSuccess);
    });
  });

  describe('Key Management', () => {
    it('should create biometric keys with alias', async () => {
      const result = await Biometrics.createKeys('testAlias');
      expect(result).toEqual(MOCK_RESPONSES.keyCreation);
    });

    it('should create biometric keys without alias', async () => {
      const result = await Biometrics.createKeys();
      expect(result).toEqual(MOCK_RESPONSES.keyCreation);
    });

    it('should delete biometric keys', async () => {
      const result = await Biometrics.deleteKeys('testAlias');
      expect(result).toEqual(MOCK_RESPONSES.keyDeletion);
    });

    it('should delete biometric keys without alias', async () => {
      const result = await Biometrics.deleteKeys();
      expect(result).toEqual(MOCK_RESPONSES.keyDeletion);
    });

    it('should configure key alias', async () => {
      await expect(
        Biometrics.configureKeyAlias('customAlias')
      ).resolves.toBeUndefined();
    });

    it('should retrieve default key alias', async () => {
      const result = await Biometrics.getDefaultKeyAlias();
      expect(result).toBe(MOCK_RESPONSES.defaultAlias);
    });

    it('should retrieve all stored keys', async () => {
      const result = await Biometrics.getAllKeys();
      expect(result).toEqual(MOCK_RESPONSES.allKeys);
    });

    it('should validate key integrity', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          validateKeyIntegrity: jest.fn(() =>
            Promise.resolve({
              valid: true,
              keyExists: true,
              integrityChecks: { signatureValid: true, keyNotTampered: true },
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.validateKeyIntegrity('testAlias');
      expect(result.valid).toBe(true);
      expect(result.keyExists).toBe(true);
    });

    it('should validate key integrity without alias', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          validateKeyIntegrity: jest.fn(() =>
            Promise.resolve({
              valid: true,
              keyExists: true,
              integrityChecks: { signatureValid: true, keyNotTampered: true },
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.validateKeyIntegrity();
      expect(result.valid).toBe(true);
    });

    it('should verify key signature', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          verifyKeySignature: jest.fn(() =>
            Promise.resolve({
              success: true,
              signature: 'mockSignature123',
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.verifyKeySignature(
        'testAlias',
        'testData'
      );
      expect(result.success).toBe(true);
      expect(result.signature).toBe('mockSignature123');
    });

    it('should verify key signature with default alias', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          verifyKeySignature: jest.fn(() =>
            Promise.resolve({
              success: true,
              signature: 'mockSignature123',
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.verifyKeySignature('', 'testData');
      expect(result.success).toBe(true);
    });

    it('should validate signature', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          validateSignature: jest.fn(() =>
            Promise.resolve({
              valid: true,
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.validateSignature(
        'testAlias',
        'testData',
        'testSignature'
      );
      expect(result.valid).toBe(true);
    });

    it('should validate signature with default alias', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          validateSignature: jest.fn(() =>
            Promise.resolve({
              valid: false,
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.validateSignature(
        '',
        'testData',
        'invalidSignature'
      );
      expect(result.valid).toBe(false);
    });

    it('should get key attributes', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getKeyAttributes: jest.fn(() =>
            Promise.resolve({
              exists: true,
              attributes: {
                keySize: 256,
                algorithm: 'EC',
                secureHardware: true,
              },
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.getKeyAttributes('testAlias');
      expect(result.exists).toBe(true);
      expect(result.attributes?.keySize).toBe(256);
    });

    it('should get key attributes without alias', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getKeyAttributes: jest.fn(() =>
            Promise.resolve({
              exists: false,
              attributes: null,
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.getKeyAttributes();
      expect(result.exists).toBe(false);
    });
  });

  describe('Diagnostics and Testing', () => {
    it('should provide diagnostic information', async () => {
      const result = await Biometrics.getDiagnosticInfo();
      expect(result).toEqual(MOCK_RESPONSES.diagnosticInfo);
      expect(result.platform).toBe('ios');
    });

    it('should run comprehensive biometric test', async () => {
      const result = await Biometrics.runBiometricTest();
      expect(result).toEqual(MOCK_RESPONSES.biometricTest);
      expect(result.success).toBe(true);
    });

    it('should enable debug mode', async () => {
      await expect(Biometrics.setDebugMode(true)).resolves.toBeUndefined();
    });

    it('should disable debug mode', async () => {
      await expect(Biometrics.setDebugMode(false)).resolves.toBeUndefined();
    });

    it('should handle diagnostic errors gracefully', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDiagnosticInfo: jest.fn(() =>
            Promise.reject(new Error('Diagnostic unavailable'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.getDiagnosticInfo()).rejects.toThrow(
        'Diagnostic unavailable'
      );
    });

    it('should handle biometric test failures', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          runBiometricTest: jest.fn(() =>
            Promise.resolve({
              success: false,
              results: null,
              errors: ['Hardware not available'],
              warnings: ['Biometrics not enrolled'],
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.runBiometricTest();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Hardware not available');
    });
  });

  describe('Error Handling', () => {
    it('should handle sensor unavailable scenario', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          isSensorAvailable: jest.fn(() =>
            Promise.resolve(MOCK_RESPONSES.sensorUnavailable)
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.isSensorAvailable();
      expect(result).toEqual(MOCK_RESPONSES.sensorUnavailable);
    });

    it('should handle authentication failure gracefully', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          authenticateWithOptions: jest.fn(() =>
            Promise.resolve(MOCK_RESPONSES.authFailure)
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.authenticateWithOptions({
        title: 'Test Failure',
      });
      expect(result).toEqual(MOCK_RESPONSES.authFailure);
    });

    it('should handle sensor detection errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          isSensorAvailable: jest.fn(() =>
            Promise.reject(new Error('Sensor unavailable'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.isSensorAvailable()).rejects.toThrow(
        'Sensor unavailable'
      );
    });

    it('should handle authentication errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          simplePrompt: jest.fn(() =>
            Promise.reject(new Error('Authentication failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(
        BiometricsModule.simplePrompt('Authenticate')
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle key creation errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          createKeys: jest.fn(() =>
            Promise.reject(new Error('Key creation failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.createKeys('testAlias')).rejects.toThrow(
        'Key creation failed'
      );
    });

    it('should handle key deletion errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          deleteKeys: jest.fn(() =>
            Promise.reject(new Error('Key deletion failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.deleteKeys('testAlias')).rejects.toThrow(
        'Key deletion failed'
      );
    });

    it('should handle key integrity validation errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          validateKeyIntegrity: jest.fn(() =>
            Promise.reject(new Error('Integrity check failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(
        BiometricsModule.validateKeyIntegrity('testAlias')
      ).rejects.toThrow('Integrity check failed');
    });

    it('should handle signature verification errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          verifyKeySignature: jest.fn(() =>
            Promise.reject(new Error('Signature verification failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(
        BiometricsModule.verifyKeySignature('testAlias', 'testData')
      ).rejects.toThrow('Signature verification failed');
    });

    it('should handle signature validation errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          validateSignature: jest.fn(() =>
            Promise.reject(new Error('Signature validation failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(
        BiometricsModule.validateSignature(
          'testAlias',
          'testData',
          'testSignature'
        )
      ).rejects.toThrow('Signature validation failed');
    });

    it('should handle key attributes retrieval errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getKeyAttributes: jest.fn(() =>
            Promise.reject(new Error('Key attributes unavailable'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(
        BiometricsModule.getKeyAttributes('testAlias')
      ).rejects.toThrow('Key attributes unavailable');
    });

    it('should handle configuration errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          configureKeyAlias: jest.fn(() =>
            Promise.reject(new Error('Configuration failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(
        BiometricsModule.configure({ keyAlias: 'testAlias' })
      ).rejects.toThrow('Configuration failed');
    });

    it('should handle authenticateWithOptions error', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          authenticateWithOptions: jest.fn(() =>
            Promise.reject(new Error('Authentication failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(
        BiometricsModule.authenticateWithOptions({})
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle getDefaultKeyAlias error', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDefaultKeyAlias: jest.fn(() =>
            Promise.reject(new Error('Failed to get default key alias'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.getDefaultKeyAlias()).rejects.toThrow(
        'Failed to get default key alias'
      );
    });

    it('should handle getAllKeys error', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getAllKeys: jest.fn(() =>
            Promise.reject(new Error('Failed to get all keys'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.getAllKeys()).rejects.toThrow(
        'Failed to get all keys'
      );
    });

    it('should handle setDebugMode error with proper logging', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          setDebugMode: jest.fn(() =>
            Promise.reject(new Error('Failed to set debug mode'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.setDebugMode(false)).rejects.toThrow(
        'Failed to set debug mode'
      );
    });

    it('should handle setDebugMode error when enabling debug mode', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          setDebugMode: jest.fn(() =>
            Promise.reject(new Error('Native setDebugMode failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.setDebugMode(true)).rejects.toThrow(
        'Native setDebugMode failed'
      );
    });
  });

  describe('Configuration', () => {
    it('should resolve configuration with empty options', async () => {
      await expect(Biometrics.configure({})).resolves.toBeUndefined();
    });

    it('should configure key alias when provided', async () => {
      jest.resetModules();
      const mockConfigureKeyAlias = jest.fn(() => Promise.resolve());
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          configureKeyAlias: mockConfigureKeyAlias,
        })
      );
      const BiometricsModule = await import('../index');
      await BiometricsModule.configure({ keyAlias: 'customTestAlias' });
      expect(mockConfigureKeyAlias).toHaveBeenCalledWith('customTestAlias');
    });
  });

  // Logging utility tests
  describe('Logging Utilities', () => {
    it('should get logs using getLogs function', () => {
      const logs = Biometrics.getLogs();
      expect(Array.isArray(logs)).toBe(true);
    });

    it('should clear logs using clearLogs function', () => {
      Biometrics.clearLogs();
      const logs = Biometrics.getLogs();
      expect(logs.length).toBe(0);
    });
  });

  describe('Device Integrity', () => {
    it('should return secure device integrity status', async () => {
      const result = await Biometrics.getDeviceIntegrityStatus();
      expect(result).toEqual(MOCK_RESPONSES.deviceIntegritySecure);
      expect(result.isCompromised).toBe(false);
      expect(result.riskLevel).toBe('low');
    });

    it('should detect compromised device', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDeviceIntegrityStatus: jest.fn(() =>
            Promise.resolve(MOCK_RESPONSES.deviceIntegrityCompromised)
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.getDeviceIntegrityStatus();
      expect(result).toEqual(MOCK_RESPONSES.deviceIntegrityCompromised);
      expect(result.isCompromised).toBe(true);
      expect(result.riskLevel).toBe('high');
    });

    it('should handle iOS-specific properties correctly', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDeviceIntegrityStatus: jest.fn(() =>
            Promise.resolve(MOCK_RESPONSES.deviceIntegrityiOS)
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.getDeviceIntegrityStatus();
      expect(result).toEqual(MOCK_RESPONSES.deviceIntegrityiOS);
      expect(result.isJailbroken).toBe(false);
      expect(result.isRooted).toBeUndefined();
      expect(result.isKeyguardSecure).toBeUndefined();
      expect(result.hasSecureHardware).toBeUndefined();
    });

    it('should handle Android-specific properties correctly', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDeviceIntegrityStatus: jest.fn(() =>
            Promise.resolve(MOCK_RESPONSES.deviceIntegrityAndroid)
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.getDeviceIntegrityStatus();
      expect(result).toEqual(MOCK_RESPONSES.deviceIntegrityAndroid);
      expect(result.isRooted).toBe(false);
      expect(result.isJailbroken).toBeUndefined();
      expect(result.isKeyguardSecure).toBe(true);
      expect(result.hasSecureHardware).toBe(true);
    });

    it('should handle different risk levels', async () => {
      const riskLevels = ['low', 'medium', 'high'];

      for (const riskLevel of riskLevels) {
        jest.resetModules();
        jest.doMock('../NativeReactNativeBiometrics', () =>
          createMockNative({
            getDeviceIntegrityStatus: jest.fn(() =>
              Promise.resolve({
                ...MOCK_RESPONSES.deviceIntegritySecure,
                riskLevel,
                isCompromised: riskLevel === 'high',
              })
            ),
          })
        );
        const BiometricsModule = await import('../index');
        const result = await BiometricsModule.getDeviceIntegrityStatus();
        expect(result.riskLevel).toBe(riskLevel);
        expect(result.isCompromised).toBe(riskLevel === 'high');
      }
    });

    it('should handle device integrity check errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDeviceIntegrityStatus: jest.fn(() =>
            Promise.reject(new Error('Device integrity check failed'))
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.getDeviceIntegrityStatus()).rejects.toThrow(
        'Device integrity check failed'
      );
    });

    it('should validate all required properties are present', async () => {
      const result = await Biometrics.getDeviceIntegrityStatus();
      expect(result).toHaveProperty('isCompromised');
      expect(result).toHaveProperty('riskLevel');
      expect(typeof result.isCompromised).toBe('boolean');
      expect(typeof result.riskLevel).toBe('string');
      expect(['low', 'medium', 'high']).toContain(result.riskLevel);
    });

    it('should handle platform-specific undefined values correctly', async () => {
      // Test that platform-specific properties can be undefined
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDeviceIntegrityStatus: jest.fn(() =>
            Promise.resolve({
              isRooted: undefined,
              isJailbroken: undefined,
              isKeyguardSecure: undefined,
              hasSecureHardware: undefined,
              isCompromised: false,
              riskLevel: 'low',
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.getDeviceIntegrityStatus();
      expect(result.isRooted).toBeUndefined();
      expect(result.isJailbroken).toBeUndefined();
      expect(result.isKeyguardSecure).toBeUndefined();
      expect(result.hasSecureHardware).toBeUndefined();
      expect(result.isCompromised).toBe(false);
      expect(result.riskLevel).toBe('low');
    });

    it('should handle concurrent device integrity checks', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDeviceIntegrityStatus: jest.fn(() =>
            Promise.resolve(MOCK_RESPONSES.deviceIntegritySecure)
          ),
        })
      );
      const BiometricsModule = await import('../index');

      // Make 3 concurrent calls
      const promises = Array(3)
        .fill(null)
        .map(() => BiometricsModule.getDeviceIntegrityStatus());

      const results = await Promise.all(promises);

      // All results should be identical
      results.forEach((result) => {
        expect(result).toEqual(MOCK_RESPONSES.deviceIntegritySecure);
      });
    });

    it('should validate required properties are present', async () => {
      const result = await Biometrics.getDeviceIntegrityStatus();
      expect(result).toHaveProperty('isCompromised');
      expect(result).toHaveProperty('riskLevel');
      expect(typeof result.isCompromised).toBe('boolean');
      expect(typeof result.riskLevel).toBe('string');
      expect(['low', 'medium', 'high']).toContain(result.riskLevel);
    });

    it('should handle malformed responses gracefully', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDeviceIntegrityStatus: jest.fn(() =>
            Promise.resolve({
              // Missing some properties
              isRooted: false,
              isCompromised: true,
              // riskLevel missing
            })
          ),
        })
      );
      const BiometricsModule = await import('../index');
      const result = await BiometricsModule.getDeviceIntegrityStatus();
      expect(result.isRooted).toBe(false);
      expect(result.isCompromised).toBe(true);
    });

    it('should handle timeout and permission errors', async () => {
      jest.resetModules();
      jest.doMock('../NativeReactNativeBiometrics', () =>
        createMockNative({
          getDeviceIntegrityStatus: jest.fn(() =>
            Promise.reject(
              new Error(
                'Permission denied: Cannot access device integrity features'
              )
            )
          ),
        })
      );
      const BiometricsModule = await import('../index');
      await expect(BiometricsModule.getDeviceIntegrityStatus()).rejects.toThrow(
        'Permission denied'
      );
    });
  });
});
