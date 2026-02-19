import Foundation
import LocalAuthentication
import React
import Security
import CryptoKit

@objc(ReactNativeBiometrics)
class ReactNativeBiometrics: RCTEventEmitter {

  private var configuredKeyAlias: String?
  private var biometricChangeObserver: NSObjectProtocol?
  private var lastBiometricState: BiometricState?

  private struct BiometricState {
    let available: Bool
    let biometryType: String
    let enrolledCount: Int
    let domainState: Data?
  }

  override init() {
    super.init()
    // Load configured key alias from UserDefaults
    configuredKeyAlias = UserDefaults.standard.string(forKey: "ReactNativeBiometricsKeyAlias")
  }

  deinit {
    if let observer = biometricChangeObserver {
      NotificationCenter.default.removeObserver(observer)
    }
  }
  
  private func getKeyAlias(_ customAlias: String? = nil) -> String {
    return generateKeyAlias(customAlias: customAlias, configuredAlias: configuredKeyAlias)
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // MARK: - Event Emitter Support

  override func supportedEvents() -> [String]! {
    return ["onBiometricChange"]
  }

  override func startObserving() {
    // Called when JS side starts listening
    ReactNativeBiometricDebug.debugLog("Started observing biometric changes")
    if biometricChangeObserver == nil {
      lastBiometricState = getCurrentBiometricState()
      setupBiometricChangeDetection()
    }
  }

  override func stopObserving() {
    // Called when JS side stops listening
    ReactNativeBiometricDebug.debugLog("Stopped observing biometric changes")
    if let observer = biometricChangeObserver {
      NotificationCenter.default.removeObserver(observer)
      biometricChangeObserver = nil
      lastBiometricState = nil
    }
  }

  @objc
  override func addListener(_ eventName: String) {
    super.addListener(eventName)
  }

  @objc
  override func removeListeners(_ count: Double) {
    super.removeListeners(count)
  }

  // MARK: - Biometric Change Detection Control

  @objc
  func startBiometricChangeDetection(_ resolve: @escaping RCTPromiseResolveBlock,
                                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    // On iOS, detection auto-starts when listeners are added via startObserving()
    // This method is provided for API consistency with Android
    // Manually trigger setup if not already started
    if biometricChangeObserver == nil {
      lastBiometricState = getCurrentBiometricState()
      setupBiometricChangeDetection()
      ReactNativeBiometricDebug.debugLog("Manual start: biometric change detection started")
    } else {
      ReactNativeBiometricDebug.debugLog("Manual start: detection already running")
    }
    resolve(nil)
  }

  @objc
  func stopBiometricChangeDetection(_ resolve: @escaping RCTPromiseResolveBlock,
                                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    // On iOS, detection auto-stops when listeners are removed via stopObserving()
    // This method is provided for API consistency with Android
    if let observer = biometricChangeObserver {
      NotificationCenter.default.removeObserver(observer)
      biometricChangeObserver = nil
      lastBiometricState = nil
      ReactNativeBiometricDebug.debugLog("Manual stop: biometric change detection stopped")
    } else {
      ReactNativeBiometricDebug.debugLog("Manual stop: detection not running")
    }
    resolve(nil)
  }

  @objc
  func isSensorAvailable(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("isSensorAvailable called")
    let context = LAContext()
    var error: NSError?
    
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
      var biometryType: String
      
      if #available(iOS 11.0, *) {
        switch context.biometryType {
        case .faceID:
          biometryType = "FaceID"
          ReactNativeBiometricDebug.debugLog("FaceID available")
        case .touchID:
          biometryType = "TouchID"
          ReactNativeBiometricDebug.debugLog("TouchID available")
        default:
          if #available(iOS 17.0, *), context.biometryType == .opticID {
            biometryType = "OpticID"
            ReactNativeBiometricDebug.debugLog("OpticID available")
          } else {
            biometryType = "Biometrics"
            ReactNativeBiometricDebug.debugLog("Generic biometrics available")
          }
        }
      } else {
        biometryType = "Biometrics"
        ReactNativeBiometricDebug.debugLog("Legacy biometrics available")
      }
      
      ReactNativeBiometricDebug.debugLog("isSensorAvailable result: available=true, biometryType=\(biometryType)")
      resolve(["available": true, "biometryType": biometryType])
    } else {
      let biometricsError: ReactNativeBiometricsError
      if let laError = error as? LAError {
        biometricsError = ReactNativeBiometricsError.fromLAError(laError)
      } else {
        biometricsError = .biometryNotAvailable
      }
      
      let errorInfo = biometricsError.errorInfo
      ReactNativeBiometricDebug.debugLog("Biometric sensor not available: \(errorInfo.message)")
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
    ReactNativeBiometricDebug.debugLog("simplePrompt called with reason: \(reason)")
    let context = LAContext()
    
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) {
      ReactNativeBiometricDebug.debugLog("Showing biometric prompt")
      context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason as String) { success, error in
        DispatchQueue.main.async {
          if success {
            ReactNativeBiometricDebug.debugLog("simplePrompt authentication succeeded")
            resolve(
              [
                "success": success
              ]
            )
          } else {
            let biometricsError: ReactNativeBiometricsError
            if let laError = error as? LAError {
              biometricsError = ReactNativeBiometricsError.fromLAError(laError)
            } else {
              biometricsError = .authenticationFailed
            }
            handleError(biometricsError, reject: reject)
          }
        }
      }
    } else {
      ReactNativeBiometricDebug.debugLog("Biometric sensor not available for simplePrompt")
      handleError(.biometryNotAvailable, reject: reject)
    }
  }
  
  @objc
  func authenticateWithOptions(_ options: NSDictionary,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("authenticateWithOptions called with options: \(options)")
    let context = LAContext()
    
    let title = options["title"] as? String ?? "Biometric Authentication"
    let subtitle = options["subtitle"] as? String
    let description = options["description"] as? String
    let fallbackLabel = options["fallbackLabel"] as? String
    let cancelLabel = options["cancelLabel"] as? String
    let allowDeviceCredentials = options["allowDeviceCredentials"] as? Bool ?? false
    let disableDeviceFallback = options["disableDeviceFallback"] as? Bool ?? false
    
    ReactNativeBiometricDebug.debugLog("Authentication options - title: \(title), allowDeviceCredentials: \(allowDeviceCredentials), disableDeviceFallback: \(disableDeviceFallback)")
    
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
    ReactNativeBiometricDebug.debugLog("Fallback title: \(context.localizedFallbackTitle ?? "nil")")
    ReactNativeBiometricDebug.debugLog("Cancel title: \(context.localizedCancelTitle ?? "nil")")
    ReactNativeBiometricDebug.debugLog("Disable fallback: \(disableDeviceFallback)")
    
    // Determine authentication policy
    let policy: LAPolicy = allowDeviceCredentials ?
      .deviceOwnerAuthentication :
      .deviceOwnerAuthenticationWithBiometrics
    
    ReactNativeBiometricDebug.debugLog("Using authentication policy: \(policy == .deviceOwnerAuthentication ? "deviceOwnerAuthentication" : "deviceOwnerAuthenticationWithBiometrics")")
    
    // Create reason string
    var reason = title
    if let subtitle = subtitle, !subtitle.isEmpty {
      reason += "\n" + subtitle
    }
    if let description = description, !description.isEmpty {
      reason += "\n" + description
    }
    
    ReactNativeBiometricDebug.debugLog("Authentication reason: \(reason)")
    
    if context.canEvaluatePolicy(policy, error: nil) {
      ReactNativeBiometricDebug.debugLog("Showing authentication prompt")
      context.evaluatePolicy(policy, localizedReason: reason) { success, error in
        DispatchQueue.main.async {
          let result: [String: Any] = [
            "success": success
          ]
          
          if success {
            ReactNativeBiometricDebug.debugLog("authenticateWithOptions authentication succeeded")
            resolve(result)
          } else {
            let biometricsError: ReactNativeBiometricsError
            if let laError = error as? LAError {
              biometricsError = ReactNativeBiometricsError.fromLAError(laError)
            } else {
              biometricsError = .authenticationFailed
            }
            
            ReactNativeBiometricDebug.debugLog("authenticateWithOptions authentication failed: \(biometricsError.errorInfo.message)")
            handleError(biometricsError, reject: reject)
          }
        }
      }
    } else {
      ReactNativeBiometricDebug.debugLog("Biometric authentication not available - policy cannot be evaluated")
      handleError(.biometryNotAvailable, reject: reject)
    }
  }
  
  // MARK: - Debugging Utilities
  
  @objc
  func getDiagnosticInfo(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("getDiagnosticInfo called")
    let result = ReactNativeBiometricDebug.getDiagnosticInfo()
    resolve(result)
  }
  
  @objc
  func runBiometricTest(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("runBiometricTest called")
    let result = ReactNativeBiometricDebug.runBiometricTest()
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
    ReactNativeBiometricDebug.debugLog("configureKeyAlias called with: \(keyAlias)")
    
    // Validate key alias
    let aliasString = keyAlias as String
    if aliasString.isEmpty {
      handleError(.emptyKeyAlias, reject: reject)
      return
    }
    
    // Store the configured key alias
    configuredKeyAlias = aliasString
    UserDefaults.standard.set(aliasString, forKey: "ReactNativeBiometricsKeyAlias")
    
    ReactNativeBiometricDebug.debugLog("Key alias configured successfully: \(aliasString)")
    resolve(nil)
  }
  
  @objc
  func getDefaultKeyAlias(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    let defaultAlias = getKeyAlias()
    ReactNativeBiometricDebug.debugLog("getDefaultKeyAlias returning: \(defaultAlias)")
    resolve(defaultAlias)
  }
  
  // MARK: - Private Helper Methods
  // Debug and diagnostic utilities have been moved to ReactNativeBiometricDebug
  
  @objc
  func createKeys(_ keyAlias: NSString?,
                  keyType: NSString?,
                  biometricStrength: NSString?,
                  allowDeviceCredentials: NSNumber?,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {

    let deviceCredentialsFallback = allowDeviceCredentials?.boolValue ?? false

    ReactNativeBiometricDebug.debugLog("createKeys called with keyAlias: \(keyAlias ?? "default"), keyType: \(keyType ?? "ec256"), biometricStrength: \(biometricStrength ?? "strong"), allowDeviceCredentials: \(deviceCredentialsFallback)")

    let keyTag = getKeyAlias(keyAlias as String?)
    guard let keyTagData = keyTag.data(using: .utf8) else {
      handleError(.dataEncodingFailed, reject: reject)
      return
    }
    
    // Parse key type
    let biometricKeyType: BiometricKeyType
    if let keyTypeString = keyType as String?, keyTypeString.lowercased() == "rsa2048" {
      biometricKeyType = .rsa2048
    } else {
      biometricKeyType = .ec256
    }
    
    // Delete existing key if it exists
    // For RSA keys, we need to delete without Secure Enclave attributes
    // For EC keys, we include Secure Enclave attributes
    let deleteQuery = createKeychainQuery(keyTag: keyTag, includeSecureEnclave: biometricKeyType == .ec256)
    SecItemDelete(deleteQuery as CFDictionary)
    
    // Also try deleting without Secure Enclave attributes for RSA keys to ensure cleanup
    if biometricKeyType == .rsa2048 {
      let fallbackDeleteQuery = createKeychainQuery(keyTag: keyTag, includeSecureEnclave: false)
      SecItemDelete(fallbackDeleteQuery as CFDictionary)
    }
    
    ReactNativeBiometricDebug.debugLog("Deleted existing key (if any)")
    
    // Create access control for biometric authentication
    guard let accessControl = createBiometricAccessControl(
      for: biometricKeyType,
      allowDeviceCredentialsFallback: deviceCredentialsFallback
    ) else {
      ReactNativeBiometricDebug.debugLog("createKeys failed - Could not create access control")
      handleError(.accessControlCreationFailed, reject: reject)
      return
    }
    
    // Key generation parameters
    let keyAttributes = createKeyGenerationAttributes(keyTagData: keyTagData, accessControl: accessControl, keyType: biometricKeyType)
    
    var error: Unmanaged<CFError>?
    guard let privateKey = SecKeyCreateRandomKey(keyAttributes as CFDictionary, &error) else {
      let biometricsError = ReactNativeBiometricsError.keyCreationFailed
      if let cfError = error?.takeRetainedValue() {
        ReactNativeBiometricDebug.debugLog("createKeys failed - Key generation error: \(cfError.localizedDescription)")
      } else {
        ReactNativeBiometricDebug.debugLog("createKeys failed - Key generation error: Unknown")
      }
      handleError(biometricsError, reject: reject)
      return
    }
    
    // Get public key
    guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
      ReactNativeBiometricDebug.debugLog("createKeys failed - Could not extract public key")
      handleError(.publicKeyExtractionFailed, reject: reject)
      return
    }
    
    // Export public key
    guard let publicKeyBase64 = exportPublicKeyToBase64(publicKey) else {
      ReactNativeBiometricDebug.debugLog("createKeys failed - Public key export error")
      handleError(.keyExportFailed, reject: reject)
      return
    }
    
    let result: [String: Any] = [
      "publicKey": publicKeyBase64
    ]
    
    ReactNativeBiometricDebug.debugLog("Keys created successfully with tag: \(keyTag), type: \(biometricKeyType)")
    resolve(result)
  }
  
  @objc
  func deleteKeys(_ keyAlias: NSString?,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("deleteKeys called with keyAlias: \(keyAlias ?? "default")")
    
    let keyTag = getKeyAlias(keyAlias as String?)
    
    // Query to find the key
    var query = createKeychainQuery(keyTag: keyTag, includeSecureEnclave: false)
    // Use LAContext with interaction disabled instead of deprecated kSecUseAuthenticationUIFail
    if #available(iOS 16.0, *) {
      let noUIContext = LAContext()
      noUIContext.interactionNotAllowed = true
      query[kSecUseAuthenticationContext as String] = noUIContext
    } else {
      query[kSecUseAuthenticationUI as String] = kSecUseAuthenticationUIFail
    }
    
    // Check if key exists first
    let checkStatus = SecItemCopyMatching(query as CFDictionary, nil)
    
    if checkStatus == errSecItemNotFound {
      ReactNativeBiometricDebug.debugLog("No key found with tag '\(keyTag)' - nothing to delete")
      resolve(["success": true])
      return
    }
    
    // Delete the key
    let deleteStatus = SecItemDelete(query as CFDictionary)
    
    switch deleteStatus {
    case errSecSuccess:
      ReactNativeBiometricDebug.debugLog("Key with tag '\(keyTag)' deleted successfully")
      
      // Verify deletion
      let verifyStatus = SecItemCopyMatching(query as CFDictionary, nil)
      if verifyStatus == errSecItemNotFound {
        ReactNativeBiometricDebug.debugLog("Keys deleted and verified successfully")
        resolve(["success": true])
      } else {
        ReactNativeBiometricDebug.debugLog("deleteKeys failed - Key still exists after deletion attempt")
        handleError(.keyDeletionFailed, reject: reject)
      }
      
    case errSecItemNotFound:
      ReactNativeBiometricDebug.debugLog("No key found with tag '\(keyTag)' - nothing to delete")
      resolve(["success": true])
      
    default:
      ReactNativeBiometricDebug.debugLog("deleteKeys failed - Keychain error: status \(deleteStatus)")
      let biometricsError = ReactNativeBiometricsError.fromOSStatus(deleteStatus)
      handleError(biometricsError, reject: reject)
    }
  }
  
  @objc
  func getAllKeys(_ customAlias: NSString?,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("getAllKeys called with customAlias: \(customAlias ?? "nil")")
    
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
        ReactNativeBiometricDebug.debugLog("getAllKeys failed - Invalid result format")
        handleError(.keychainQueryFailed, reject: reject)
        return
      }
      
      var keysList: [[String: Any]] = []
      
      for item in items {
        // Filter for our biometric keys
        if let keyTag = item[kSecAttrApplicationTag as String] as? Data,
           let keyTagString = String(data: keyTag, encoding: .utf8) {
          
          // If customAlias is provided, filter for that specific alias
          // Otherwise, check if it exactly matches our key alias (default behavior)
          let shouldIncludeKey: Bool
          if let customAlias = customAlias as String? {
            let targetAlias = getKeyAlias(customAlias)
            shouldIncludeKey = keyTagString == targetAlias
          } else {
            // Default behavior: include all keys that exactly match our key alias pattern
            shouldIncludeKey = keyTagString == getKeyAlias()
          }
          
          if shouldIncludeKey {
            // Get the key reference
            guard let keyRef = item[kSecValueRef as String] as! SecKey? else {
              ReactNativeBiometricDebug.debugLog("Failed to get key reference for tag: \(keyTagString)")
              continue
            }
            
            // Get the public key from the private key reference
            if let publicKey = SecKeyCopyPublicKey(keyRef) {
              // Export the public key data
              if let publicKeyString = exportPublicKeyToBase64(publicKey) {
                let keyInfo: [String: Any] = [
                  "alias": keyTagString,
                  "publicKey": publicKeyString
                ]
                
                keysList.append(keyInfo)
                ReactNativeBiometricDebug.debugLog("Found key with tag: \(keyTagString)")
              } else {
                ReactNativeBiometricDebug.debugLog("Failed to export public key for tag: \(keyTagString)")
              }
            } else {
              ReactNativeBiometricDebug.debugLog("Failed to get public key for tag: \(keyTagString)")
            }
          }
        }
      }
      
      let resultDict: [String: Any] = [
        "keys": keysList
      ]
      
      ReactNativeBiometricDebug.debugLog("getAllKeys completed successfully, found \(keysList.count) keys")
      resolve(resultDict)
      
    case errSecItemNotFound:
      ReactNativeBiometricDebug.debugLog("getAllKeys completed - No keys found")
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
    ReactNativeBiometricDebug.debugLog("validateKeyIntegrity called with keyAlias: \(keyAlias ?? "default")")
    
    let keyTag = getKeyAlias(keyAlias as String?)
    
    // Try to find the key - first with Secure Enclave (for EC keys), then without (for RSA keys)
    var result: CFTypeRef?
    var status: OSStatus
    
    // First try with Secure Enclave (for EC keys)
    let secureEnclaveQuery = createKeychainQuery(
      keyTag: keyTag,
      includeSecureEnclave: true,
      returnRef: true,
      returnAttributes: true
    )
    
    status = SecItemCopyMatching(secureEnclaveQuery as CFDictionary, &result)
    
    // If not found with Secure Enclave, try without (for RSA keys)
    if status == errSecItemNotFound {
      let regularQuery = createKeychainQuery(
        keyTag: keyTag,
        includeSecureEnclave: false,
        returnRef: true,
        returnAttributes: true
      )
      
      status = SecItemCopyMatching(regularQuery as CFDictionary, &result)
    }
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
        ReactNativeBiometricDebug.debugLog("validateKeyIntegrity - Key not found")
        resolve(integrityResult)
      } else {
        let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
        ReactNativeBiometricDebug.debugLog("validateKeyIntegrity failed - Keychain error: \(biometricsError.errorInfo.message)")
        integrityResult["error"] = biometricsError.errorInfo.message
        resolve(integrityResult)
      }
      return
    }
    
    guard let keyItem = result as? [String: Any],
          let keyRefValue = keyItem[kSecValueRef as String] else {
      ReactNativeBiometricDebug.debugLog("validateKeyIntegrity failed - Invalid key reference")
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
    
    // Directly attempt signature creation; Secure Enclave will prompt as needed
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
        ReactNativeBiometricDebug.debugLog("validateKeyIntegrity - Public key extraction failed for verification.")
        checks["signatureTestPassed"] = false
        integrityResult["error"] = ReactNativeBiometricsError.publicKeyExtractionFailed.errorInfo.message
      }
    } else {
      let biometricsError: ReactNativeBiometricsError
      if let cfError = error?.takeRetainedValue() {
        // Map common auth-related errors
        let errorCode = CFErrorGetCode(cfError)
        if errorCode == errSecUserCanceled {
          biometricsError = .userCancel
        } else if errorCode == errSecAuthFailed {
          biometricsError = .authenticationFailed
        } else {
          biometricsError = .signatureCreationFailed
        }
        ReactNativeBiometricDebug.debugLog("validateKeyIntegrity - Signature test failed: \(cfError.localizedDescription)")
      } else {
        biometricsError = .signatureCreationFailed
        ReactNativeBiometricDebug.debugLog("validateKeyIntegrity - Signature test failed: Unknown error")
      }
      checks["signatureTestPassed"] = false
      integrityResult["error"] = biometricsError.errorInfo.message
    }
    
    integrityResult["integrityChecks"] = checks
    ReactNativeBiometricDebug.debugLog("validateKeyIntegrity completed")
    resolve(integrityResult)
  }
  
  @objc
  func verifyKeySignature(_ keyAlias: NSString?,
                          data: NSString,
                          promptTitle: NSString?,
                          promptSubtitle: NSString?,
                          cancelButtonText: NSString?,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    verifyKeySignatureWithEncoding(keyAlias, data: data, promptTitle: promptTitle, promptSubtitle: promptSubtitle, cancelButtonText: cancelButtonText, inputEncoding: "utf8", resolver: resolve, rejecter: reject)
  }

  @objc
  func verifyKeySignatureWithOptions(_ keyAlias: NSString?,
                          data: NSString,
                          promptTitle: NSString?,
                          promptSubtitle: NSString?,
                          cancelButtonText: NSString?,
                          biometricStrength: NSString?,
                          disableDeviceFallback: NSNumber?,
                          inputEncoding: NSString?,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    verifyKeySignatureWithEncoding(keyAlias, data: data, promptTitle: promptTitle, promptSubtitle: promptSubtitle, cancelButtonText: cancelButtonText, inputEncoding: inputEncoding, resolver: resolve, rejecter: reject)
  }

  @objc
  func verifyKeySignatureWithEncoding(_ keyAlias: NSString?,
                          data: NSString,
                          promptTitle: NSString?,
                          promptSubtitle: NSString?,
                          cancelButtonText: NSString?,
                          inputEncoding: NSString?,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    let encoding = (inputEncoding as String?) ?? "utf8"
    ReactNativeBiometricDebug.debugLog("verifyKeySignature called with keyAlias: \(keyAlias ?? "default"), inputEncoding: \(encoding)")

    let keyTag = getKeyAlias(keyAlias as String?)
    
    // Try to find the key - first with Secure Enclave (for EC keys), then without (for RSA keys)
    var result: CFTypeRef?
    var status: OSStatus
    
    // First try with Secure Enclave (for EC keys)
    let secureEnclaveQuery = createKeychainQuery(
      keyTag: keyTag,
      includeSecureEnclave: true,
      promptTitle: promptTitle,
      cancelButtonText: cancelButtonText,
      returnRef: true
    )
    
    status = SecItemCopyMatching(secureEnclaveQuery as CFDictionary, &result)
    
    // If not found with Secure Enclave, try without (for RSA keys)
    if status == errSecItemNotFound {
      let regularQuery = createKeychainQuery(
        keyTag: keyTag,
        includeSecureEnclave: false,
        promptTitle: promptTitle,
        cancelButtonText: cancelButtonText,
        returnRef: true
      )
      
      status = SecItemCopyMatching(regularQuery as CFDictionary, &result)
    }
    guard status == errSecSuccess else {
      let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
      ReactNativeBiometricDebug.debugLog("verifyKeySignature failed - \(biometricsError.errorInfo.message)")
      resolve(["success": false, "error": biometricsError.errorInfo.message, "errorCode": biometricsError.errorInfo.code])
      return
    }
    
    // Force cast SecKey since conditional downcast to CoreFoundation types always succeeds
    let keyRef = result as! SecKey
    let algorithm = getSignatureAlgorithm(for: keyRef)

    // Decode data based on input encoding
    let dataToSign: Data
    if encoding.lowercased() == "base64" {
      guard let decodedData = Data(base64Encoded: data as String) else {
        ReactNativeBiometricDebug.debugLog("verifyKeySignature failed - Invalid base64 data")
        resolve(["success": false, "error": "Invalid base64 data", "errorCode": "INVALID_INPUT_ENCODING"])
        return
      }
      dataToSign = decodedData
    } else {
      guard let utf8Data = (data as String).data(using: .utf8) else {
        handleError(.dataEncodingFailed, reject: reject)
        return
      }
      dataToSign = utf8Data
    }
    
    // SecKeyCreateSignature will automatically handle biometric authentication for Secure Enclave keys
    var error: Unmanaged<CFError>?
    guard let signature = SecKeyCreateSignature(keyRef, algorithm, dataToSign as CFData, &error) else {
      let biometricsError: ReactNativeBiometricsError
      if let cfError = error?.takeRetainedValue() {
        // Check if the error is due to user cancellation or authentication failure
        let errorCode = CFErrorGetCode(cfError)
        if errorCode == errSecUserCanceled {
          biometricsError = ReactNativeBiometricsError.userCancel
        } else if errorCode == errSecAuthFailed {
          biometricsError = ReactNativeBiometricsError.authenticationFailed
        } else {
          biometricsError = ReactNativeBiometricsError.signatureCreationFailed
        }
        ReactNativeBiometricDebug.debugLog("verifyKeySignature failed - \(cfError.localizedDescription)")
      } else {
        biometricsError = ReactNativeBiometricsError.signatureCreationFailed
        ReactNativeBiometricDebug.debugLog("verifyKeySignature failed - Signature creation failed (unknown error)")
      }
      resolve(["success": false, "error": biometricsError.errorInfo.message, "errorCode": biometricsError.errorInfo.code])
      return
    }
    
    let signatureBase64 = (signature as Data).base64EncodedString()
    
    ReactNativeBiometricDebug.debugLog("verifyKeySignature completed successfully")
    resolve(["success": true, "signature": signatureBase64])
  }
  
  @objc
  func validateSignature(_ keyAlias: NSString?,
                         data: NSString,
                         signature: NSString,
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("validateSignature called with keyAlias: \(keyAlias ?? "default")")
    
    // Enhanced input validation
    let dataString = data as String
    let signatureString = signature as String
    
    guard !dataString.isEmpty else {
      ReactNativeBiometricDebug.debugLog("validateSignature failed - Empty data provided")
      resolve(["valid": false, "error": "Empty data provided"])
      return
    }
    
    guard !signatureString.isEmpty else {
      ReactNativeBiometricDebug.debugLog("validateSignature failed - Empty signature provided")
      resolve(["valid": false, "error": "Empty signature provided"])
      return
    }
    
    let keyTag = getKeyAlias(keyAlias as String?)
    
    // Try to find the key - first with Secure Enclave (for EC keys), then without (for RSA keys)
    var result: CFTypeRef?
    var status: OSStatus
    
    // First try with Secure Enclave (for EC keys)
    let secureEnclaveQuery = createKeychainQuery(
      keyTag: keyTag,
      includeSecureEnclave: true,
      returnRef: true
    )
    
    status = SecItemCopyMatching(secureEnclaveQuery as CFDictionary, &result)
    
    // If not found with Secure Enclave, try without (for RSA keys)
    if status == errSecItemNotFound {
      let regularQuery = createKeychainQuery(
        keyTag: keyTag,
        includeSecureEnclave: false,
        returnRef: true
      )
      
      status = SecItemCopyMatching(regularQuery as CFDictionary, &result)
    }
    guard status == errSecSuccess else {
      let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
      ReactNativeBiometricDebug.debugLog("validateSignature failed - \(biometricsError.errorInfo.message)")
      resolve(["valid": false, "error": biometricsError.errorInfo.message])
      return
    }
    
    // Force cast SecKey since conditional downcast to CoreFoundation types always succeeds
    let keyRef = result as! SecKey
    
    guard let publicKey = SecKeyCopyPublicKey(keyRef) else {
      ReactNativeBiometricDebug.debugLog("validateSignature failed - Could not extract public key")
      resolve(["valid": false, "error": "Could not extract public key"])
      return
    }
    
    // Enhanced signature validation with detailed error context
    guard let signatureData = Data(base64Encoded: signatureString) else {
      ReactNativeBiometricDebug.debugLog("validateSignature failed - Invalid base64 signature format. Length: \(signatureString.count), First 20 chars: \(String(signatureString.prefix(20)))")
      resolve(["valid": false, "error": "Invalid base64 signature format"])
      return
    }
    
    guard let dataToVerify = dataString.data(using: .utf8) else {
      resolve(["valid": false, "error": "Data encoding failed"])
      return
    }
    var error: Unmanaged<CFError>?
    
    // Use the appropriate signature algorithm based on key type
    let algorithm = getSignatureAlgorithm(for: keyRef)
    
    let isValid = SecKeyVerifySignature(publicKey, algorithm, dataToVerify as CFData, signatureData as CFData, &error)
    
    if let cfError = error?.takeRetainedValue() {
      let biometricsError = ReactNativeBiometricsError.signatureVerificationFailed
      ReactNativeBiometricDebug.debugLog("validateSignature failed - \(cfError.localizedDescription)")
      resolve(["valid": false, "error": biometricsError.errorInfo.message])
    } else {
      ReactNativeBiometricDebug.debugLog("validateSignature completed - valid: \(isValid)")
      resolve(["valid": isValid])
    }
  }
  
  @objc
  func getKeyAttributes(_ keyAlias: NSString?,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("getKeyAttributes called with keyAlias: \(keyAlias ?? "default")")
    
    let keyTag = getKeyAlias(keyAlias as String?)
    // Try to find the key - first with Secure Enclave (for EC keys), then without (for RSA keys)
    var result: CFTypeRef?
    var status: OSStatus
    
    // First try with Secure Enclave (for EC keys)
    var secureEnclaveQuery = createKeychainQuery(
      keyTag: keyTag,
      includeSecureEnclave: true,
      returnRef: true,
      returnAttributes: true
    )
    // Use LAContext with interaction disabled instead of deprecated kSecUseAuthenticationUIFail
    if #available(iOS 16.0, *) {
      let noUIContext = LAContext()
      noUIContext.interactionNotAllowed = true
      secureEnclaveQuery[kSecUseAuthenticationContext as String] = noUIContext
    } else {
      secureEnclaveQuery[kSecUseAuthenticationUI as String] = kSecUseAuthenticationUIFail
    }
    
    status = SecItemCopyMatching(secureEnclaveQuery as CFDictionary, &result)
    
    // If not found with Secure Enclave, try without (for RSA keys)
    if status == errSecItemNotFound {
      var regularQuery = createKeychainQuery(
        keyTag: keyTag,
        includeSecureEnclave: false,
        returnRef: true,
        returnAttributes: true
      )
      if #available(iOS 16.0, *) {
        let noUIContext = LAContext()
        noUIContext.interactionNotAllowed = true
        regularQuery[kSecUseAuthenticationContext as String] = noUIContext
      } else {
        regularQuery[kSecUseAuthenticationUI as String] = kSecUseAuthenticationUIFail
      }
      
      status = SecItemCopyMatching(regularQuery as CFDictionary, &result)
    }
    guard status == errSecSuccess else {
      if status == errSecItemNotFound {
        ReactNativeBiometricDebug.debugLog("getKeyAttributes - Key not found")
        resolve(["exists": false])
      } else if status == errSecInteractionNotAllowed {
        ReactNativeBiometricDebug.debugLog("getKeyAttributes - Key exists but authentication required (UI disabled)")
        resolve([
          "exists": true,
          "attributes": [
            "userAuthenticationRequired": true
          ]
        ])
      } else {
        let biometricsError = ReactNativeBiometricsError.fromOSStatus(status)
        ReactNativeBiometricDebug.debugLog("getKeyAttributes failed - \(biometricsError.errorInfo.message)")
        resolve(["exists": false, "error": biometricsError.errorInfo.message, "errorCode": biometricsError.errorInfo.code])
      }
      return
    }
    
    guard let keyItem = result as? [String: Any],
          let keyRefValue = keyItem[kSecValueRef as String] else {
      ReactNativeBiometricDebug.debugLog("getKeyAttributes failed - Invalid key reference")
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
    
    ReactNativeBiometricDebug.debugLog("getKeyAttributes completed successfully")
    resolve(["exists": true, "attributes": attributes])
  }
  
  @objc
  func getDeviceIntegrityStatus(_ resolver: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    ReactNativeBiometricDebug.debugLog("getDeviceIntegrityStatus called")
    
    // Call the global function from Utils.swift
    let integrityStatus: [String: Any] = {
      let isJailbroken = isDeviceJailbroken()
      return [
        "isJailbroken": isJailbroken,
        "isCompromised": isJailbroken,
        "riskLevel": isJailbroken ? "HIGH" : "NONE"
      ]
    }()
    
    ReactNativeBiometricDebug.debugLog("Device integrity check completed - isCompromised: \(integrityStatus["isCompromised"] as? Bool ?? false)")
    resolver(integrityStatus)
  }

  // MARK: - Biometric Change Detection

  private func setupBiometricChangeDetection() {
    // Listen for app becoming active to check for biometric changes
    biometricChangeObserver = NotificationCenter.default.addObserver(
      forName: UIApplication.didBecomeActiveNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.checkForBiometricChanges()
    }
  }

  private func getCurrentBiometricState() -> BiometricState {
    let context = LAContext()
    var error: NSError?
    let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)

    var biometryType: String = "None"
    var enrolledCount = 0
    var domainState: Data?

    if available {
      if #available(iOS 11.0, *) {
        switch context.biometryType {
        case .faceID:
          biometryType = "FaceID"
        case .touchID:
          biometryType = "TouchID"
        default:
          if #available(iOS 17.0, *), context.biometryType == .opticID {
            biometryType = "OpticID"
          } else {
            biometryType = "Biometrics"
          }
        }
      } else {
        biometryType = "Biometrics"
      }

      // Capture domain state for enrollment change detection
      // This changes whenever biometric enrollments are added/removed
      domainState = context.evaluatedPolicyDomainState

      // Set enrolledCount to 1 if available (actual count not exposed by iOS)
      enrolledCount = 1
    }

    return BiometricState(
      available: available,
      biometryType: biometryType,
      enrolledCount: enrolledCount,
      domainState: domainState
    )
  }

  private func checkForBiometricChanges() {
    let currentState = getCurrentBiometricState()

    guard let lastState = lastBiometricState else {
      lastBiometricState = currentState
      ReactNativeBiometricDebug.debugLog("Initial biometric state recorded")
      return
    }

    var changeType: String?

    // Detect changes with priority order
    if lastState.available != currentState.available {
      // Availability changed (biometrics enabled/disabled)
      changeType = currentState.available ? "BIOMETRIC_ENABLED" : "BIOMETRIC_DISABLED"
    } else if lastState.biometryType != currentState.biometryType {
      // Hardware type changed (e.g., device replacement)
      changeType = "HARDWARE_UNAVAILABLE"
    } else if lastState.domainState != currentState.domainState {
      // Domain state changed - this detects enrollment changes
      // (fingerprints/faces added or removed)
      changeType = "ENROLLMENT_CHANGED"
      ReactNativeBiometricDebug.debugLog("Domain state changed - enrollment modification detected")
    }

    if let changeType = changeType {
      let event: [String: Any] = [
        "timestamp": Date().timeIntervalSince1970 * 1000,
        "changeType": changeType,
        "biometryType": currentState.biometryType,
        "available": currentState.available,
        "enrolled": currentState.enrolledCount > 0
      ]

      sendEvent(withName: "onBiometricChange", body: event)
      lastBiometricState = currentState
      ReactNativeBiometricDebug.debugLog("Biometric state changed: \(changeType)")
    }
  }
}
