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

  private func handleError(
    _ error: ReactNativeBiometricsError,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let errorInfo = error.errorInfo
    debugLog("Error: \(errorInfo.code) - \(errorInfo.message)")
    reject(errorInfo.code, errorInfo.message, error)
  }

  private func handleErrorWithResult(
    _ error: ReactNativeBiometricsError,
    resolve: @escaping RCTPromiseResolveBlock
  ) {
    let errorInfo = error.errorInfo
    debugLog("Error: \(errorInfo.code) - \(errorInfo.message)")
    resolve([
      "success": false,
      "error": errorInfo.message,
      "errorCode": errorInfo.code
    ])
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
   * - reason: The localized reason for authentication
   * - completion: Completion handler with success status and optional error
   */
  private func performBiometricAuthentication(
    reason: String,
    completion: @escaping (Bool, Error?) -> Void
  ) {
    let context = LAContext()
    context.localizedFallbackTitle = ""

    var authError: NSError?
    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &authError) else {
      if let laError = authError as? LAError {
        completion(false, ReactNativeBiometricsError.fromLAError(laError))
      } else {
        completion(false, ReactNativeBiometricsError.biometryNotAvailable)
      }
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
      let biometricsError: ReactNativeBiometricsError
      if let laError = error as? LAError {
        biometricsError = ReactNativeBiometricsError.fromLAError(laError)
      } else {
        biometricsError = .biometryNotAvailable
      }

      let errorInfo = biometricsError.errorInfo
      debugLog("Biometric sensor not available: \(errorInfo.message)")
      resolve([
        "available": false,
        "biometryType": "None",
        "error": errorInfo.message,
        "errorCode": errorInfo.code
      ])

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
            let biometricsError: ReactNativeBiometricsError
            if let laError = error as? LAError {
              biometricsError = ReactNativeBiometricsError.fromLAError(laError)
            } else {
              biometricsError = .authenticationFailed
            }
            self.handleError(biometricsError, reject: reject)
          }
        }
      }
    } else {
      debugLog("Biometric sensor not available for simplePrompt")
      handleError(.biometryNotAvailable, reject: reject)
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
            let biometricsError: ReactNativeBiometricsError
            if let laError = error as? LAError {
              biometricsError = ReactNativeBiometricsError.fromLAError(laError)
            } else {
              biometricsError = .authenticationFailed
            }

            let errorInfo = biometricsError.errorInfo
            self.debugLog("authenticateWithOptions authentication failed: \(errorInfo.message)")
            var resultWithError = result
            resultWithError["error"] = errorInfo.message
            resultWithError["errorCode"] = errorInfo.code
            resolve(resultWithError)
          }
        }
      }
    } else {
      debugLog("Biometric authentication not available - policy cannot be evaluated")
      let errorInfo = ReactNativeBiometricsError.biometryNotAvailable.errorInfo
      let result: [String: Any] = [
        "success": false,
        "error": errorInfo.message,
        "errorCode": errorInfo.code
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
      handleError(.emptyKeyAlias, reject: reject)
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
    guard let keyTagData = keyTag.data(using: .utf8) else {
      handleError(.dataEncodingFailed, reject: reject)
      return
    }

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
      handleError(.accessControlCreationFailed, reject: reject)
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
      let biometricsError = ReactNativeBiometricsError.keyCreationFailed
      if let cfError = error?.takeRetainedValue() {
        debugLog("createKeys failed - Key generation error: \(cfError.localizedDescription)")
      } else {
        debugLog("createKeys failed - Key generation error: Unknown")
      }
      handleError(biometricsError, reject: reject)
      return
    }

    // Get public key
    guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
      debugLog("createKeys failed - Could not extract public key")
      handleError(.publicKeyExtractionFailed, reject: reject)
      return
    }

    // Export public key
    guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) else {
      let biometricsError = ReactNativeBiometricsError.keyExportFailed
      if let cfError = error?.takeRetainedValue() {
        debugLog("createKeys failed - Public key export error: \(cfError.localizedDescription)")
      } else {
        debugLog("createKeys failed - Public key export error: Unknown")
      }
      handleError(biometricsError, reject: reject)
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
      resolve(["success": true])
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
        debugLog("Keys deleted and verified successfully")
        resolve(["success": true])
      } else {
        debugLog("deleteKeys failed - Key still exists after deletion attempt")
        handleError(.keyDeletionFailed, reject: reject)
      }

    case errSecItemNotFound:
      debugLog("No key found with tag '\(keyTag)' - nothing to delete")
      resolve(["success": true])

    default:
      debugLog("deleteKeys failed - Keychain error: status \(deleteStatus)")
      let biometricsError = ReactNativeBiometricsError.fromOSStatus(deleteStatus)
      handleError(biometricsError, reject: reject)
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
        handleError(.keychainQueryFailed, reject: reject)
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
      let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
      handleError(biometricsError, reject: reject)
    }
  }

  @objc
  func validateKeyIntegrity(_ keyAlias: NSString?,
                            resolver resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    debugLog("validateKeyIntegrity called with keyAlias: \(keyAlias ?? "default")")

    let keyTag = getKeyAlias(keyAlias as String?)
    guard let keyTagData = keyTag.data(using: .utf8) else {
      handleError(.dataEncodingFailed, reject: reject)
      return
    }

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
        let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
        debugLog("validateKeyIntegrity failed - Keychain error: \(biometricsError.errorInfo.message)")
        integrityResult["error"] = biometricsError.errorInfo.message
        resolve(integrityResult)
      }
      return
    }

    guard let keyItem = result as? [String: Any],
          let keyRefValue = keyItem[kSecValueRef as String] else {
      debugLog("validateKeyIntegrity failed - Invalid key reference")
      integrityResult["error"] = ReactNativeBiometricsError.invalidKeyReference.errorInfo.message
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
            } else {
              self.debugLog("validateKeyIntegrity - Public key extraction failed for verification.")
              checks["signatureTestPassed"] = false
              integrityResult["error"] = ReactNativeBiometricsError.publicKeyExtractionFailed.errorInfo.message
            }
          } else {
            let errorDescription = error?.takeRetainedValue().localizedDescription ?? "Unknown error"
            self.debugLog("validateKeyIntegrity - Signature test failed: \(errorDescription)")
            checks["signatureTestPassed"] = false
            integrityResult["error"] = ReactNativeBiometricsError.signatureCreationFailed.errorInfo.message
          }
        } else {
          let biometricsError: ReactNativeBiometricsError
          if let laError = authenticationError as? LAError {
            biometricsError = ReactNativeBiometricsError.fromLAError(laError)
          } else {
            biometricsError = .authenticationFailed
          }
          self.debugLog("validateKeyIntegrity - Authentication failed: \(biometricsError.errorInfo.message)")
          checks["signatureTestPassed"] = false
          integrityResult["error"] = biometricsError.errorInfo.message
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
    guard let keyTagData = keyTag.data(using: .utf8) else {
      handleError(.dataEncodingFailed, reject: reject)
      return
    }

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
      let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
      debugLog("verifyKeySignature failed - \(biometricsError.errorInfo.message)")
      resolve(["success": false, "error": biometricsError.errorInfo.message, "errorCode": biometricsError.errorInfo.code])
      return
    }

    // Force cast SecKey since conditional downcast to CoreFoundation types always succeeds
    let keyRef = result as! SecKey
    let algorithm = getSignatureAlgorithm(for: keyRef)
    guard let dataToSign = (data as String).data(using: .utf8) else {
      handleError(.dataEncodingFailed, reject: reject)
      return
    }

    // For Secure Enclave keys, we need biometric authentication before signing
    performBiometricAuthentication(reason: "Authenticate to create signature") { success, authenticationError in
      DispatchQueue.main.async {
        guard success else {
          let biometricsError: ReactNativeBiometricsError
          if let laError = authenticationError as? LAError {
            biometricsError = ReactNativeBiometricsError.fromLAError(laError)
          } else {
            biometricsError = .authenticationFailed
          }
          self.debugLog("verifyKeySignature failed - Authentication: \(biometricsError.errorInfo.message)")
          resolve(["success": false, "error": biometricsError.errorInfo.message, "errorCode": biometricsError.errorInfo.code])
          return
        }

        // Create the signature with the authenticated context
        var error: Unmanaged<CFError>?
        guard let signature = SecKeyCreateSignature(keyRef, algorithm, dataToSign as CFData, &error) else {
          let biometricsError = ReactNativeBiometricsError.signatureCreationFailed
          if let cfError = error?.takeRetainedValue() {
            self.debugLog("verifyKeySignature failed - \(cfError.localizedDescription)")
          } else {
            self.debugLog("verifyKeySignature failed - Signature creation failed (unknown error)")
          }
          resolve(["success": false, "error": biometricsError.errorInfo.message, "errorCode": biometricsError.errorInfo.code])
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
      handleErrorWithResult(.emptyData, resolve: resolve)
      return
    }

    guard !signatureString.isEmpty else {
      debugLog("validateSignature failed - Empty signature provided")
      handleErrorWithResult(.emptySignature, resolve: resolve)
      return
    }

    let keyTag = getKeyAlias(keyAlias as String?)
    guard let keyTagData = keyTag.data(using: .utf8) else {
      handleErrorWithResult(.dataEncodingFailed, resolve: resolve)
      return
    }

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
      let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
      debugLog("validateSignature failed - \(biometricsError.errorInfo.message)")
      handleErrorWithResult(biometricsError, resolve: resolve)
      return
    }

    // Force cast SecKey since conditional downcast to CoreFoundation types always succeeds
    let keyRef = result as! SecKey

    guard let publicKey = SecKeyCopyPublicKey(keyRef) else {
      debugLog("validateSignature failed - Could not extract public key")
      handleErrorWithResult(.publicKeyExtractionFailed, resolve: resolve)
      return
    }

    // Enhanced signature validation with detailed error context
    guard let signatureData = Data(base64Encoded: signatureString) else {
      debugLog("validateSignature failed - Invalid base64 signature format. Length: \(signatureString.count), First 20 chars: \(String(signatureString.prefix(20)))")
      handleErrorWithResult(.invalidBase64, resolve: resolve)
      return
    }

    guard let dataToVerify = dataString.data(using: .utf8) else {
      handleErrorWithResult(.dataEncodingFailed, resolve: resolve)
      return
    }
    var error: Unmanaged<CFError>?

    // Use the appropriate signature algorithm based on key type
    let algorithm = getSignatureAlgorithm(for: keyRef)

    let isValid = SecKeyVerifySignature(publicKey, algorithm, dataToVerify as CFData, signatureData as CFData, &error)

    if let cfError = error?.takeRetainedValue() {
      let biometricsError = ReactNativeBiometricsError.signatureVerificationFailed
      debugLog("validateSignature failed - \(cfError.localizedDescription)")
      handleErrorWithResult(biometricsError, resolve: resolve)
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
    guard let keyTagData = keyTag.data(using: .utf8) else {
      handleErrorWithResult(.dataEncodingFailed, resolve: resolve)
      return
    }

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
        let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
        debugLog("getKeyAttributes failed - \(biometricsError.errorInfo.message)")
        resolve(["exists": false, "error": biometricsError.errorInfo.message, "errorCode": biometricsError.errorInfo.code])
      }
      return
    }

    guard let keyItem = result as? [String: Any],
          let keyRefValue = keyItem[kSecValueRef as String] else {
      debugLog("getKeyAttributes failed - Invalid key reference")
      handleErrorWithResult(.invalidKeyReference, resolve: resolve)
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

// MARK: - ReactNativeBiometricsError
enum ReactNativeBiometricsError: Error {
  case userCancel
  case userFallback
  case systemCancel
  case authenticationFailed
  case invalidContext
  case notInteractive
  case biometryNotAvailable
  case biometryNotEnrolled
  case biometryLockout
  case biometryLockoutPermanent
  case passcodeNotSet
  case touchIDNotAvailable
  case touchIDNotEnrolled
  case touchIDLockout
  case faceIDNotAvailable
  case faceIDNotEnrolled
  case faceIDLockout
  case watchNotAvailable
  case biometryDisconnected

  case keyNotFound
  case keyCreationFailed
  case keyDeletionFailed
  case keyAccessFailed
  case invalidKeyAlias
  case keyExportFailed
  case publicKeyExtractionFailed
  case accessControlCreationFailed
  case keychainQueryFailed
  case invalidKeyReference
  case keyIntegrityCheckFailed

  case signatureCreationFailed
  case signatureVerificationFailed
  case invalidSignatureFormat
  case algorithmNotSupported
  case dataEncodingFailed

  case emptyData
  case emptySignature
  case emptyKeyAlias
  case invalidBase64
  case invalidParameters

  case secureEnclaveNotAvailable
  case hardwareNotSupported
  case osVersionNotSupported
  case memoryAllocationFailed
  case unexpectedError(String)

  case unknown(Int)

  var errorInfo: (code: String, message: String) {
    switch self {
      // Authentication Errors
    case .userCancel:
      return ("USER_CANCEL", "User canceled authentication")
    case .userFallback:
      return ("USER_FALLBACK", "User selected fallback authentication")
    case .systemCancel:
      return ("SYSTEM_CANCEL", "System canceled authentication")
    case .authenticationFailed:
      return ("AUTHENTICATION_FAILED", "Authentication failed")
    case .invalidContext:
      return ("INVALID_CONTEXT", "Invalid authentication context")
    case .notInteractive:
      return ("NOT_INTERACTIVE", "Authentication not interactive")
    case .biometryNotAvailable:
      return ("BIOMETRY_NOT_AVAILABLE", "Biometric authentication not available")
    case .biometryNotEnrolled:
      return ("BIOMETRY_NOT_ENROLLED", "No biometric data enrolled")
    case .biometryLockout:
      return ("BIOMETRY_LOCKOUT", "Biometric authentication locked out")
    case .biometryLockoutPermanent:
      return ("BIOMETRY_LOCKOUT_PERMANENT", "Biometric authentication permanently locked out")
    case .passcodeNotSet:
      return ("PASSCODE_NOT_SET", "Device passcode not set")
    case .touchIDNotAvailable:
      return ("TOUCH_ID_NOT_AVAILABLE", "Touch ID not available")
    case .touchIDNotEnrolled:
      return ("TOUCH_ID_NOT_ENROLLED", "Touch ID not enrolled")
    case .touchIDLockout:
      return ("TOUCH_ID_LOCKOUT", "Touch ID locked out")
    case .faceIDNotAvailable:
      return ("FACE_ID_NOT_AVAILABLE", "Face ID not available")
    case .faceIDNotEnrolled:
      return ("FACE_ID_NOT_ENROLLED", "Face ID not enrolled")
    case .faceIDLockout:
      return ("FACE_ID_LOCKOUT", "Face ID locked out")
    case .watchNotAvailable:
      return ("WATCH_NOT_AVAILABLE", "Apple Watch not available")
    case .biometryDisconnected:
      return ("BIOMETRY_DISCONNECTED", "Biometric sensor disconnected")

      // Key Management Errors
    case .keyNotFound:
      return ("KEY_NOT_FOUND", "Cryptographic key not found")
    case .keyCreationFailed:
      return ("KEY_CREATION_FAILED", "Failed to create cryptographic key")
    case .keyDeletionFailed:
      return ("KEY_DELETION_FAILED", "Failed to delete cryptographic key")
    case .keyAccessFailed:
      return ("KEY_ACCESS_FAILED", "Failed to access cryptographic key")
    case .invalidKeyAlias:
      return ("INVALID_KEY_ALIAS", "Invalid key alias provided")
    case .keyExportFailed:
      return ("KEY_EXPORT_FAILED", "Failed to export key data")
    case .publicKeyExtractionFailed:
      return ("PUBLIC_KEY_EXTRACTION_FAILED", "Failed to extract public key")
    case .accessControlCreationFailed:
      return ("ACCESS_CONTROL_CREATION_FAILED", "Failed to create access control")
    case .keychainQueryFailed:
      return ("KEYCHAIN_QUERY_FAILED", "Keychain query operation failed")
    case .invalidKeyReference:
      return ("INVALID_KEY_REFERENCE", "Invalid key reference")
    case .keyIntegrityCheckFailed:
      return ("KEY_INTEGRITY_CHECK_FAILED", "Key integrity verification failed")

      // Signature Errors
    case .signatureCreationFailed:
      return ("SIGNATURE_CREATION_FAILED", "Failed to create digital signature")
    case .signatureVerificationFailed:
      return ("SIGNATURE_VERIFICATION_FAILED", "Failed to verify digital signature")
    case .invalidSignatureFormat:
      return ("INVALID_SIGNATURE_FORMAT", "Invalid signature format")
    case .algorithmNotSupported:
      return ("ALGORITHM_NOT_SUPPORTED", "Cryptographic algorithm not supported")
    case .dataEncodingFailed:
      return ("DATA_ENCODING_FAILED", "Failed to encode data")

      // Input Validation Errors
    case .emptyData:
      return ("EMPTY_DATA", "Data parameter cannot be empty")
    case .emptySignature:
      return ("EMPTY_SIGNATURE", "Signature parameter cannot be empty")
    case .emptyKeyAlias:
      return ("EMPTY_KEY_ALIAS", "Key alias cannot be empty")
    case .invalidBase64:
      return ("INVALID_BASE64", "Invalid base64 encoding")
    case .invalidParameters:
      return ("INVALID_PARAMETERS", "Invalid parameters provided")

      // System Errors
    case .secureEnclaveNotAvailable:
      return ("SECURE_ENCLAVE_NOT_AVAILABLE", "Secure Enclave not available")
    case .hardwareNotSupported:
      return ("HARDWARE_NOT_SUPPORTED", "Hardware not supported")
    case .osVersionNotSupported:
      return ("OS_VERSION_NOT_SUPPORTED", "OS version not supported")
    case .memoryAllocationFailed:
      return ("MEMORY_ALLOCATION_FAILED", "Memory allocation failed")
    case .unexpectedError(let message):
      return ("UNEXPECTED_ERROR", "Unexpected error: \(message)")
    case .unknown(let code):
      return ("UNKNOWN_ERROR", "Unknown error with code: \(code)")
    }
  }

  static func fromLAError(_ error: LAError) -> ReactNativeBiometricsError {
    switch error.code {
    case .userCancel:
      return .userCancel
    case .userFallback:
      return .userFallback
    case .systemCancel:
      return .systemCancel
    case .authenticationFailed:
      return .authenticationFailed
    case .invalidContext:
      return .invalidContext
    case .notInteractive:
      return .notInteractive
    case .biometryNotAvailable:
      return .biometryNotAvailable
    case .biometryNotEnrolled:
      return .biometryNotEnrolled
    case .biometryLockout:
      return .biometryLockout
    case .passcodeNotSet:
      return .passcodeNotSet
    case .touchIDNotAvailable:
      return .touchIDNotAvailable
    case .touchIDNotEnrolled:
      return .touchIDNotEnrolled
    case .touchIDLockout:
      return .touchIDLockout
    case .biometryDisconnected:
      return .biometryDisconnected
    default:
      return .unknown(error.code.rawValue)
    }
  }

  static func fromOSStatus(_ status: OSStatus) -> ReactNativeBiometricsError {
    switch status {
    case errSecItemNotFound:
      return .keyNotFound
    case errSecAuthFailed:
      return .authenticationFailed
    case errSecUserCanceled:
      return .userCancel
    case errSecNotAvailable:
      return .secureEnclaveNotAvailable
    case errSecParam:
      return .invalidParameters
    case errSecAllocate:
      return .memoryAllocationFailed
    case errSecDuplicateItem:
      return .keyCreationFailed
    case errSecDecode:
      return .invalidSignatureFormat
    default:
      return .unknown(Int(status))
    }
  }
}
