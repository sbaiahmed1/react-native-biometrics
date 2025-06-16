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
  
  @objc
  func authenticateWithOptions(_ options: NSDictionary,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    
    let title = options["title"] as? String ?? "Biometric Authentication"
    let subtitle = options["subtitle"] as? String
    let description = options["description"] as? String
    let fallbackLabel = options["fallbackLabel"] as? String
    let cancelLabel = options["cancelLabel"] as? String
    let allowDeviceCredentials = options["allowDeviceCredentials"] as? Bool ?? false
    let disableDeviceFallback = options["disableDeviceFallback"] as? Bool ?? false
    
    // Configure context labels
    // Note: localizedFallbackTitle only appears after a failed biometric attempt
    if let fallbackLabel = fallbackLabel, !disableDeviceFallback {
      context.localizedFallbackTitle = fallbackLabel
    } else if disableDeviceFallback {
      context.localizedFallbackTitle = ""
    }
    
    // Note: localizedCancelTitle behavior varies between Touch ID and Face ID
    if let cancelLabel = cancelLabel {
      context.localizedCancelTitle = cancelLabel
    }
    
    // Add debugging to verify labels are set
    print("[ReactNativeBiometrics] Fallback title: \(context.localizedFallbackTitle ?? "nil")")
    print("[ReactNativeBiometrics] Cancel title: \(context.localizedCancelTitle ?? "nil")")
    print("[ReactNativeBiometrics] Disable fallback: \(disableDeviceFallback)")
    
    // Determine authentication policy
    let policy: LAPolicy = allowDeviceCredentials ? 
      .deviceOwnerAuthentication : 
      .deviceOwnerAuthenticationWithBiometrics
    
    // Create reason string
    var reason = title
    if let subtitle = subtitle, !subtitle.isEmpty {
      reason += "\n" + subtitle
    }
    if let description = description, !description.isEmpty {
      reason += "\n" + description
    }
    
    if context.canEvaluatePolicy(policy, error: nil) {
      context.evaluatePolicy(policy, localizedReason: reason) { success, error in
        DispatchQueue.main.async {
          let result: [String: Any] = [
            "success": success
          ]
          
          if success {
            resolve(result)
          } else {
            let nsError = error as NSError?
            var resultWithError = result
            resultWithError["error"] = nsError?.localizedDescription ?? "Authentication failed"
            resultWithError["errorCode"] = "\(nsError?.code ?? -1)"
            resolve(resultWithError)
          }
        }
      }
    } else {
      let result: [String: Any] = [
        "success": false,
        "error": "Biometric authentication not available",
        "errorCode": "SENSOR_NOT_AVAILABLE"
      ]
      resolve(result)
    }
  }
}
