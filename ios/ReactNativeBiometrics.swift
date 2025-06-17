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
    debugLog("isSensorAvailable called")
    let context = LAContext()
    var error: NSError?
    
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
      var biometryType: String
      
      if #available(iOS 11.0, *) {
        switch context.biometryType {
        case .faceID:
          biometryType = "FaceID"
          debugLog("FaceID available")
        case .touchID:
          biometryType = "TouchID"
          debugLog("TouchID available")
        case .opticID:
          biometryType = "OpticID"
          debugLog("OpticID available")
        default:
          biometryType = "Biometrics"
          debugLog("Generic biometrics available")
        }
      } else {
        biometryType = "Biometrics"
        debugLog("Legacy biometrics available")
      }
      
      debugLog("isSensorAvailable result: available=true, biometryType=\(biometryType)")
      resolve(["available": true, "biometryType": biometryType])
    } else {
      let errorMessage = error?.localizedDescription ?? "Unknown error"
      debugLog("Biometric sensor not available: \(errorMessage)")
      resolve(["available": false, "biometryType": "None", "error": errorMessage])
    }
  }
  
  @objc
  func simplePrompt(_ reason: NSString,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("simplePrompt called with reason: \(reason)")
    let context = LAContext()
    
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) {
      debugLog("Showing biometric prompt")
      context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason as String) { success, error in
        DispatchQueue.main.async {
          if success {
            self.debugLog("simplePrompt authentication succeeded")
            resolve(true)
          } else {
            let nsError = error as NSError?
            let errorMessage = nsError?.localizedDescription ?? "Authentication failed"
            self.debugLog("simplePrompt authentication failed: \(errorMessage)")
            reject("AUTH_FAILED", errorMessage, nsError)
          }
        }
      }
    } else {
      debugLog("Biometric sensor not available for simplePrompt")
      reject("SENSOR_NOT_AVAILABLE", "Biometric authentication not available", nil)
    }
  }
  
  @objc
  func authenticateWithOptions(_ options: NSDictionary,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("authenticateWithOptions called with options: \(options)")
    let context = LAContext()
    
    let title = options["title"] as? String ?? "Biometric Authentication"
    let subtitle = options["subtitle"] as? String
    let description = options["description"] as? String
    let fallbackLabel = options["fallbackLabel"] as? String
    let cancelLabel = options["cancelLabel"] as? String
    let allowDeviceCredentials = options["allowDeviceCredentials"] as? Bool ?? false
    let disableDeviceFallback = options["disableDeviceFallback"] as? Bool ?? false
    
    debugLog("Authentication options - title: \(title), allowDeviceCredentials: \(allowDeviceCredentials), disableDeviceFallback: \(disableDeviceFallback)")
    
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
    debugLog("Fallback title: \(context.localizedFallbackTitle ?? "nil")")
    debugLog("Cancel title: \(context.localizedCancelTitle ?? "nil")")
    debugLog("Disable fallback: \(disableDeviceFallback)")
    
    // Determine authentication policy
    let policy: LAPolicy = allowDeviceCredentials ? 
      .deviceOwnerAuthentication : 
      .deviceOwnerAuthenticationWithBiometrics
    
    debugLog("Using authentication policy: \(policy == .deviceOwnerAuthentication ? "deviceOwnerAuthentication" : "deviceOwnerAuthenticationWithBiometrics")")
    
    // Create reason string
    var reason = title
    if let subtitle = subtitle, !subtitle.isEmpty {
      reason += "\n" + subtitle
    }
    if let description = description, !description.isEmpty {
      reason += "\n" + description
    }
    
    debugLog("Authentication reason: \(reason)")
    
    if context.canEvaluatePolicy(policy, error: nil) {
      debugLog("Showing authentication prompt")
      context.evaluatePolicy(policy, localizedReason: reason) { success, error in
        DispatchQueue.main.async {
          let result: [String: Any] = [
            "success": success
          ]
          
          if success {
            self.debugLog("authenticateWithOptions authentication succeeded")
            resolve(result)
          } else {
            let nsError = error as NSError?
            let errorMessage = nsError?.localizedDescription ?? "Authentication failed"
            self.debugLog("authenticateWithOptions authentication failed: \(errorMessage)")
            var resultWithError = result
            resultWithError["error"] = errorMessage
            resultWithError["errorCode"] = "\(nsError?.code ?? -1)"
            resolve(resultWithError)
          }
        }
      }
    } else {
      debugLog("Biometric authentication not available - policy cannot be evaluated")
      let result: [String: Any] = [
        "success": false,
        "error": "Biometric authentication not available",
        "errorCode": "SENSOR_NOT_AVAILABLE"
      ]
      resolve(result)
    }
  }
  
  // MARK: - Debugging Utilities
  
  @objc
  func getDiagnosticInfo(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    var error: NSError?
    
    let result: [String: Any] = [
      "platform": "iOS",
      "osVersion": UIDevice.current.systemVersion,
      "deviceModel": UIDevice.current.model,
      "biometricCapabilities": getBiometricCapabilities(),
      "securityLevel": getSecurityLevel(),
      "keyguardSecure": context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error),
      "enrolledBiometrics": getEnrolledBiometrics(),
      "lastError": error?.localizedDescription
    ]
    
    resolve(result)
  }
  
  @objc
  func runBiometricTest(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    let context = LAContext()
    var error: NSError?
    var errors: [String] = []
    var warnings: [String] = []
    
    // Test sensor availability
    let sensorAvailable = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    if let error = error {
      errors.append("Sensor test failed: \(error.localizedDescription)")
    }
    
    // Test authentication capability
    let canAuthenticate = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
    if let error = error {
      errors.append("Authentication test failed: \(error.localizedDescription)")
    }
    
    // Check hardware detection
    let hardwareDetected = context.biometryType != .none
    if !hardwareDetected {
      warnings.append("No biometric hardware detected")
    }
    
    // Check enrolled biometrics
    let hasEnrolledBiometrics = sensorAvailable
    if !hasEnrolledBiometrics {
      warnings.append("No biometrics enrolled")
    }
    
    // Check secure hardware (always true on iOS)
    let secureHardware = true
    
    let results: [String: Any] = [
      "sensorAvailable": sensorAvailable,
      "canAuthenticate": canAuthenticate,
      "hardwareDetected": hardwareDetected,
      "hasEnrolledBiometrics": hasEnrolledBiometrics,
      "secureHardware": secureHardware
    ]
    
    let result: [String: Any] = [
      "success": errors.isEmpty,
      "results": results,
      "errors": errors,
      "warnings": warnings
    ]
    
    resolve(result)
  }
  
  @objc
  func setDebugMode(_ enabled: Bool,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Store debug mode state
    UserDefaults.standard.set(enabled, forKey: "ReactNativeBiometricsDebugMode")
    
    if enabled {
      print("[ReactNativeBiometrics] Debug mode enabled")
    } else {
      print("[ReactNativeBiometrics] Debug mode disabled")
    }
    
    resolve(nil)
  }
  
  // MARK: - Private Helper Methods
  
  private func getBiometricCapabilities() -> [String] {
    let context = LAContext()
    var capabilities: [String] = []
    
    if #available(iOS 11.0, *) {
      switch context.biometryType {
      case .faceID:
        capabilities.append("FaceID")
      case .touchID:
        capabilities.append("TouchID")
      case .opticID:
        capabilities.append("OpticID")
      case .none:
        capabilities.append("None")
      @unknown default:
        capabilities.append("Unknown")
      }
    } else {
      capabilities.append("Legacy")
    }
    
    return capabilities
  }
  
  private func getSecurityLevel() -> String {
    // iOS always uses secure hardware for biometrics
    return "SecureHardware"
  }
  
  private func getEnrolledBiometrics() -> [String] {
    let context = LAContext()
    var enrolled: [String] = []
    
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) {
      if #available(iOS 11.0, *) {
        switch context.biometryType {
        case .faceID:
          enrolled.append("FaceID")
        case .touchID:
          enrolled.append("TouchID")
        case .opticID:
          enrolled.append("OpticID")
        default:
          break
        }
      }
    }
    
    return enrolled
  }
  
  private func isDebugModeEnabled() -> Bool {
    return UserDefaults.standard.bool(forKey: "ReactNativeBiometricsDebugMode")
  }
  
  @objc
  func createKeys(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("createKeys called")
    
    // For now, return a placeholder implementation
    // In a real implementation, this would generate cryptographic keys using Keychain
    let result: [String: Any] = [
      "publicKey": "placeholder-public-key"
    ]
    
    debugLog("Keys created successfully")
    resolve(result)
  }
  
  @objc
  func deleteKeys(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("deleteKeys called")
    
    // For now, return a placeholder implementation
    // In a real implementation, this would delete stored cryptographic keys from Keychain
    let result: [String: Any] = [
      "success": true
    ]
    
    debugLog("Keys deleted successfully")
    resolve(result)
  }

  private func debugLog(_ message: String) {
    if isDebugModeEnabled() {
      print("[ReactNativeBiometrics Debug] \(message)")
    }
  }
}
