import NativeReactNativeBiometrics, {
  type Spec,
} from './NativeReactNativeBiometrics';

export const NATIVE_MODULE_UNAVAILABLE = 'NATIVE_MODULE_UNAVAILABLE';

const UNAVAILABLE_MESSAGE =
  "@sbaiahmed1/react-native-biometrics: the native module 'ReactNativeBiometrics' is not available. " +
  'Expo Go does not include it — use a development build instead ' +
  '(`npx expo run:ios`, `npx expo run:android` or EAS Build). ' +
  'In other projects, rebuild the app after installing the library ' +
  '(and run `pod install` on iOS).';

/**
 * Stands in for the native module when it isn't linked (Expo Go, a
 * stale native build). Importing the library keeps working; every native
 * call rejects with a `NATIVE_MODULE_UNAVAILABLE` error explaining how to
 * fix it, instead of the import crashing with a generic registry error.
 */
function createUnavailableModule(): Spec {
  return new Proxy({} as Spec, {
    get(_target, prop) {
      // Not a method: lets interop/thenable checks pass, and leaves the event
      // emitter undefined so subscribeToBiometricChanges keeps its no-module
      // fallback.
      if (
        typeof prop === 'symbol' ||
        prop === '__esModule' ||
        prop === 'then' ||
        prop === 'onBiometricChange'
      ) {
        return undefined;
      }
      return () => {
        const error = new Error(UNAVAILABLE_MESSAGE) as Error & {
          code: string;
        };
        error.code = NATIVE_MODULE_UNAVAILABLE;
        return Promise.reject(error);
      };
    },
  });
}

const nativeModule: Spec =
  NativeReactNativeBiometrics ?? createUnavailableModule();

export default nativeModule;
