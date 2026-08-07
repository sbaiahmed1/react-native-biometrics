import {
  type ConfigPlugin,
  AndroidConfig,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('../../package.json');

const DEFAULT_FACE_ID_PERMISSION =
  'Allow $(PRODUCT_NAME) to use Face ID for secure authentication';

const BIOMETRIC_PERMISSIONS = [
  'android.permission.USE_BIOMETRIC',
  'android.permission.USE_FINGERPRINT',
];

type Options = {
  /**
   * The iOS `NSFaceIDUsageDescription` message shown when the app first uses
   * Face ID. Pass `false` to skip adding it (e.g. when you manage it yourself
   * via `ios.infoPlist`). Defaults to a generic message.
   */
  faceIDPermission?: string | false;
};

/**
 * Add the NSFaceIDUsageDescription key to Info.plist.
 * An existing value (e.g. from `ios.infoPlist`) is kept unless an explicit
 * `faceIDPermission` string is provided.
 */
const withBiometricsIOS: ConfigPlugin<Options> = (config, options) => {
  return withInfoPlist(config, (iosConfig) => {
    if (options.faceIDPermission !== false) {
      iosConfig.modResults.NSFaceIDUsageDescription =
        options.faceIDPermission ||
        iosConfig.modResults.NSFaceIDUsageDescription ||
        DEFAULT_FACE_ID_PERMISSION;
    }
    return iosConfig;
  });
};

/**
 * Add the USE_BIOMETRIC and USE_FINGERPRINT permissions to AndroidManifest.xml.
 * `withPermissions` de-duplicates against permissions that already exist.
 */
const withBiometricsAndroid: ConfigPlugin = (config) => {
  return AndroidConfig.Permissions.withPermissions(
    config,
    BIOMETRIC_PERMISSIONS
  );
};

const withBiometrics: ConfigPlugin<Options | void> = (config, options) => {
  config = withBiometricsIOS(config, options || {});
  config = withBiometricsAndroid(config);
  return config;
};

export default createRunOncePlugin<Options | void>(
  withBiometrics,
  pkg.name,
  pkg.version
);
