export enum BiometricStrength {
  Strong = 'strong',
  Weak = 'weak',
}

/**
 * The type of authentication used to authenticate the user.
 *
 * On iOS, the actual authentication type is inferred from the biometrics
 * available on the device, due to platform limitations.
 */
export enum AuthType {
  None = 0,
  DeviceCredentials = 1,
  Biometrics = 2,
  FaceID = 3,
  TouchID = 4,
  OpticID = 5,
}
