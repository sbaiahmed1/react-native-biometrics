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

    it('should authenticate with custom options', async () => {
      const options = { title: 'Test Authentication' };
      const result = await Biometrics.authenticateWithOptions(options);
      expect(result).toEqual(MOCK_RESPONSES.authSuccess);
    });
  });

  describe('Key Management', () => {
    it('should create biometric keys with alias', async () => {
      const result = await Biometrics.createKeys('testAlias');
      expect(result).toEqual(MOCK_RESPONSES.keyCreation);
    });

    it('should delete biometric keys', async () => {
      const result = await Biometrics.deleteKeys('testAlias');
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
});
