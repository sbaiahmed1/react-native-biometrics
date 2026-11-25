// Swift Package Manager builds only.
//
// Pins the @objc API of ReactNativeBiometricsImpl that
// spm-headers/react_native_biometrics-Swift.h declares by hand. If this file
// fails to compile, the Swift API changed: update the header and this file
// together.
import Foundation

private let _implType: NSObject.Type = ReactNativeBiometricsImpl.self

private func _pinEventCallback(_ impl: ReactNativeBiometricsImpl) {
  let callback: (([String: Any]) -> Void)? = impl.onBiometricChange
  impl.onBiometricChange = callback
}

private let _swiftHeaderSelectors: [Selector] = [
  #selector(ReactNativeBiometricsImpl.startBiometricChangeDetection(_:rejecter:)),
  #selector(ReactNativeBiometricsImpl.stopBiometricChangeDetection(_:rejecter:)),
  #selector(ReactNativeBiometricsImpl.isSensorAvailable(_:rejecter:)),
  #selector(ReactNativeBiometricsImpl.simplePrompt(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.authenticateWithOptions(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.getDiagnosticInfo(_:rejecter:)),
  #selector(ReactNativeBiometricsImpl.runBiometricTest(_:rejecter:)),
  #selector(ReactNativeBiometricsImpl.setDebugMode(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.configureKeyAlias(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.getDefaultKeyAlias(_:rejecter:)),
  #selector(ReactNativeBiometricsImpl.createKeys(_:keyType:biometricStrength:allowDeviceCredentials:failIfExists:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.createKeysWithOptions(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.deleteKeys(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.getPublicKey(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.getAllKeys(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.validateKeyIntegrity(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.verifyKeySignature(_:data:promptTitle:promptSubtitle:cancelButtonText:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.verifyKeySignatureWithOptions(_:data:promptTitle:promptSubtitle:cancelButtonText:biometricStrength:disableDeviceFallback:inputEncoding:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.verifyKeySignatureWithEncoding(_:data:promptTitle:promptSubtitle:cancelButtonText:inputEncoding:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.signData(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.validateSignature(_:data:signature:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.sha256(_:inputEncoding:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.getKeyAttributes(_:resolver:rejecter:)),
  #selector(ReactNativeBiometricsImpl.getDeviceIntegrityStatus(_:rejecter:)),
]
