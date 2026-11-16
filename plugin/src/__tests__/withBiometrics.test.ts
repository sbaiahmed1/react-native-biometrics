import type { ExpoConfig } from 'expo/config';
import withBiometrics from '../withBiometrics';

const DEFAULT_MESSAGE =
  'Allow $(PRODUCT_NAME) to use Face ID for secure authentication';

type Manifest = {
  manifest: {
    '$': Record<string, string>;
    'uses-permission'?: Array<{ $: { 'android:name': string } }>;
  };
};

const baseConfig = (): ExpoConfig => ({ name: 'test', slug: 'test' });

/** Runs the mod the plugin registered, the way prebuild would. */
async function runMod<T>(
  config: ExpoConfig,
  platform: 'ios' | 'android',
  mod: string,
  modResults: T
): Promise<T> {
  const action = (config as any).mods?.[platform]?.[mod];
  expect(action).toBeInstanceOf(Function);
  const result = await action({
    ...config,
    modResults,
    modRequest: { platform, modName: mod, projectRoot: '/app' },
  });
  return result.modResults;
}

const infoPlist = (config: ExpoConfig, plist: Record<string, unknown> = {}) =>
  runMod(config, 'ios', 'infoPlist', plist);

const permissions = async (config: ExpoConfig, existing: string[] = []) => {
  const manifest: Manifest = {
    manifest: {
      '$': { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      'uses-permission': existing.map((name) => ({
        $: { 'android:name': name },
      })),
    },
  };
  const result = await runMod(config, 'android', 'manifest', manifest);
  return (result.manifest['uses-permission'] ?? []).map(
    (p) => p.$['android:name']
  );
};

describe('withBiometrics — iOS', () => {
  it('adds a default NSFaceIDUsageDescription', async () => {
    const plist = await infoPlist(withBiometrics(baseConfig()));

    expect(plist.NSFaceIDUsageDescription).toBe(DEFAULT_MESSAGE);
  });

  it('uses a custom faceIDPermission', async () => {
    const config = withBiometrics(baseConfig(), {
      faceIDPermission: 'Unlock your vault',
    });

    expect((await infoPlist(config)).NSFaceIDUsageDescription).toBe(
      'Unlock your vault'
    );
  });

  it('keeps an existing description when no option is given', async () => {
    const plist = await infoPlist(withBiometrics(baseConfig()), {
      NSFaceIDUsageDescription: 'From ios.infoPlist',
    });

    expect(plist.NSFaceIDUsageDescription).toBe('From ios.infoPlist');
  });

  it('overrides an existing description with an explicit option', async () => {
    const config = withBiometrics(baseConfig(), {
      faceIDPermission: 'Explicit',
    });
    const plist = await infoPlist(config, {
      NSFaceIDUsageDescription: 'From ios.infoPlist',
    });

    expect(plist.NSFaceIDUsageDescription).toBe('Explicit');
  });

  it('leaves Info.plist untouched with faceIDPermission: false', async () => {
    const config = withBiometrics(baseConfig(), { faceIDPermission: false });

    expect(await infoPlist(config)).not.toHaveProperty(
      'NSFaceIDUsageDescription'
    );
    expect(
      (
        await infoPlist(config, {
          NSFaceIDUsageDescription: 'From ios.infoPlist',
        })
      ).NSFaceIDUsageDescription
    ).toBe('From ios.infoPlist');
  });
});

describe('withBiometrics — Android', () => {
  it('adds USE_BIOMETRIC and USE_FINGERPRINT', async () => {
    expect(await permissions(withBiometrics(baseConfig()))).toEqual([
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ]);
  });

  it('does not duplicate permissions that already exist', async () => {
    const result = await permissions(withBiometrics(baseConfig()), [
      'android.permission.INTERNET',
      'android.permission.USE_BIOMETRIC',
    ]);

    expect(result).toEqual([
      'android.permission.INTERNET',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ]);
  });
});

describe('withBiometrics — run once', () => {
  it('applies only once when listed twice', async () => {
    const config = withBiometrics(
      withBiometrics(baseConfig(), { faceIDPermission: 'First' }),
      { faceIDPermission: 'Second' }
    );

    expect((await infoPlist(config)).NSFaceIDUsageDescription).toBe('First');
    expect(await permissions(config)).toEqual([
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ]);
  });
});
