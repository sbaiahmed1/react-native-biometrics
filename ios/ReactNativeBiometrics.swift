import Foundation
import LocalAuthentication
import React

@objc(ReactNativeBiometrics)
class ReactNativeBiometrics: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  @objc
  func isSensorAvailable(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    var error: NSError?
    
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
      let biometryType: String
      if #available(iOS 11.0, *) {
        switch context.biometryType {
        case .faceID:
          biometryType = "FaceID"
        case .touchID:
          biometryType = "TouchID"
        case .opticID:
          biometryType = "OpticID"
        default:
          biometryType = "Biometrics"
        }
      } else {
        biometryType = "Biometrics"
      }
      
      resolve(["available": true, "biometryType": biometryType])
    } else {
      resolve(["available": false, "biometryType": "None"])
    }
  }
  
  @objc
  func simplePrompt(_ reason: NSString,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) {
      context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason as String) { success, error in
        DispatchQueue.main.async {
          if success {
            resolve(true)
          } else {
            let nsError = error as NSError?
            reject("AUTH_FAILED", nsError?.localizedDescription ?? "Authentication failed", nsError)
          }
        }
      }
    } else {
      reject("SENSOR_NOT_AVAILABLE", "Biometric authentication not available", nil)
    }
  }
}
