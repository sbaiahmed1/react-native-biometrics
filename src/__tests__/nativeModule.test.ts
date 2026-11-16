/**
 * Resolution of the native module: the TurboModule, or a stand-in that
 * rejects every call with a clear error (Expo Go, an app not rebuilt after
 * install).
 */

import type * as Biometrics from '../index';

type Loaded = {
  nativeModule: any;
  index: typeof Biometrics;
};

function load(turboModule: object | null): Loaded {
  let loaded: Loaded | undefined;
  jest.isolateModules(() => {
    jest.doMock('../NativeReactNativeBiometrics', () => ({
      __esModule: true,
      default: turboModule,
    }));
    loaded = {
      nativeModule: require('../nativeModule').default,
      index: require('../index'),
    };
  });
  return loaded!;
}

afterEach(() => {
  jest.dontMock('../NativeReactNativeBiometrics');
});

describe('native module resolution', () => {
  it('uses the TurboModule when it is registered', () => {
    const turbo = { isSensorAvailable: jest.fn() };

    expect(load(turbo).nativeModule).toBe(turbo);
  });
});

describe('without the native module (e.g. Expo Go)', () => {
  it('the codegen spec does not throw when the module is missing', () => {
    jest.isolateModules(() => {
      expect(require('../NativeReactNativeBiometrics').default).toBeNull();
    });
  });

  it('can be imported', () => {
    expect(() => load(null)).not.toThrow();
  });

  it('rejects native calls with NATIVE_MODULE_UNAVAILABLE', async () => {
    const { index } = load(null);

    await expect(index.isSensorAvailable()).rejects.toMatchObject({
      code: 'NATIVE_MODULE_UNAVAILABLE',
      message: expect.stringContaining('Expo Go'),
    });
    await expect(index.simplePrompt('Confirm')).rejects.toMatchObject({
      code: 'NATIVE_MODULE_UNAVAILABLE',
    });
  });

  it('returns a rejected promise rather than throwing synchronously', () => {
    const { index } = load(null);

    const result = index.isSensorAvailable();
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('is not mistaken for a thenable or an event emitter', () => {
    const { nativeModule } = load(null);

    expect(nativeModule.then).toBeUndefined();
    expect(nativeModule.onBiometricChange).toBeUndefined();
  });

  it('still lets callers subscribe to biometric changes', () => {
    const { index } = load(null);

    const subscription = index.subscribeToBiometricChanges(jest.fn());
    expect(typeof subscription.remove).toBe('function');
    subscription.remove();
  });
});
