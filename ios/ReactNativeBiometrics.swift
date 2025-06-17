import Foundation
import LocalAuthentication
import React
import Security
import CryptoKit

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
    
    let keyTag = "ReactNativeBiometricsKey"
    let keyTagData = keyTag.data(using: .utf8)!
    
    // Delete existing key if it exists
    let deleteQuery: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTagData
    ]
    SecItemDelete(deleteQuery as CFDictionary)
    debugLog("Deleted existing key (if any)")
    
    // Create access control for biometric authentication
    guard let accessControl = SecAccessControlCreateWithFlags(
      kCFAllocatorDefault,
      kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
      [.biometryAny, .privateKeyUsage],
      nil
    ) else {
      debugLog("createKeys failed - Could not create access control")
      reject("CREATE_KEYS_ERROR", "Could not create access control", nil)
      return
    }
    
    // Key generation parameters
    let keyAttributes: [String: Any] = [
      kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
      kSecAttrKeySizeInBits as String: 2048,
      kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
      kSecPrivateKeyAttrs as String: [
        kSecAttrIsPermanent as String: true,
        kSecAttrApplicationTag as String: keyTagData,
        kSecAttrAccessControl as String: accessControl
      ]
    ]
    
    var error: Unmanaged<CFError>?
    guard let privateKey = SecKeyCreateRandomKey(keyAttributes as CFDictionary, &error) else {
      let errorDescription = error?.takeRetainedValue().localizedDescription ?? "Unknown error"
      debugLog("createKeys failed - Key generation error: \(errorDescription)")
      reject("CREATE_KEYS_ERROR", "Key generation failed: \(errorDescription)", nil)
      return
    }
    
    // Get public key
    guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
      debugLog("createKeys failed - Could not extract public key")
      reject("CREATE_KEYS_ERROR", "Could not extract public key", nil)
      return
    }
    
    // Export public key
    guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) else {
      let errorDescription = error?.takeRetainedValue().localizedDescription ?? "Unknown error"
      debugLog("createKeys failed - Public key export error: \(errorDescription)")
      reject("CREATE_KEYS_ERROR", "Public key export failed: \(errorDescription)", nil)
      return
    }
    
    let publicKeyBase64 = (publicKeyData as Data).base64EncodedString()
    
    let result: [String: Any] = [
      "publicKey": publicKeyBase64
    ]
    
    debugLog("Keys created successfully with tag: \(keyTag)")
    resolve(result)
  }
  
  @objc
  func deleteKeys(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("deleteKeys called")
    
    let keyTag = "ReactNativeBiometricsKey"
    let keyTagData = keyTag.data(using: .utf8)!
    
    // Query to find the key
    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTagData
    ]
    
    // Check if key exists first
    let checkStatus = SecItemCopyMatching(query as CFDictionary, nil)
    
    if checkStatus == errSecItemNotFound {
      debugLog("No key found with tag '\(keyTag)' - nothing to delete")
      let result: [String: Any] = [
        "success": true
      ]
      resolve(result)
      return
    }
    
    // Delete the key
    let deleteStatus = SecItemDelete(query as CFDictionary)
    
    switch deleteStatus {
    case errSecSuccess:
      debugLog("Key with tag '\(keyTag)' deleted successfully")
      
      // Verify deletion
      let verifyStatus = SecItemCopyMatching(query as CFDictionary, nil)
      if verifyStatus == errSecItemNotFound {
        let result: [String: Any] = [
          "success": true
        ]
        debugLog("Keys deleted and verified successfully")
        resolve(result)
      } else {
        debugLog("deleteKeys failed - Key still exists after deletion attempt")
        reject("DELETE_KEYS_ERROR", "Key deletion verification failed", nil)
      }
      
    case errSecItemNotFound:
      debugLog("No key found with tag '\(keyTag)' - nothing to delete")
      let result: [String: Any] = [
        "success": true
      ]
      resolve(result)
      
    default:
      let errorMessage = SecCopyErrorMessageString(deleteStatus, nil) as String? ?? "Unknown error"
      debugLog("deleteKeys failed - Keychain error: \(errorMessage) (status: \(deleteStatus))")
      reject("DELETE_KEYS_ERROR", "Keychain deletion failed: \(errorMessage)", nil)
    }
  }

  @objc
  func getAllKeys(_ resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("getAllKeys called")
    
    // Query to find all keys in the Keychain
    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecMatchLimit as String: kSecMatchLimitAll,
      kSecReturnAttributes as String: true,
      kSecReturnRef as String: true
    ]
    
    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    switch status {
    case errSecSuccess:
      guard let items = result as? [[String: Any]] else {
        debugLog("getAllKeys failed - Invalid result format")
        reject("GET_ALL_KEYS_ERROR", "Invalid result format", nil)
        return
      }
      
      var keysList: [[String: Any]] = []
      
      for item in items {
        // Filter for our biometric keys
        if let keyTag = item[kSecAttrApplicationTag as String] as? Data,
           let keyTagString = String(data: keyTag, encoding: .utf8),
           (keyTagString.contains("ReactNativeBiometrics") || keyTagString.contains("Biometric")) {
          
          // Get the key reference
          if let keyRef = item[kSecValueRef as String] {
            do {
              // Export the public key
              let publicKeyQuery: [String: Any] = [
                kSecClass as String: kSecClassKey,
                kSecValueRef as String: keyRef,
                kSecReturnData as String: true
              ]
              
              var publicKeyData: CFTypeRef?
              let publicKeyStatus = SecItemCopyMatching(publicKeyQuery as CFDictionary, &publicKeyData)
              
              if publicKeyStatus == errSecSuccess,
                 let keyData = publicKeyData as? Data {
                let publicKeyString = keyData.base64EncodedString()
                
                let keyInfo: [String: Any] = [
                  "alias": keyTagString,
                  "publicKey": publicKeyString
                  // Note: iOS Keychain doesn't provide creation date easily
                  // You could store this separately if needed
                ]
                
                keysList.append(keyInfo)
                debugLog("Found key with tag: \(keyTagString)")
              } else {
                debugLog("Failed to export public key for tag: \(keyTagString)")
              }
            } catch {
              debugLog("Error processing key \(keyTagString): \(error.localizedDescription)")
            }
          }
        }
      }
      
      let resultDict: [String: Any] = [
        "keys": keysList
      ]
      
      debugLog("getAllKeys completed successfully, found \(keysList.count) keys")
      resolve(resultDict)
      
    case errSecItemNotFound:
      debugLog("getAllKeys completed - No keys found")
      let resultDict: [String: Any] = [
        "keys": []
      ]
      resolve(resultDict)
      
    default:
      let errorMessage = SecCopyErrorMessageString(status, nil) as String? ?? "Unknown error"
      debugLog("getAllKeys failed - Keychain error: \(errorMessage) (status: \(status))")
      reject("GET_ALL_KEYS_ERROR", "Keychain query failed: \(errorMessage)", nil)
    }
  }

  private func debugLog(_ message: String) {
    if isDebugModeEnabled() {
      print("[ReactNativeBiometrics Debug] \(message)")
    }
  }
}
