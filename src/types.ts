export enum BiometricStrength {
  Strong = 'strong',
  Weak = 'weak',
}

export enum AuthType {
  None = 0,
  DeviceCredentials = 1,
  Biometrics = 2,
  FaceID = 3,
  TouchID = 4,
  OpticID = 5,
}
