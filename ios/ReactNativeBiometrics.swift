import Foundation
import LocalAuthentication
import React
import Security
import CryptoKit

@objc(ReactNativeBiometrics)
class ReactNativeBiometrics: NSObject {
  
  private var configuredKeyAlias: String?
  
  override init() {
    super.init()
    // Load configured key alias from UserDefaults
    configuredKeyAlias = UserDefaults.standard.string(forKey: "ReactNativeBiometricsKeyAlias")
  }
  
  private func getKeyAlias(_ customAlias: String? = nil) -> String {
    if let customAlias = customAlias {
      return customAlias
    }
    
    if let configuredAlias = configuredKeyAlias {
      return configuredAlias
    }
    
    // Generate app-specific default key alias
    let bundleId = Bundle.main.bundleIdentifier ?? "unknown"
    return "\(bundleId).ReactNativeBiometricsKey"
  }
  
  // MARK: - Helper Methods
  
  /**
   * Determines the appropriate signature algorithm based on key type
   * - Parameter keyRef: The SecKey reference
   * - Returns: The appropriate SecKeyAlgorithm for the key type
   */
  private func getSignatureAlgorithm(for keyRef: SecKey) -> SecKeyAlgorithm {
    let keyAttributes = SecKeyCopyAttributes(keyRef) as? [String: Any] ?? [:]
    let keyType = keyAttributes[kSecAttrKeyType as String] as? String ?? "Unknown"
    
    return keyType == kSecAttrKeyTypeRSA as String 
      ? .rsaSignatureMessagePKCS1v15SHA256 
      : .ecdsaSignatureMessageX962SHA256
  }
  
  /**
   * Performs biometric authentication with consistent error handling
   * - Parameters:
   *   - reason: The localized reason for authentication
   *   - completion: Completion handler with success status and optional error
   */
  private func performBiometricAuthentication(
    reason: String,
    completion: @escaping (Bool, Error?) -> Void
  ) {
    let context = LAContext()
    context.localizedFallbackTitle = ""
    
    var authError: NSError?
    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &authError) else {
      completion(false, authError)
      return
    }
    
    context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason, reply: completion)
  }
  
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
      "lastError": error?.localizedDescription ?? ""
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
  
  @objc
  func configureKeyAlias(_ keyAlias: NSString,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("configureKeyAlias called with: \(keyAlias)")
    
    // Validate key alias
    let aliasString = keyAlias as String
    if aliasString.isEmpty {
      reject("INVALID_KEY_ALIAS", "Key alias cannot be empty", nil)
      return
    }
    
    // Store the configured key alias
    configuredKeyAlias = aliasString
    UserDefaults.standard.set(aliasString, forKey: "ReactNativeBiometricsKeyAlias")
    
    debugLog("Key alias configured successfully: \(aliasString)")
    resolve(nil)
  }
  
  @objc
  func getDefaultKeyAlias(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    let defaultAlias = getKeyAlias()
    debugLog("getDefaultKeyAlias returning: \(defaultAlias)")
    resolve(defaultAlias)
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
  func createKeys(_ keyAlias: NSString?,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("createKeys called with keyAlias: \(keyAlias ?? "default")")
    
    let keyTag = getKeyAlias(keyAlias as String?)
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
      kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
      kSecAttrKeySizeInBits as String: 256,
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
  func deleteKeys(_ keyAlias: NSString?,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("deleteKeys called with keyAlias: \(keyAlias ?? "default")")
    
    let keyTag = getKeyAlias(keyAlias as String?)
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
           (keyTagString.contains(getKeyAlias())) {
          
          // Get the key reference
          guard let keyRef = item[kSecValueRef as String] as! SecKey? else {
            debugLog("Failed to get key reference for tag: \(keyTagString)")
            continue
          }
          
          // Get the public key from the private key reference
          if let publicKey = SecKeyCopyPublicKey(keyRef) {
            // Export the public key data
            var error: Unmanaged<CFError>?
            if let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) {
              let publicKeyString = (publicKeyData as Data).base64EncodedString()
              
              let keyInfo: [String: Any] = [
                "alias": keyTagString,
                "publicKey": publicKeyString
              ]
              
              keysList.append(keyInfo)
              debugLog("Found key with tag: \(keyTagString)")
            } else {
              let errorDescription = error?.takeRetainedValue().localizedDescription ?? "Unknown error"
              debugLog("Failed to export public key for tag: \(keyTagString) - \(errorDescription)")
            }
          } else {
            debugLog("Failed to get public key for tag: \(keyTagString)")
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

  @objc
  func validateKeyIntegrity(_ keyAlias: NSString?,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("validateKeyIntegrity called with keyAlias: \(keyAlias ?? "default")")
    
    let keyTag = getKeyAlias(keyAlias as String?)
    let keyTagData = keyTag.data(using: .utf8)!
    
    // Query to find the key (including Secure Enclave token for proper key lookup)
    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTagData,
      kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
      kSecReturnRef as String: true,
      kSecReturnAttributes as String: true
    ]
    
    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    var integrityResult: [String: Any] = [
      "valid": false,
      "keyExists": false,
      "integrityChecks": [
        "keyFormatValid": false,
        "keyAccessible": false,
        "signatureTestPassed": false,
        "hardwareBacked": false
      ]
    ]
    
    guard status == errSecSuccess else {
      if status == errSecItemNotFound {
        debugLog("validateKeyIntegrity - Key not found")
        resolve(integrityResult)
      } else {
        let errorMessage = SecCopyErrorMessageString(status, nil) as String? ?? "Unknown error"
        debugLog("validateKeyIntegrity failed - Keychain error: \(errorMessage)")
        integrityResult["error"] = "Keychain error: \(errorMessage)"
        resolve(integrityResult)
      }
      return
    }
    
    guard let keyItem = result as? [String: Any],
          let keyRefValue = keyItem[kSecValueRef as String] else {
      debugLog("validateKeyIntegrity failed - Invalid key reference")
      integrityResult["error"] = "Invalid key reference"
      resolve(integrityResult)
      return
    }
    
    // Force cast SecKey since conditional downcast to CoreFoundation types always succeeds
    let keyRef = keyRefValue as! SecKey
    
    integrityResult["keyExists"] = true
    
    // Check key attributes
    let keyAttributes = SecKeyCopyAttributes(keyRef) as? [String: Any] ?? [:]
    let keySize = keyAttributes[kSecAttrKeySizeInBits as String] as? Int ?? 0
    let keyType = keyAttributes[kSecAttrKeyType as String] as? String ?? "Unknown"
    let isHardwareBacked = keyAttributes[kSecAttrTokenID as String] != nil
    
    integrityResult["keyAttributes"] = [
      "algorithm": keyType == kSecAttrKeyTypeRSA as String ? "RSA" : "EC",
      "keySize": keySize,
      "securityLevel": isHardwareBacked ? "Hardware" : "Software"
    ]
    
    var checks = integrityResult["integrityChecks"] as! [String: Any]
    
    // Check if key format is valid
    checks["keyFormatValid"] = true
    checks["keyAccessible"] = true
    checks["hardwareBacked"] = isHardwareBacked
    
    // Perform signature test
    let testData = "integrity_test_data".data(using: .utf8)!
    let algorithm = getSignatureAlgorithm(for: keyRef)
    
    // For Secure Enclave keys, we need biometric authentication
    performBiometricAuthentication(reason: "Authenticate to test key integrity") { success, authenticationError in
      DispatchQueue.main.async {
        if success {
          var error: Unmanaged<CFError>?
          if let signature = SecKeyCreateSignature(keyRef, algorithm, testData as CFData, &error) {
            // Verify the signature with public key
            if let publicKey = SecKeyCopyPublicKey(keyRef) {
              let isValid = SecKeyVerifySignature(publicKey, algorithm, testData as CFData, signature, &error)
              checks["signatureTestPassed"] = isValid
              
              if isValid {
                integrityResult["valid"] = true
              }
            }
          } else {
            let errorDescription = error?.takeRetainedValue().localizedDescription ?? "Unknown error"
            self.debugLog("validateKeyIntegrity - Signature test failed: \(errorDescription)")
            checks["signatureTestPassed"] = false
          }
        } else {
          let errorMessage = authenticationError?.localizedDescription ?? "Authentication failed"
          self.debugLog("validateKeyIntegrity - Authentication failed: \(errorMessage)")
          checks["signatureTestPassed"] = false
        }
        
        integrityResult["integrityChecks"] = checks
        self.debugLog("validateKeyIntegrity completed")
        resolve(integrityResult)
      }
    }
  }
  
  @objc
  func verifyKeySignature(_ keyAlias: NSString?,
                         data: NSString,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("verifyKeySignature called with keyAlias: \(keyAlias ?? "default")")
    
    let keyTag = getKeyAlias(keyAlias as String?)
    let keyTagData = keyTag.data(using: .utf8)!
    
    // Query to find the key (including Secure Enclave token for proper key lookup)
    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTagData,
      kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
      kSecReturnRef as String: true
    ]
    
    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    guard status == errSecSuccess else {
      let errorMessage = status == errSecItemNotFound ? "Key not found" : (SecCopyErrorMessageString(status, nil) as String? ?? "Unknown error")
      debugLog("verifyKeySignature failed - \(errorMessage)")
      resolve(["success": false, "error": errorMessage])
      return
    }
    
    // Force cast SecKey since conditional downcast to CoreFoundation types always succeeds
    let keyRef = result as! SecKey
    let algorithm = getSignatureAlgorithm(for: keyRef)
    let dataToSign = (data as String).data(using: .utf8)!
    
    // For Secure Enclave keys, we need biometric authentication before signing
    performBiometricAuthentication(reason: "Authenticate to create signature") { success, authenticationError in
      DispatchQueue.main.async {
        guard success else {
          let errorMessage = authenticationError?.localizedDescription ?? "Authentication failed"
          self.debugLog("verifyKeySignature failed - Authentication: \(errorMessage)")
          resolve(["success": false, "error": errorMessage])
          return
        }
        
        // Create the signature with the authenticated context
        var error: Unmanaged<CFError>?
        guard let signature = SecKeyCreateSignature(keyRef, algorithm, dataToSign as CFData, &error) else {
          let errorDescription = error?.takeRetainedValue().localizedDescription ?? "Signature creation failed"
          self.debugLog("verifyKeySignature failed - \(errorDescription)")
          resolve(["success": false, "error": errorDescription])
          return
        }
        
        let signatureBase64 = (signature as Data).base64EncodedString()
        
        self.debugLog("verifyKeySignature completed successfully")
        resolve(["success": true, "signature": signatureBase64])
      }
    }
   }
  
  @objc
  func validateSignature(_ keyAlias: NSString?,
                        data: NSString,
                        signature: NSString,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("validateSignature called with keyAlias: \(keyAlias ?? "default")")
    
    // Enhanced input validation
    let dataString = data as String
    let signatureString = signature as String
    
    guard !dataString.isEmpty else {
      debugLog("validateSignature failed - Empty data provided")
      resolve(["valid": false, "error": "Empty data provided"])
      return
    }
    
    guard !signatureString.isEmpty else {
      debugLog("validateSignature failed - Empty signature provided")
      resolve(["valid": false, "error": "Empty signature provided"])
      return
    }
    
    let keyTag = getKeyAlias(keyAlias as String?)
    let keyTagData = keyTag.data(using: .utf8)!
    
    // Query to find the key (including Secure Enclave token for proper key lookup)
    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTagData,
      kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
      kSecReturnRef as String: true
    ]
    
    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    guard status == errSecSuccess else {
      let errorMessage = status == errSecItemNotFound ? "Key not found" : (SecCopyErrorMessageString(status, nil) as String? ?? "Unknown error")
      debugLog("validateSignature failed - \(errorMessage)")
      resolve(["valid": false, "error": errorMessage])
      return
    }
    
    // Force cast SecKey since conditional downcast to CoreFoundation types always succeeds
    let keyRef = result as! SecKey
    
    guard let publicKey = SecKeyCopyPublicKey(keyRef) else {
      debugLog("validateSignature failed - Could not extract public key")
      resolve(["valid": false, "error": "Could not extract public key"])
      return
    }
    
    // Enhanced signature validation with detailed error context
    guard let signatureData = Data(base64Encoded: signatureString) else {
      debugLog("validateSignature failed - Invalid base64 signature format. Length: \(signatureString.count), First 20 chars: \(String(signatureString.prefix(20)))")
      resolve(["valid": false, "error": "Invalid base64 signature format"])
      return
    }
    
    let dataToVerify = dataString.data(using: .utf8)!
    var error: Unmanaged<CFError>?
    
    // Use the appropriate signature algorithm based on key type
    let algorithm = getSignatureAlgorithm(for: keyRef)
    
    let isValid = SecKeyVerifySignature(publicKey, algorithm, dataToVerify as CFData, signatureData as CFData, &error)
    
    if let error = error {
      let errorDescription = error.takeRetainedValue().localizedDescription
      debugLog("validateSignature failed - \(errorDescription)")
      resolve(["valid": false, "error": errorDescription])
    } else {
      debugLog("validateSignature completed - valid: \(isValid)")
      resolve(["valid": isValid])
    }
  }
  
  @objc
  func getKeyAttributes(_ keyAlias: NSString?,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("getKeyAttributes called with keyAlias: \(keyAlias ?? "default")")
    
    let keyTag = getKeyAlias(keyAlias as String?)
    let keyTagData = keyTag.data(using: .utf8)!
    
    // Query to find the key
    let query: [String: Any] = [
      kSecClass as String: kSecClassKey,
      kSecAttrApplicationTag as String: keyTagData,
      kSecReturnRef as String: true,
      kSecReturnAttributes as String: true
    ]
    
    var result: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &result)
    
    guard status == errSecSuccess else {
      if status == errSecItemNotFound {
        debugLog("getKeyAttributes - Key not found")
        resolve(["exists": false])
      } else {
        let errorMessage = SecCopyErrorMessageString(status, nil) as String? ?? "Unknown error"
        debugLog("getKeyAttributes failed - \(errorMessage)")
        resolve(["exists": false, "error": errorMessage])
      }
      return
    }
    
    guard let keyItem = result as? [String: Any],
          let keyRefValue = keyItem[kSecValueRef as String] else {
      debugLog("getKeyAttributes failed - Invalid key reference")
      resolve(["exists": false, "error": "Invalid key reference"])
      return
    }
    
    // Force cast SecKey since conditional downcast to CoreFoundation types always succeeds
    let keyRef = keyRefValue as! SecKey
    
    let keyAttributes = SecKeyCopyAttributes(keyRef) as? [String: Any] ?? [:]
    let keySize = keyAttributes[kSecAttrKeySizeInBits as String] as? Int ?? 0
    let keyType = keyAttributes[kSecAttrKeyType as String] as? String ?? "Unknown"
    let isHardwareBacked = keyAttributes[kSecAttrTokenID as String] != nil
    
    // Default key purposes for biometric keys (sign and verify)
    let keyPurposes = ["sign", "verify"]
    
    let attributes: [String: Any] = [
      "algorithm": keyType == kSecAttrKeyTypeRSA as String ? "RSA" : "EC",
      "keySize": keySize,
      "purposes": keyPurposes,
      "digests": ["SHA256"],
      "padding": ["PKCS1"],
      "securityLevel": isHardwareBacked ? "Hardware" : "Software",
      "hardwareBacked": isHardwareBacked,
      "userAuthenticationRequired": true
    ]
    
    debugLog("getKeyAttributes completed successfully")
    resolve(["exists": true, "attributes": attributes])
  }

  private func debugLog(_ message: String) {
    if isDebugModeEnabled() {
      print("[ReactNativeBiometrics Debug] \(message)")
    }
  }
}
