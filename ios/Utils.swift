// MARK: - Helper Methods
import Foundation
import Security
import LocalAuthentication
import React
import UIKit

/**
 * Determines the appropriate signature algorithm based on key type
 * - Parameter keyRef: The SecKey reference
 * - Returns: The appropriate SecKeyAlgorithm for the key type
 */
public func getSignatureAlgorithm(for keyRef: SecKey) -> SecKeyAlgorithm {
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
public func performBiometricAuthentication(
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

/**
 * Handles errors by rejecting the promise with proper error information
 * - Parameters:
 *   - error: The ReactNativeBiometricsError to handle
 *   - reject: The RCT promise reject block
 */
public func handleError(
  _ error: ReactNativeBiometricsError,
  reject: RCTPromiseRejectBlock
) {
  let errorInfo = error.errorInfo
  ReactNativeBiometricDebug.debugLog("Error: \(errorInfo.code) - \(errorInfo.message)")
  reject(errorInfo.code, errorInfo.message, error)
}

/**
 * Handles errors by resolving the promise with error information in the result
 * - Parameters:
 *   - error: The ReactNativeBiometricsError to handle
 *   - resolve: The RCT promise resolve block
 */
public func handleErrorWithResult(
  _ error: ReactNativeBiometricsError,
  resolve: @escaping RCTPromiseResolveBlock
) {
  let errorInfo = error.errorInfo
  ReactNativeBiometricDebug.debugLog("Error: \(errorInfo.code) - \(errorInfo.message)")
  resolve([
    "success": false,
    "error": errorInfo.message,
    "errorCode": errorInfo.code
  ])
}

/**
 * Generates a key alias based on custom alias or configured default
 * - Parameter customAlias: Optional custom alias to use
 * - Parameter configuredAlias: The configured default alias from UserDefaults
 * - Returns: The key alias to use
 */
public func generateKeyAlias(customAlias: String? = nil, configuredAlias: String? = nil) -> String {
  if let customAlias = customAlias {
    return customAlias
  }

  if let configuredAlias = configuredAlias {
    return configuredAlias
  }

  // Generate app-specific default key alias
  let bundleId = Bundle.main.bundleIdentifier ?? "unknown"
  return "\(bundleId).ReactNativeBiometricsKey"
}

/**
 * Creates a keychain query for finding keys
 * - Parameters:
 *   - keyTag: The key tag to search for
 *   - includeSecureEnclave: Whether to include Secure Enclave token in query
 *   - returnRef: Whether to return the key reference
 *   - returnAttributes: Whether to return key attributes
 * - Returns: The keychain query dictionary
 */
public func createKeychainQuery(
  keyTag: String,
  includeSecureEnclave: Bool = true,
  returnRef: Bool = false,
  returnAttributes: Bool = false
) -> [String: Any] {
  guard let keyTagData = keyTag.data(using: .utf8) else {
    return [:]
  }

  var query: [String: Any] = [
    kSecClass as String: kSecClassKey,
    kSecAttrApplicationTag as String: keyTagData
  ]

  if includeSecureEnclave {
    query[kSecAttrTokenID as String] = kSecAttrTokenIDSecureEnclave
  }

  if returnRef {
    query[kSecReturnRef as String] = true
  }

  if returnAttributes {
    query[kSecReturnAttributes as String] = true
  }

  return query
}

/**
 * Creates access control for biometric authentication
 * - Returns: SecAccessControl for biometric keys or nil if creation fails
 */
public func createBiometricAccessControl() -> SecAccessControl? {
  return SecAccessControlCreateWithFlags(
    kCFAllocatorDefault,
    kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
    [.biometryAny, .privateKeyUsage],
    nil
  )
}

/**
 * Creates key generation attributes for Secure Enclave keys
 * - Parameters:
 *   - keyTag: The key tag data
 *   - accessControl: The access control for the key
 * - Returns: Key generation attributes dictionary
 */
public func createKeyGenerationAttributes(
  keyTagData: Data,
  accessControl: SecAccessControl
) -> [String: Any] {
  return [
    kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
    kSecAttrKeySizeInBits as String: 256,
    kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
    kSecPrivateKeyAttrs as String: [
      kSecAttrIsPermanent as String: true,
      kSecAttrApplicationTag as String: keyTagData,
      kSecAttrAccessControl as String: accessControl
    ]
  ]
}

/**
 * Exports a public key to base64 string
 * - Parameter publicKey: The SecKey public key to export
 * - Returns: Base64 encoded public key string or nil if export fails
 */
public func exportPublicKeyToBase64(_ publicKey: SecKey) -> String? {
  var error: Unmanaged<CFError>?
  guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) else {
    if let cfError = error?.takeRetainedValue() {
      ReactNativeBiometricDebug.debugLog("Public key export error: \(cfError.localizedDescription)")
    }
    return nil
  }
  return (publicKeyData as Data).base64EncodedString()
}

/**
 * Checks if the device is jailbroken
 * This performs multiple checks to detect jailbreak
 */
public func isDeviceJailbroken() -> Bool {
  return checkJailbreakMethod1() || checkJailbreakMethod2() || checkJailbreakMethod3()
}

/**
 * Check for common jailbreak files and directories
 */
private func checkJailbreakMethod1() -> Bool {
  let jailbreakPaths = [
    "/Applications/Cydia.app",
    "/Library/MobileSubstrate/MobileSubstrate.dylib",
    "/bin/bash",
    "/usr/sbin/sshd",
    "/etc/apt",
    "/private/var/lib/apt/",
    "/private/var/lib/cydia",
    "/private/var/mobile/Library/SBSettings/Themes",
    "/Library/MobileSubstrate/DynamicLibraries/Veency.plist",
    "/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist",
    "/System/Library/LaunchDaemons/com.ikey.bbot.plist",
    "/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist",
    "/Applications/RockApp.app",
    "/Applications/Icy.app",
    "/Applications/WinterBoard.app",
    "/Applications/SBSettings.app",
    "/Applications/MxTube.app",
    "/Applications/IntelliScreen.app",
    "/Applications/FakeCarrier.app",
    "/Applications/blackra1n.app",
    "/usr/bin/sshd",
    "/usr/libexec/sftp-server",
    "/usr/libexec/ssh-keysign",
    "/var/cache/apt",
    "/var/lib/apt",
    "/var/lib/cydia",
    "/var/log/syslog",
    "/var/tmp/cydia.log",
    "/bin/su",
    "/usr/bin/su",
    "/usr/sbin/frida-server",
    "/usr/bin/cycript",
    "/usr/local/bin/cycript",
    "/usr/lib/libcycript.dylib",
    "/System/Library/LaunchDaemons/com.openssh.sshd.plist"
  ]
  
  for path in jailbreakPaths {
    if FileManager.default.fileExists(atPath: path) {
      return true
    }
  }
  return false
}

/**
 * Check if we can write to system directories (jailbroken devices allow this)
 */
private func checkJailbreakMethod2() -> Bool {
  let testString = "jailbreak_test"
  let testPaths = [
    "/private/jailbreak_test.txt",
    "/private/var/mobile/jailbreak_test.txt"
  ]
  
  for path in testPaths {
    do {
      try testString.write(toFile: path, atomically: true, encoding: .utf8)
      try FileManager.default.removeItem(atPath: path)
      return true
    } catch {
      // Cannot write, continue
    }
  }
  return false
}

/**
 * Check for suspicious environment variables and system behavior
 */
private func checkJailbreakMethod3() -> Bool {
  // Check for suspicious environment variables
  if let dyldInsertLibraries = getenv("DYLD_INSERT_LIBRARIES") {
    let libraries = String(cString: dyldInsertLibraries)
    if libraries.contains("MobileSubstrate") || libraries.contains("cycript") {
      return true
    }
  }
  
  // Check if we can open suspicious URLs (jailbroken devices may have custom URL schemes)
  let suspiciousURLs = [
    "cydia://package/com.example.package",
    "sileo://package/com.example.package",
    "zbra://package/com.example.package"
  ]
  
  for urlString in suspiciousURLs {
    if let url = URL(string: urlString) {
      if UIApplication.shared.canOpenURL(url) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Checks if the device is compromised (jailbroken or has security issues)
 */
public func isDeviceCompromised() -> Bool {
  return isDeviceJailbroken()
}

/**
 * Gets device integrity status
 */
public func getDeviceIntegrityStatus() -> [String: Any] {
  let isJailbroken = isDeviceJailbroken()
  
  return [
    "isJailbroken": isJailbroken,
    "isCompromised": isJailbroken,
    "riskLevel": isJailbroken ? "HIGH" : "NONE"
  ]
}
